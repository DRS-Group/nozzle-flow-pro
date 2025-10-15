#pragma once

#include <esp_now_types.h>
#include "Flowmeter.h"
#include "LedBlinker.h"
#include <ESPNowSlaveManager/ESPNowSlaveManager.h>

class SecondaryModule
{
public:
    static SecondaryModule *getInstance();

private:
    SecondaryModule();

    ~SecondaryModule();

    static SecondaryModule *instance;

private:
    Flowmeter **flowmeters = nullptr;
    uint8_t flowmeterCount = 0;

    LedBlinker *ledBlinker = nullptr;
    ESPNowSlaveManager *espNowManager = ESPNowSlaveManager::getInstance();

private:
    static void onDataRequest(const uint8_t *mac_addr, const uint8_t *incomingData, int len);
    static void onSetRefreshRate(const uint8_t *mac_addr, const uint8_t *incomingData, int len);
    static void onSetDebounce(const uint8_t *mac_addr, const uint8_t *incomingData, int len);
    static void onSetMinPulsesPerPacket(const uint8_t *mac_addr, const uint8_t *incomingData, int len);
    static void onSetMaxNumberOfPackets(const uint8_t *mac_addr, const uint8_t *incomingData, int len);
    void addFlowmeter(uint8_t pin, unsigned short refreshRate);
    uint8_t getFlowmeterCount();

public:
    flowmeters_data getFlowmeterData();
    void setRefreshRate(unsigned short refreshRate, uint8_t flowmeterIndex);
    void setDebounce(unsigned short debounce, uint8_t flowmeterIndex);
    void setMinPulsesPerPacket(unsigned short minPulsesPerPacket, uint8_t flowmeterIndex);
    void setMaxNumberOfPackets(unsigned short maxNumberOfPackets, uint8_t flowmeterIndex);

    void loop();
};