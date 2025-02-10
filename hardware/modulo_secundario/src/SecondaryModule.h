#pragma once

#include <esp_now_types.h>
#include "Flowmeter.h"

class SecondaryModule
{
public:
    void printMAC(const uint8_t *mac_addr);

    static SecondaryModule *getInstance();

private:
    SecondaryModule();

    ~SecondaryModule();

    static SecondaryModule *instance;

private:
    macAddress_t macAddress = {0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
    macAddress_t serverAddress = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

    Flowmeter **flowmeters = nullptr;
    uint8_t flowmeterCount = 0;

private:
    void printInitialMessage();
    void setupESPNow();
    void setServerAddress(const macAddress_t &address);
    void broadcastPairingRequest();
    void addPeer(const uint8_t *mac_addr);
    void onReceiveData(const uint8_t *mac_addr, const uint8_t *incomingData, int len);
    void addFlowmeter(uint8_t pin, unsigned short refreshRate);
    void removeFlowmeter(uint8_t pin);
    uint8_t getFlowmeterCount();

public:
    void getServerAddress(macAddress_t &address);
    void getMacAddress(uint8_t *baseMac);
    bool isServerAddressSet();
    flowmeters_data getFlowmeterData();

    void loop();
};