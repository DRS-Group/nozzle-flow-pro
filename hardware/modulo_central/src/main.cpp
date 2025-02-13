#include "MainModule.h"
#include "GPS.h"

MainModule *mainModule;
GPS *gps;

void setup()
{
  Serial.begin(115200);

  mainModule = MainModule::getInstance();
  gps = GPS::getInstance();
}

void loop()
{
  mainModule->loop();
  gps->loop();
}