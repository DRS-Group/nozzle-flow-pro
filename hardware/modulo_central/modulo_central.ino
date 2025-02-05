#include <CAN.h>
#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>
#include <ArduinoJson.h>

#define TX_GPIO_NUM 4
#define RX_GPIO_NUM 5

#define NETWORK_SSID "tupido-EUA"
#define NETWORK_PASSWORD "123456789"

TinyGPSPlus gps;
HardwareSerial mySerial(1);

#define FLOWMETERS_AMOUNT 9  // TODO: Alterar esse cara futuramente.

unsigned short flowmeterPulses[FLOWMETERS_AMOUNT] = { 0 };
float speed = 0;

AsyncWebServer server(80);

uint8_t *floatToBytes(float value) {
  size_t size = sizeof(value);
  uint8_t *byte_array = (uint8_t *)malloc(size);
  memcpy(byte_array, &value, size);
  return byte_array;
}

void sendFloat(int id, float value) {
  uint8_t *byte_array = floatToBytes(value);
  sendBytes(id, byte_array, sizeof(float));
}

void sendBytes(unsigned short id, uint8_t *byte_array, size_t size) {
  CAN.beginPacket(id);
  CAN.write(byte_array, size);
  if (CAN.endPacket() == 0) {
    throw "Error while sending CAN message.";
  }
}

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
    // Verifica se o parâmetro 'interval' está presente
    if (request->hasParam("interval", false)) {
      float intervalo = request->getParam("interval", false)->value().toFloat();

      // Envia o valor do intervalo via CAN para o transmissor
      sendFloat(0x0300, intervalo);
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
  while (mySerial.available() > 0) {
    gps.encode(mySerial.read());

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
    float value;
    memcpy(&value, buf, packetSize);  // Converte o buffer recebido para float

    int flowmeterIndex = id - 0x0100;

    flowmeterPulses[flowmeterIndex] = value;

    Serial.println(value);
    Serial.println(String(value, 10));
  }
}
