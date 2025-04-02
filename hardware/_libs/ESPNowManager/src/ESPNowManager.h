#pragma once

#include "esp_now_types.h"
#include <map>
#include <vector>
#include <esp_now.h>
#include <Arduino.h>

const macAddress_t BROADCAST_MAC_ADDRESS = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

class ESPNowManager
{
public:
    ESPNowManager(bool debug = false);
    ~ESPNowManager();

    static ESPNowManager *getInstance();

protected:
    static ESPNowManager *instance;

private:
    std::multimap<uint8_t, esp_now_recv_cb_t> onReceiveCallbacks;

    void onReceiveData(const uint8_t *mac_addr, const uint8_t *dataBuffer, int len);
    void callOnReceiveCallbacks(uint8_t messageType, const uint8_t *mac_addr, const uint8_t *dataBuffer, int len);

    bool debugMode = false;

protected:
    void addPeer(const uint8_t *mac_addr);
    void removePeer(const uint8_t *mac_addr);

public:
    void sendBuffer(const uint8_t *address, uint8_t messageType, const uint8_t *buffer, size_t size);
    void registerCallback(uint8_t messageType, esp_now_recv_cb_t callback);
    void unregisterCallback(uint8_t messageType, esp_now_recv_cb_t callback);
};