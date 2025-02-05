#include <CAN.h>

#define TX_GPIO_NUM 4
#define RX_GPIO_NUM 5

int FLOWMETERS_PINS[] = { 22 };
#define FLOWMETERS_AMOUNT sizeof(FLOWMETERS_PINS) / sizeof(int)

volatile unsigned short flowmeterPulses[FLOWMETERS_AMOUNT] = { 0 };
unsigned long lastRefreshTime = 0;
unsigned short refreshInterval = 1000;

void IRAM_ATTR onFlowmeterPulse(void* arg) {
  const int pinIndex = (intptr_t)arg;
  flowmeterPulses[pinIndex]++;
}

void setupFlowmetersPins() {
  for (int i = 0; i < FLOWMETERS_AMOUNT; i++) {
    pinMode(FLOWMETERS_PINS[i], INPUT_PULLUP);
    attachInterruptArg(digitalPinToInterrupt(FLOWMETERS_PINS[i]), onFlowmeterPulse, (void*)(intptr_t)i, RISING);
  }
}

void initializeCAN() {
  CAN.setPins(RX_GPIO_NUM, TX_GPIO_NUM);

  if (!CAN.begin(500E3)) {
    throw "CAN bus could not be initialized.";
  }
}

void setupModule() {
  setupFlowmetersPins();
  initializeCAN();

  lastRefreshTime = millis();
}

uint8_t* floatToBytes(float value) {
  size_t size = sizeof(value);
  uint8_t* byte_array = (uint8_t*)malloc(size);
  memcpy(byte_array, &value, size);
  return byte_array;
}

void sendFloat(int id, float value) {
  uint8_t* byte_array = floatToBytes(value);
  sendBytes(id, byte_array, sizeof(float));

  Serial.print("Send:");
  Serial.println(value);
}

void sendBytes(unsigned short id, uint8_t* byte_array, size_t size) {
  CAN.beginPacket(id);
  CAN.write(byte_array, size);
  if (CAN.endPacket() == 0) {
    throw "Error while sending CAN message.";
  }
}

void setup() {
  Serial.begin(115200);

  setupModule();

  Serial.println("Módulo secundário iniciado com sucesso!");
}

void loop() {
  const unsigned long now = millis();

  if (now - lastRefreshTime < refreshInterval) return;

  for (int i = 0; i < FLOWMETERS_AMOUNT; i++) {
    sendFloat(0x100 + i, flowmeterPulses[i]);
    flowmeterPulses[i] = 0;
  }

  lastRefreshTime = now;
}
