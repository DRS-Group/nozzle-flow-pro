#include <CAN.h>
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>
#include "../common/typesConversionHelper.cpp"
#include "../common/CANCommunicationHelper.cpp"

#define TX_GPIO_NUM 4
#define RX_GPIO_NUM 5

#define NETWORK_SSID "NOZZLE FLOW PRO"
#define NETWORK_PASSWORD "123456789"

TinyGPSPlus gps;
HardwareSerial GPSSerial(1);

#define FLOWMETERS_AMOUNT 9  // TODO: Alterar esse cara futuramente.

unsigned short flowmeterPulses[FLOWMETERS_AMOUNT] = { 0 };
float speed = 0;

AsyncWebServer server(80);



void setupCAN() {
  CAN.setPins(RX_GPIO_NUM, TX_GPIO_NUM);

  if (!CAN.begin(500E3)) {
    throw "CAN bus could not be initialized.";
  }

  CAN.onReceive(onReceive);
}

void setupWebServer() {
  WiFi.softAP(NETWORK_SSID, NETWORK_PASSWORD);

  IPAddress local_ip(192, 168, 0, 1);
  IPAddress gateway(192, 168, 0, 1);
  IPAddress subnet(255, 255, 255, 0);

  if (!WiFi.softAPConfig(local_ip, gateway, subnet)) {
    Serial.println("Falha ao configurar o IP do ponto de acesso");
    return;
  }

  setupEndpoints();

  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "*");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "*");

  server.begin();
}

void setupEndpoints() {
  server.on("/data", HTTP_GET, [](AsyncWebServerRequest *request) {
    String json = "{\"speed\":" + String(speed) + ",\"pulses\":[";
    for (int i = 0; i < 9; i++) {
      json += String(flowmeterPulses[i], 6);
      if (i < 8) json += ",";
    }
    json += "]}";
    request->send(200, "application/json", json);
  });

  server.on("/interval", HTTP_POST, [](AsyncWebServerRequest *request) {
    Serial.println("Interval");
    // Verifica se o parâmetro 'interval' está presente
    if (request->hasParam("interval", false)) {
      int intervalo = request->getParam("interval", false)->value().toInt();
      Serial.println(intervalo);

      // Envia o valor do intervalo via CAN para o transmissor
      sendInteger(0x0300, intervalo);
      request->send(200, "text/plain", "Intervalo atualizado para " + String(intervalo) + " ms");
    } else {
      request->send(400, "text/plain", "Parâmetro de intervalo faltando");
    }
  });
}

void setupModule() {
  setupCAN();
  setupWebServer();
}

void setup() {
  Serial.begin(115200);

  setupModule();

  Serial.println("Módulo central iniciado com sucesso!");
}

void loop() {
  while (GPSSerial.available() > 0) {
    gps.encode(GPSSerial.read());

    // Verifica se a localização foi atualizada
    if (gps.location.isUpdated()) {
      speed = gps.speed.mps();
    }
  }
}

void onReceive(int packetSize) {
  long id = CAN.packetId();
  if ((id & 0xFF00) == 0x0100) {
    uint8_t *buf = (uint8_t *)malloc(packetSize);
    CAN.readBytes(buf, packetSize);
    int value;
    memcpy(&value, buf, packetSize);  // Converte o buffer recebido para float

    int flowmeterIndex = id - 0x0100;

    flowmeterPulses[flowmeterIndex] = value;

    Serial.print("Fluxometro ");
    Serial.print(flowmeterIndex + 1);
    Serial.print(": ");
    Serial.print(value);
    Serial.println(" pulsos por minuto.");
  }
}
