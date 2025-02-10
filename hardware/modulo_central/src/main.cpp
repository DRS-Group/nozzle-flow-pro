#include "MainModule.h"
#include "GPS.h"

void setup()
{
  Serial.begin(115200);
}

void loop()
{
  MainModule::getInstance()->loop();
  GPS::getInstance()->loop();
}