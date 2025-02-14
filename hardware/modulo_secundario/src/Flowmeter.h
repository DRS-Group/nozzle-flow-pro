#pragma once

#include <Arduino.h>
#include <map>

// typedef of an array of timestamps
typedef unsigned long *timestamp_arr_t;

class Flowmeter
{
public:
    /*
     * Constructor
     *
     * @param pin: the pin the flowmeter is connected to
     * @param refreshRate: the refresh rate of the flowmeter in milliseconds
     */
    Flowmeter(uint8_t pin, unsigned short refreshRate);
    ~Flowmeter();

private:
    uint8_t pin;
    unsigned short refreshRate;

    volatile timestamp_arr_t pulsesTimestamps;
    volatile short pulseCount;

    static void onPulseStatic(void *arg);

    void registerPulse();
    void removeOldPulses();

public:
    void onPulse();
    static std::map<uint8_t, Flowmeter *> instances;
    unsigned short getPulsesPerMinute();
    uint8_t getPin();
    void setRefreshRate(unsigned short refreshRate);
};