#include <CAN.h>
#include "../common/typesConversionHelper.cpp"
#include "../common/CANCommunicationHelper.cpp"

#define TX_GPIO_NUM 4
#define RX_GPIO_NUM 5

int FLOWMETERS_PINS[] = { 22 };
#define FLOWMETERS_AMOUNT sizeof(FLOWMETERS_PINS) / sizeof(int)

volatile unsigned short flowmeterPulses[FLOWMETERS_AMOUNT] = { 0 };
unsigned long lastRefreshTime = 0;
unsigned short refreshInterval = 1000;

void IRAM_ATTR onFlowmeterPulse(void *arg) {
  const int pinIndex = (intptr_t)arg;
  const int pin = FLOWMETERS_PINS[pinIndex];
  detachInterrupt(pin);
  flowmeterPulses[pinIndex]++;
  attachInterruptArg(pin, onFlowmeterPulse, (void *)(intptr_t)pinIndex, RISING);
}

void setupFlowmetersPins() {
  for (int i = 0; i < FLOWMETERS_AMOUNT; i++) {
    pinMode(FLOWMETERS_PINS[i], INPUT_PULLUP);
    attachInterruptArg(digitalPinToInterrupt(FLOWMETERS_PINS[i]), onFlowmeterPulse, (void *)(intptr_t)i, RISING);
  }
}

void setupCAN() {
  CAN.setPins(RX_GPIO_NUM, TX_GPIO_NUM);

  if (!CAN.begin(500E3)) {
    throw "CAN bus could not be initialized.";
  }

  CAN.onReceive(onReceive);
}

void setupModule() {
  setupFlowmetersPins();
  setupCAN();

  lastRefreshTime = millis();
}

void setup() {
  Serial.begin(115200);

  setupModule();

  Serial.println("Módulo secundário iniciado com sucesso!");
}

void loop() {
  const unsigned long now = millis();
  const unsigned long elapsedTime = now - lastRefreshTime;

  if (elapsedTime == 0 || elapsedTime < refreshInterval) return;

  for (int i = 0; i < FLOWMETERS_AMOUNT; i++) {
    const float elapsedTimeInMinutes = static_cast<float>(elapsedTime) / (60 * 1000);
    const int pulsesPerMinute = static_cast<int>(round(static_cast<float>(flowmeterPulses[i]) / elapsedTimeInMinutes));

    sendInteger(0x100 + i, pulsesPerMinute);
    flowmeterPulses[i] = 0;
  }

  lastRefreshTime = now;
}

void onReceive(int packetSize) {
  long id = CAN.packetId();

  // Altera o intervalo de atualização.
  if (id == 0x0300) {
    uint8_t *buf = (uint8_t *)malloc(packetSize);
    CAN.readBytes(buf, packetSize);
    int value;
    memcpy(&value, buf, packetSize);

    refreshInterval = value;

    Serial.print("Intervalo atualizado para ");
    Serial.print(value);
    Serial.println("ms.");
  }
}
