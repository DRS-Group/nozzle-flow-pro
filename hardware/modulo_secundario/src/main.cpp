#include <SecondaryModule.h>

void setup()
{
  Serial.begin(115200);
}

void loop()
{
  SecondaryModule::getInstance()->loop();
}
