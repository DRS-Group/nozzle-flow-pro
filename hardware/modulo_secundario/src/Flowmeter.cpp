#include "Flowmeter.h"

std::map<uint8_t, Flowmeter *> Flowmeter::instances;

Flowmeter::Flowmeter(uint8_t pin, unsigned short refreshRate)
{
    this->pin = pin;
    this->refreshRate = refreshRate;

    pinMode(this->pin, INPUT_PULLUP);
    attachInterruptArg(digitalPinToInterrupt(this->pin), Flowmeter::onPulseStatic, reinterpret_cast<void *>(static_cast<intptr_t>(this->pin)), RISING);

    this->pulsesTimestamps = nullptr;
    this->pulseCount = 0;

    instances[this->pin] = this;
}

Flowmeter::~Flowmeter()
{
    free(this->pulsesTimestamps);

    instances.erase(this->pin);
}

void Flowmeter::onPulse()
{
    this->registerPulse();
}

void Flowmeter::onPulseStatic(void *arg)
{
    const uint8_t pin = (intptr_t)arg;
    if (instances.find(pin) != instances.end())
    {
        instances[pin]->onPulse();
    }
}

void Flowmeter::registerPulse()
{
    this->removeOldPulses();

    unsigned long *newPulsesTimestamps = (unsigned long *)realloc(this->pulsesTimestamps, (this->pulseCount + 1) * sizeof(unsigned long));
    if (newPulsesTimestamps != nullptr)
    {
        this->pulsesTimestamps = newPulsesTimestamps;
        this->pulsesTimestamps[this->pulseCount] = millis();
        this->pulseCount++;
    }
}

void Flowmeter::removeOldPulses()
{
    const unsigned long currentTime = millis();
    while (this->pulseCount > 0 && currentTime - this->pulsesTimestamps[0] > this->refreshRate)
    {
        for (unsigned short i = 0; i < this->pulseCount - 1; i++)
        {
            this->pulsesTimestamps[i] = this->pulsesTimestamps[i + 1];
        }
        this->pulseCount--;

        unsigned long *newPulsesTimestamps = (unsigned long *)realloc(this->pulsesTimestamps, this->pulseCount * sizeof(unsigned long));

        this->pulsesTimestamps = newPulsesTimestamps;
    }
}

unsigned short Flowmeter::getPulsesPerMinute()
{
    this->removeOldPulses();

    return this->pulseCount * 60000 / this->refreshRate;
}

void Flowmeter::printPulsesTimestamps()
{
    const unsigned long currentTime = millis();
    for (unsigned short i = 0; i < this->pulseCount; i++)
    {
        Serial.print(currentTime - this->pulsesTimestamps[i]);
        Serial.print(" ");
    }
    Serial.println();
}

uint8_t Flowmeter::getPin()
{
    return this->pin;
}
