
#include "ESPNowSlaveManager.h"
#include "LedBlinker.h"

ESPNowSlaveManager::ESPNowSlaveManager() : ESPNowManager()
{
}

ESPNowSlaveManager::~ESPNowSlaveManager()
{
}

void ESPNowSlaveManager::broadcastPairingRequest()
{
    uint8_t bufferSize = sizeof(uint8_t);
    uint8_t *buffer = (uint8_t *)malloc(bufferSize);
    buffer[0] = PAIR_REQUEST;
    sendBuffer(BROADCAST_MAC_ADDRESS, PAIR_REQUEST, buffer, bufferSize);
}

bool ESPNowSlaveManager::isServerAddressSet()
{
    return memcmp(serverAddress, BROADCAST_MAC_ADDRESS, sizeof(macAddress_t)) != 0;
}

void ESPNowSlaveManager::getServerAddress(macAddress_t &address)
{
    memcpy(address, serverAddress, sizeof(macAddress_t));
}

void ESPNowSlaveManager::getMacAddress(uint8_t *baseMac)
{
    memcpy(baseMac, macAddress, sizeof(macAddress_t));
}

void ESPNowSlaveManager::onPairResponseReceived(const uint8_t *mac_addr, const uint8_t *data, int data_len)
{
    macAddress_t macAddress;
    memcpy(macAddress, mac_addr, sizeof(macAddress_t));
    static_cast<ESPNowSlaveManager *>(ESPNowManager::getInstance())->setServerAddress(macAddress);
}

ESPNowSlaveManager *ESPNowSlaveManager::getInstance()
{
    if (instance == nullptr)
    {
        instance = new ESPNowSlaveManager();
    }
    return static_cast<ESPNowSlaveManager *>(instance);
}

void ESPNowSlaveManager::setServerAddress(const macAddress_t &address)
{
    removePeer(serverAddress);
    memcpy(serverAddress, address, sizeof(macAddress_t));
    addPeer(serverAddress);
}

void ESPNowSlaveManager::beginPairing()
{
    setServerAddress(BROADCAST_MAC_ADDRESS);

    esp_now_recv_cb_t callback = ESPNowSlaveManager::onPairResponseReceived;

    registerCallback(
        PAIR_REQUEST + 0x80, callback);

    LedBlinker *ledBlinker = new LedBlinker(21, 250);

    ledBlinker->start();

    while (!isServerAddressSet())
    {
        broadcastPairingRequest();
        delay(500);
    }

    ledBlinker->stop();
    digitalWrite(21, HIGH);

    unregisterCallback(PAIR_REQUEST + 0x80, callback);
}
