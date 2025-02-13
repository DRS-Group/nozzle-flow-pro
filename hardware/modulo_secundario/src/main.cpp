#include <SecondaryModule.h>
#include <Preferences.h>

SecondaryModule *secondaryModule;

void setup()
{
  Serial.begin(115200);
  secondaryModule = SecondaryModule::getInstance();
}

void loop()
{
  secondaryModule->loop();
}
