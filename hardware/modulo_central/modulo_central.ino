#include <SPI.h>
#include <mcp_can.h>
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>

const int CAN_CS = 5;   // Pino CS do MCP2515
const int CAN_INT = 4;  // Pino de interrupção do MCP2515
MCP_CAN CAN(CAN_CS);    // Cria um objeto MCP_CAN

TinyGPSPlus gps;
HardwareSerial mySerial(1);

// Variáveis para armazenar os dados dos fluxômetros
float fluxometroData[9] = { 0 };                                                              // Array para armazenar até 8 fluxômetros
float pulsosPorLitro[9] = { 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0 };  // Constantes para cada fluxômetro
bool bombaAtiva = false;                                                                      // Exemplo, definir de acordo com a lógica do sistema
float velocidadeMaquina = 0;


volatile int PULSOS = 0;
const byte PINFLUXBOMBA = 22;
unsigned long MILIS_ATU = 0;
unsigned long MILIS_NOVO = 0;
bool AUX1 = true;

// Credenciais da rede Wi-Fi
const char *ssid = "tupido-EUA";
const char *password = "123456789";

// Criação do servidor web
AsyncWebServer server(80);

void setup() {
  Serial.begin(115200);
  mySerial.begin(9600, SERIAL_8N1, 25, 26);
  WiFi.softAP(ssid, password);
  // Define IP fixo para o ponto de acesso
  IPAddress local_IP(192, 168, 4, 1);
  IPAddress gateway(192, 168, 4, 1);
  IPAddress subnet(255, 255, 255, 0);
  if (!WiFi.softAPConfig(local_IP, gateway, subnet)) {
    Serial.println("Falha ao configurar o IP do ponto de acesso");
    return;
  }

  Serial.println("Ponto de acesso iniciado");
  Serial.print("IP Address: ");

  Serial.println(WiFi.softAPIP());

  // Inicializa a comunicação CAN
  if (CAN.begin(MCP_ANY, CAN_500KBPS, MCP_8MHZ) == CAN_OK) {
    Serial.println("CAN MCP2515 iniciado com sucesso");
  } else {
    Serial.println("Falha ao iniciar o CAN MCP2515");
    return;
  }
  CAN.setMode(MCP_NORMAL);  // Define o modo normal

  // Modificar o endpoint para enviar os novos dados
  server.on("/data", HTTP_GET, [](AsyncWebServerRequest *request) {
    String json = "{\"active\":" + String(bombaAtiva ? "true" : "false") + ",\"speed\":" + String(velocidadeMaquina) + ",\"flows\":[";
    for (int i = 0; i < 9; i++) {
      json += String(fluxometroData[i]);
      if (i < 8) json += ",";
    }
    json += "]}";
    request->send(200, "application/json", json);
  });

  // API para atualizar os pulsos por litro de um fluxômetro específico
  server.on("/calibrate", HTTP_POST, [](AsyncWebServerRequest *request) {
    if (request->hasParam("pulsesPerLiter", false) && request->hasParam("nozzleIndex", false)) {
      int nozzleIndex = request->getParam("nozzleIndex", false)->value().toFloat();
      float pulsesPerLiter = request->getParam("pulsesPerLiter", false)->value().toFloat();
      if (nozzleIndex >= 0 && nozzleIndex < 9) {
        pulsosPorLitro[nozzleIndex] = pulsesPerLiter;
        // Enviar via CAN para o fluxômetro específico
        byte data[4];
        memcpy(data, &pulsosPorLitro[nozzleIndex], sizeof(pulsosPorLitro[nozzleIndex]));
        CAN.sendMsgBuf(0x0200 + nozzleIndex, 0, sizeof(pulsosPorLitro[nozzleIndex]), data);
        request->send(200, "text/plain", "Fluxômetro " + String(nozzleIndex + 1) + " calibrado");
      } else {
        request->send(400, "text/plain", "Índice de fluxômetro inválido");
      }
    } else {
      request->send(400, "text/plain", "Parâmetros faltando");
    }
  });

  // API para atualizar os pulsos por litro de todos os fluxômetros
  server.on("/calibrateAll", HTTP_POST, [](AsyncWebServerRequest *request) {
    if (request->hasParam("pulsesPerLiter", false)) {
      float pulsesPerLiter = request->getParam("pulsesPerLiter", false)->value().toFloat();
      for (int i = 0; i < 9; i++) {
        pulsosPorLitro[i] = pulsesPerLiter;
        // Enviar via CAN para cada fluxômetro
        byte data[4];
        memcpy(data, &pulsosPorLitro[i], sizeof(pulsosPorLitro[i]));
        CAN.sendMsgBuf(0x0200 + i, 0, sizeof(pulsosPorLitro[i]), data);
        delay(50);
      }
      request->send(200, "text/plain", "Todos os fluxômetros calibrados");
    } else {
      request->send(400, "text/plain", "Parâmetros faltando");
    }
  });
  server.on("/interval", HTTP_POST, [](AsyncWebServerRequest *request) {
    // Verifica se o parâmetro 'interval' está presente
    if (request->hasParam("interval", false)) {
      float intervalo = request->getParam("interval", false)->value().toFloat();

      // Envia o valor do intervalo via CAN para o transmissor
      byte data[4];
      memcpy(data, &intervalo, sizeof(intervalo));
      // ID da mensagem CAN, por exemplo, 0x0300 para intervalo
      CAN.sendMsgBuf(0x0300, 0, sizeof(intervalo), data);
      request->send(200, "text/plain", "Intervalo atualizado para " + String(intervalo) + " ms");
    } else {
      request->send(400, "text/plain", "Parâmetro de intervalo faltando");
    }
  });
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "*");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "*");

  server.begin();
  Serial.println("Servidor web iniciado");
  attachInterrupt(digitalPinToInterrupt(PINFLUXBOMBA), FLUXO, RISING);
}

void FLUXO() {
  PULSOS++;  // Incrementa a contagem de pulsos, indicando fluxo de água medido pelo sensor
}

void loop() {

  MILIS_NOVO = millis();
  if ((MILIS_NOVO - MILIS_ATU) >= 1000) {
    bombaAtiva = PULSOS > 0;
    PULSOS = 0;
    MILIS_ATU = MILIS_NOVO;
  }


  unsigned long id;
  byte data[8];
  byte len = 0;

  while (mySerial.available() > 0) {
    gps.encode(mySerial.read());

    // Verifica se a localização foi atualizada
    if (gps.location.isUpdated()) {
      // Só atualiza a velocidade se for maior que 0,56 m/s
      if (gps.speed.mps() > 0.56) {
        velocidadeMaquina = gps.speed.mps();
      }
    }
  }

  // Verifica se há mensagens CAN disponíveis
  if (CAN.checkReceive() == CAN_MSGAVAIL) {
    CAN.readMsgBuf(&id, &len, data);  // Lê a mensagem recebida

    // Verifica se a mensagem recebida é do tipo que estamos esperando
    if ((id & 0xFF00) == 0x0100) {  // ID base 0x100 + índice do fluxômetro
      float lpm;
      memcpy(&lpm, data, sizeof(lpm));  // Converte os dados recebidos para float

      // Armazena os dados no array
      int fluxometroIndex = id - 0x0100;
      if (fluxometroIndex >= 0 && fluxometroIndex < 9) {
        fluxometroData[fluxometroIndex] = lpm;  // Atualiza o valor do fluxômetro correspondente
      }

      // Imprime os dados no monitor serial
      Serial.print("Fluxômetro ");
      Serial.print(fluxometroIndex + 1);  // Exibe o número do fluxômetro
      Serial.print(": ");
      Serial.print(lpm);
      Serial.println(" L/min recebido");
    }
  }
}
