#include "ESPNowManager.h"
#include <WiFi.h>

ESPNowManager *ESPNowManager::instance = nullptr;

ESPNowManager::ESPNowManager()
{
    // if (WiFi.getMode() == WIFI_AP)
    // {
    //     WiFi.mode(WIFI_AP_STA);
    // }
    // else
    // {
    //     WiFi.mode(WIFI_STA);
    // }

    WiFi.mode(WIFI_AP_STA);

    esp_now_init();

    esp_now_register_recv_cb([](const uint8_t *mac_addr, const uint8_t *dataBuffer, int len)
                             { ESPNowManager::getInstance()->onReceiveData(mac_addr, dataBuffer, len); });
}

ESPNowManager::~ESPNowManager()
{
    esp_now_deinit();
}

ESPNowManager *ESPNowManager::getInstance()
{
    if (instance == nullptr)
    {
        instance = new ESPNowManager();
    }
    return instance;
}

void ESPNowManager::onReceiveData(const uint8_t *mac_addr, const uint8_t *dataBuffer, int len)
{
    Serial.printf("Received message of type %d from %02X:%02X:%02X:%02X:%02X:%02X\n", dataBuffer[0], mac_addr[0], mac_addr[1], mac_addr[2], mac_addr[3], mac_addr[4], mac_addr[5]);

    const uint8_t messageType = dataBuffer[0];

    callOnReceiveCallbacks(messageType, mac_addr, (uint8_t *)dataBuffer + 1, len - 1);
}

void ESPNowManager::callOnReceiveCallbacks(uint8_t messageType, const uint8_t *mac_addr, const uint8_t *dataBuffer, int len)
{
    auto x = onReceiveCallbacks.equal_range(messageType);
    for (auto it = x.first; it != x.second; ++it)
    {
        it->second(mac_addr, dataBuffer, len);
    }
}

void ESPNowManager::addPeer(const uint8_t *mac_addr)
{
    esp_now_del_peer(mac_addr);

    esp_now_peer_info_t peer;
    memset(&peer, 0, sizeof(esp_now_peer_info_t));
    memcpy(peer.peer_addr, mac_addr, sizeof(uint8_t[6]));
    esp_now_add_peer(&peer);
}

void ESPNowManager::removePeer(const uint8_t *mac_addr)
{
    esp_now_del_peer(mac_addr);
}

void ESPNowManager::sendBuffer(const uint8_t *address, uint8_t messageType, const uint8_t *buffer, size_t size)
{
    uint8_t *newBuffer = new uint8_t[size + 1];
    newBuffer[0] = messageType;
    memcpy(newBuffer + 1, buffer, size);
    esp_now_send(reinterpret_cast<const uint8_t *>(address), newBuffer, size + 1);
    delete[] newBuffer;

    Serial.printf("Sent message of type %d to %02X:%02X:%02X:%02X:%02X:%02X\n", messageType, address[0], address[1], address[2], address[3], address[4], address[5]);
}

void ESPNowManager::registerCallback(uint8_t messageType, esp_now_recv_cb_t callback)
{
    onReceiveCallbacks.insert({messageType, callback});
}

void ESPNowManager::unregisterCallback(uint8_t messageType, esp_now_recv_cb_t callback)
{
    // auto it = onReceiveCallbacks.find({messageType, callback});
    // if (it != onReceiveCallbacks.end())
    // {
    //     onReceiveCallbacks.erase(it);
    // }
}
