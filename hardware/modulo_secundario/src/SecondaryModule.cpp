#include "SecondaryModule.h"
#include <WiFi.h>
#include <esp_wifi.h>
#include <esp_now.h>

const macAddress_t BROADCAST_MAC_ADDRESS = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

SecondaryModule *SecondaryModule::instance = nullptr;

void SecondaryModule::printMAC(const uint8_t *mac_addr)
{
    char macStr[18];
    snprintf(macStr, sizeof(macStr), "%02x:%02x:%02x:%02x:%02x:%02x",
             mac_addr[0], mac_addr[1], mac_addr[2], mac_addr[3], mac_addr[4], mac_addr[5]);
    Serial.print(macStr);
}

SecondaryModule *SecondaryModule::getInstance()
{
    if (instance == nullptr)
    {
        instance = new SecondaryModule();
    }
    return instance;
}

SecondaryModule::SecondaryModule()
{
    this->setupESPNow();
    this->preferences->begin("my-app", false);

    this->printInitialMessage();
}

SecondaryModule::~SecondaryModule()
{
    this->preferences->end();

    esp_now_deinit();
    WiFi.mode(WIFI_OFF);
    Serial.println("Secondary module stopped");
}

void SecondaryModule::printInitialMessage()
{
    Serial.println();
    Serial.println("##################################");
    Serial.println("#    SECONDARY MODULE STARTED    #");
    Serial.print("# Mac address: ");
    this->printMAC(this->macAddress);
    Serial.println(" #");
    Serial.println("##################################");
}

void SecondaryModule::setupESPNow()
{
    WiFi.mode(WIFI_STA);

    memset(this->macAddress, 0, sizeof(macAddress_t));
    esp_wifi_get_mac(WIFI_IF_STA, this->macAddress);

    if (esp_now_init() != ESP_OK)
    {
        Serial.println("Error initializing ESP-NOW");
    }

    esp_now_register_recv_cb([](const uint8_t *mac_addr, const uint8_t *incomingData, int len)
                             { SecondaryModule::getInstance()->onReceiveData(mac_addr, incomingData, len); });
    // esp_now_register_send_cb([](const uint8_t *mac_addr, esp_now_send_status_t status)
    //                          {
    //                              Serial.print("Send status: ");
    //                              Serial.println(status == ESP_NOW_SEND_SUCCESS ? "success" : "fail"); });
}

void SecondaryModule::setServerAddress(const macAddress_t &address)
{
    esp_now_del_peer(serverAddress);
    memcpy(serverAddress, address, sizeof(macAddress_t));
    Serial.println("Server address set to:");
    printMAC(serverAddress);
    Serial.println();
    addPeer(serverAddress);
}

void SecondaryModule::broadcastPairingRequest()
{
    struct_pair_request pairRequest;
    pairRequest.msgType = PAIR_REQUEST;

    addPeer(BROADCAST_MAC_ADDRESS);
    esp_now_send(BROADCAST_MAC_ADDRESS, (uint8_t *)&pairRequest, sizeof(struct_pair_request));
    esp_now_del_peer(BROADCAST_MAC_ADDRESS);
}

void SecondaryModule::addPeer(const uint8_t *mac_addr)
{
    esp_now_del_peer(mac_addr);

    esp_now_peer_info_t peer;
    memset(&peer, 0, sizeof(esp_now_peer_info_t));
    memcpy(peer.peer_addr, mac_addr, sizeof(uint8_t[6]));
    if (esp_now_add_peer(&peer) != ESP_OK)
    {
        Serial.println("Failed to add peer");
        return;
    }
}

void SecondaryModule::onReceiveData(const uint8_t *mac_addr, const uint8_t *incomingData, int len)
{
    uint8_t type = incomingData[0];
    macAddress_t senderAddress;
    memcpy(senderAddress, mac_addr, sizeof(macAddress_t));

    if (type == PAIR_RESPONSE)
    {
        struct_pair_response pairResponse;
        memcpy(&pairResponse, incomingData, sizeof(struct_pair_response));

        if (pairResponse.success == 1)
        {
            Serial.println("Pairing successful");
            this->setServerAddress(senderAddress);
        }
        else
        {
            Serial.println("Pairing failed");
        }
    }
}

void SecondaryModule::getServerAddress(macAddress_t &address)
{
    memcpy(address, serverAddress, sizeof(macAddress_t));
}

void SecondaryModule::getMacAddress(uint8_t *baseMac)
{
    memcpy(baseMac, this->macAddress, sizeof(macAddress_t));
}

bool SecondaryModule::isServerAddressSet()
{
    return memcmp(serverAddress, BROADCAST_MAC_ADDRESS, sizeof(macAddress_t)) != 0;
}

void SecondaryModule::loop()
{
    if (!this->isServerAddressSet())
    {
        Serial.println("Server address not set");
        Serial.println("Broadcasting pairing request");
        this->broadcastPairingRequest();
    }
    else
    {
        Serial.println("Sending data to server");

        esp_err_t result = esp_now_send(serverAddress, (uint8_t *)"Hello", 5);
        if (result == ESP_OK)
        {
            Serial.print("Data sent to server: ");
            printMAC(serverAddress);
        }
        else
        {
            Serial.println("Failed to send data to server");
        }
    }
    delay(1000);
}
