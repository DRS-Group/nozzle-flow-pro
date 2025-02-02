#include <SPI.h>
#include <mcp_can.h>

const int CAN_CS = 5;   // Pino CS do MCP2515
const int CAN_INT = 4;  // Pino de interrupção do MCP2515
MCP_CAN CAN(CAN_CS);    // Cria um objeto MCP_CAN

const int numFluxometros = 9;  // 9 fluxômetros
int pinosFluxometros[numFluxometros] = { 22, 14, 26, 27, 35, 32, 25, 33, 34 };
volatile unsigned long pulsos[numFluxometros] = { 0 };
float constantes[numFluxometros] = { 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0 };  // Pulsos por litro
unsigned long tempoAnterior = 0;
const unsigned long intervalo = 1000;

void IRAM_ATTR contarPulso(void* arg) {
  int indice = (intptr_t)arg;  // Converte o argumento de volta para um inteiro
  pulsos[indice]++;
}

void setup() {
  Serial.begin(115200);

  // Configura os pinos dos fluxômetros
  for (int i = 0; i < numFluxometros; i++) {
    pinMode(pinosFluxometros[i], INPUT_PULLUP);
    attachInterruptArg(digitalPinToInterrupt(pinosFluxometros[i]), contarPulso, (void*)(intptr_t)i, RISING);
  }

  tempoAnterior = millis();

  // Inicializa a comunicação CAN
  if (CAN.begin(MCP_ANY, CAN_500KBPS, MCP_8MHZ) == CAN_OK) {
    Serial.println("CAN MCP2515 iniciado com sucesso");
  } else {
    Serial.println("Falha ao iniciar o CAN MCP2515");
    while (1)
      ;
  }
  CAN.setMode(MCP_NORMAL);  // Define o modo normal
}

void loop() {
  unsigned long tempoAtual = millis();

  // Verifica se há nova mensagem CAN
  if (CAN.checkReceive() == CAN_MSGAVAIL) {
    receberConfiguracao();
  }

  if (tempoAtual - tempoAnterior >= intervalo) {
    for (int i = 0; i < numFluxometros; i++) {
      // Converte pulsos para L/min usando a constante configurada (pulsos por litro)
      float litros = (1000.0 / (tempoAtual - tempoAnterior)) * pulsos[i] / constantes[i];
      float lpm = litros * 60;

      byte data[4];
      memcpy(data, &lpm, sizeof(lpm));  // Converte o valor float para um array de bytes

      // Envia os dados via CAN
      if (CAN.sendMsgBuf(0x100 + i, 0, 4, data) == CAN_OK) {
        Serial.print("Fluxometro ");
        Serial.print(i + 1);
        Serial.print(": ");
        Serial.print(lpm);
        Serial.println(" L/min enviado");
      } else {
        Serial.println("Erro ao enviar dados CAN");
      }

      pulsos[i] = 0;  // Reinicia a contagem de pulsos
    }
    tempoAnterior = tempoAtual;
  }

  // Verifica se o usuário quer entrar no menu de configuração
  if (Serial.available()) {
    char comando = Serial.read();
    if (comando == 'n') {
      configurarConstantes();
    }
  }
}

void receberConfiguracao() {
  unsigned char len = 0;
  unsigned char buf[4];  // Buffer para armazenar os dados recebidos
  unsigned long canId;   // Variável para armazenar o ID da mensagem CAN

  // Verifica se há mensagens CAN disponíveis
  if (CAN.checkReceive() == CAN_MSGAVAIL) {
    // Lê a mensagem CAN com ID, comprimento e dados
    if (CAN.readMsgBuf(&canId, &len, buf) == CAN_OK) {
      int id = canId - 0x200;  // Ajuste conforme o ID esperado (0x200 seria o offset do seu ID base)

      if (id >= 0 && id < numFluxometros) {
        float novaConstante;
        memcpy(&novaConstante, buf, sizeof(novaConstante));  // Converte o buffer recebido para float

        // Atualiza a constante do fluxômetro correspondente
        constantes[id] = novaConstante;
        Serial.print("Nova constante recebida para fluxometro ");
        Serial.print(id + 1);
        Serial.print(": ");
        Serial.println(constantes[id]);
      }
    }
  }
}

void configurarConstantes() {
  Serial.println("Entrando no modo de configuração...");

  for (int i = 0; i < numFluxometros; i++) {
    Serial.print("Configurar constante do fluxometro ");
    Serial.print(i + 1);
    Serial.print(" (atual: ");
    Serial.print(constantes[i]);
    Serial.println(" pulsos por litro): ");

    while (Serial.available() == 0)
      ;                                   // Espera o usuário inserir o valor
    constantes[i] = Serial.parseFloat();  // Lê o valor inserido

    Serial.print("Nova constante para fluxometro ");
    Serial.print(i + 1);
    Serial.print(": ");
    Serial.println(constantes[i]);
  }

  Serial.println("Configurações concluídas. Retornando à leitura dos fluxos...");
}