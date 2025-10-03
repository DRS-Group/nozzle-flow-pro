#include "GPS.h"

GPS *GPS::instance = nullptr;

GPS::GPS()
{
    setup();
}

GPS::~GPS()
{
    delete gps;
    delete gpsSerial;
}

void GPS::setup()
{
    gps = new TinyGPSPlus();
    gpsSerial = new HardwareSerial(1);

    gpsSerial->begin(GPS_BAUD, SERIAL_8N1, 25, 26);
}

void GPS::loop()
{
    while (gpsSerial->available() > 0)
    {
        gps->encode(gpsSerial->read());
    }
}

float GPS::getSpeed()
{
    return gps->speed.mps();
}

double GPS::getLatitude()
{
    return gps->location.lat();
}

double GPS::getLongitude()
{
    return gps->location.lng();
}

uint32_t GPS::getSatelliteCount()
{
    return gps->satellites.value();
}
