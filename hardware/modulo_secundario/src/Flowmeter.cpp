#include "Flowmeter.h"

std::map<uint8_t, Flowmeter *> Flowmeter::instances;

Flowmeter::Flowmeter(uint8_t pin, unsigned short refreshRate)
{
    this->pin = pin;
    this->refreshRate = refreshRate;

    pinMode(this->pin, INPUT_PULLUP);
    attachInterruptArg(digitalPinToInterrupt(this->pin),
                       Flowmeter::onPulseStatic,
                       reinterpret_cast<void *>(static_cast<intptr_t>(this->pin)),
                       RISING);

    pulsesTimestamps.reserve(32);
    instances[this->pin] = this;
}

Flowmeter::~Flowmeter()
{
    detachInterrupt(digitalPinToInterrupt(this->pin));
    instances.erase(this->pin);
}

void Flowmeter::onPulse()
{
    if (millis() - lastPulseTimestamp < debounce)
        return;

    registerPulse();
}

void Flowmeter::onPulseStatic(void *arg)
{
    const uint8_t pin = (intptr_t)arg;
    auto it = instances.find(pin);
    if (it != instances.end())
        it->second->onPulse();
}

void Flowmeter::registerPulse()
{
    removeOldPulses();
    unsigned long now = millis();
    pulsesTimestamps.push_back(now);
    lastPulseTimestamp = now;
}

void Flowmeter::removeOldPulses()
{
    unsigned long currentTime = millis();
    while (!pulsesTimestamps.empty() &&
           currentTime - pulsesTimestamps.front() > refreshRate)
    {
        pulsesTimestamps.erase(pulsesTimestamps.begin());
    }
}

void Flowmeter::removeOldPulses(unsigned short refreshRate)
{
    unsigned long currentTime = millis();
    while (!pulsesTimestamps.empty() &&
           currentTime - pulsesTimestamps.front() > refreshRate)
    {
        pulsesTimestamps.erase(pulsesTimestamps.begin());
    }
}

unsigned short Flowmeter::getPulsesPerMinute()
{
    removeOldPulses();
    return pulsesTimestamps.size() * 60000UL / refreshRate;
}

unsigned short Flowmeter::getPulseCount()
{
    removeOldPulses();
    return pulsesTimestamps.size();
}

unsigned short Flowmeter::getProcessedPulsesPerMinute()
{
    unsigned short totalPulses = getPulseCount();
    if (totalPulses == 0)
        return 0;

    unsigned short numPackets = ceil((float)totalPulses / (float)minPulsesPerPacket);
    if (numPackets > maxNumberOfPackets)
        numPackets = maxNumberOfPackets;

    std::vector<unsigned short> packets(numPackets, 0);
    unsigned long now = millis();
    unsigned short refreshRate = this->refreshRate - (this->refreshRate % numPackets);
    unsigned long packetSize = refreshRate / numPackets;

    removeOldPulses(refreshRate);

    // Assign pulses to packets
    for (unsigned long t : pulsesTimestamps)
    {
        unsigned long age = now - t;
        if (age >= refreshRate)
            continue; // too old

        int packetIndex = age / packetSize;
        if (packetIndex >= numPackets)
            packetIndex = numPackets - 1;

        packets[packetIndex]++;
    }

    // Calculate average of all packets
    unsigned long sum = 0;
    for (unsigned short count : packets)
        sum += count;

    unsigned long avg = (sum + numPackets / 2) / numPackets;

    // Scale to full refreshRate
    unsigned long processedPulses = avg * numPackets;

    // Convert to pulses per minute
    unsigned short pulsesPerMinute = processedPulses * 60000UL / refreshRate;

    return pulsesPerMinute;
}

unsigned long Flowmeter::getLastPulseAge()
{
    if (lastPulseTimestamp == 0)
        return 0;
    return millis() - lastPulseTimestamp;
}

uint8_t Flowmeter::getPin()
{
    return pin;
}

void Flowmeter::setRefreshRate(unsigned short refreshRate)
{
    this->refreshRate = refreshRate;
}

void Flowmeter::setDebounce(unsigned short debounce)
{
    this->debounce = debounce;
}
void Flowmeter::setMinPulsesPerPacket(unsigned short minPulsesPerPacket)
{
    this->minPulsesPerPacket = minPulsesPerPacket;
}
void Flowmeter::setMaxNumberOfPackets(unsigned short maxNumberOfPackets)
{
    this->maxNumberOfPackets = maxNumberOfPackets;
}


