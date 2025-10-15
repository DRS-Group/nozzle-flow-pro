#pragma once

#include <Arduino.h>
#include <map>
#include <vector>

class Flowmeter
{
public:
    Flowmeter(uint8_t pin, unsigned short refreshRate);
    ~Flowmeter();

private:
    uint8_t pin;
    unsigned short refreshRate;
    unsigned short debounce = 0;
    unsigned short minPulsesPerPacket = 40;
    unsigned short maxNumberOfPackets = 10;

    volatile unsigned long lastPulseTimestamp = 0;
    std::vector<unsigned long> pulsesTimestamps;

    static void onPulseStatic(void *arg);

    void registerPulse();
    void removeOldPulses();
    void removeOldPulses(unsigned short refreshRate);

public:
    void onPulse();
    static std::map<uint8_t, Flowmeter *> instances;
    unsigned short getPulsesPerMinute();
    unsigned short getPulseCount();
    unsigned short getProcessedPulsesPerMinute();
    unsigned long getLastPulseAge();
    uint8_t getPin();
    void setRefreshRate(unsigned short refreshRate);
    void setDebounce(unsigned short debounce);
    void setMinPulsesPerPacket(unsigned short minPulsesPerPacket);
    void setMaxNumberOfPackets(unsigned short maxNumberOfPackets);
};
