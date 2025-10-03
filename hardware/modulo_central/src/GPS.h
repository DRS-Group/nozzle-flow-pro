#pragma once

#include <TinyGPS++.h>

#define GPS_BAUD 9600

class GPS
{
    // Constructor and destructor.
public:
    GPS();
    ~GPS();

private:
    TinyGPSPlus *gps = nullptr;
    HardwareSerial *gpsSerial = nullptr;

    void setup();

public:
    static GPS *instance;
    static GPS *getInstance()
    {
        if (!hasInstance())
        {
            instance = new GPS();
        }

        return instance;
    };
    static bool hasInstance() { return instance != nullptr; };
    void loop();

    float getSpeed();
    double getLatitude();
    double getLongitude();
    uint32_t getSatelliteCount();
};