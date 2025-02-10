#include "MainModule.h"
#include <WiFi.h>
#include <esp_wifi.h>

MainModule *MainModule::instance = nullptr;

MainModule *MainModule::getInstance()
{
    if (instance == nullptr)
    {
        instance = new MainModule();
    }
    return instance;
}

MainModule::MainModule()
{
    this->setup();

    this->printSecondaryModules();
}

MainModule::~MainModule()
{
    if (this->secondaryModules != nullptr)
    {
        free(this->secondaryModules);
    }

    if (this->preferences != nullptr)
    {
        this->preferences->end();
        delete this->preferences;
    }

    esp_now_deinit();

    instance = nullptr;
}

void MainModule::setup()
{
    this->preferences->begin("mainModule", false);

    WiFi.mode(WIFI_AP_STA);

    memset(this->macAddress, 0, sizeof(macAddress_t));
    esp_wifi_get_mac(WIFI_IF_STA, this->macAddress);

    if (esp_now_init() != ESP_OK)
    {
        Serial.println("Error initializing ESP-NOW");
        return;
    }

    this->loadSavedSecondaryModules();

    esp_now_register_send_cb([](const uint8_t *mac_addr, esp_now_send_status_t status)
                             { MainModule::getInstance()->onSendData(mac_addr, status); });
    esp_now_register_recv_cb([](const uint8_t *mac_addr, const uint8_t *data, int data_len)
                             { MainModule::getInstance()->onReceiveData(mac_addr, data, data_len); });

    this->webServer->start();
}

void MainModule::getMacAddress(uint8_t *baseMac)
{
    memcpy(baseMac, this->macAddress, sizeof(macAddress_t));
}

void MainModule::addPeer(const macAddress_t mac_addr)
{
    removePeer(mac_addr);

    esp_now_peer_info_t peer;
    memset(&peer, 0, sizeof(esp_now_peer_info_t));
    memcpy(peer.peer_addr, mac_addr, sizeof(macAddress_t));
    if (esp_now_add_peer(&peer) != ESP_OK)
    {
        Serial.println("Failed to add peer");
        return;
    }
}

void MainModule::removePeer(const macAddress_t mac_addr)
{
    esp_now_del_peer(mac_addr);
}

void MainModule::loadSavedSecondaryModules()
{
    if (this->preferences->isKey("secModsCount") == false || this->preferences->isKey("secMods") == false)
    {
        return;
    }

    this->secondaryModuleCount = this->preferences->getUInt("secModsCount", 0);
    if (this->secondaryModuleCount == 0)
    {
        return;
    }

    this->secondaryModules = (macAddress_t *)malloc(sizeof(macAddress_t) * this->secondaryModuleCount);
    this->preferences->getBytes("secMods", (uint8_t *)this->secondaryModules, sizeof(macAddress_t) * this->secondaryModuleCount);
    for (int i = 0; i < this->secondaryModuleCount; i++)
    {
        addPeer(this->secondaryModules[i]);
    }
}

void MainModule::confirmPairing(const macAddress_t mac_addr)
{
    struct_pair_response pairResponse;
    pairResponse.msgType = PAIR_RESPONSE;
    pairResponse.success = 1;

    addPeer(mac_addr);
    esp_now_send(mac_addr, (uint8_t *)&pairResponse, sizeof(struct_pair_response));
}

void MainModule::onReceiveData(const uint8_t *mac_addr, const uint8_t *data, int data_len)
{
    uint8_t type = data[0];
    macAddress_t senderAddress;
    memcpy(senderAddress, mac_addr, sizeof(macAddress_t));

    if (type == PAIR_REQUEST)
    {
        struct_pair_request pairRequest;
        memcpy(&pairRequest, data, sizeof(struct_pair_request));

        if (this->mode == MODULE_MODE_PAIRING)
        {
            addSecondaryModule(senderAddress);
            confirmPairing(senderAddress);
        }
        else
        {
            if (isSecondaryModule(senderAddress))
            {
                confirmPairing(senderAddress);
            }
        }
    }
    else if (type == FLOWMETER_DATA_RESPONSE)
    {
        flowmeters_data flowmetersData;
        flowmetersData.flowmeterCount = data[1];
        flowmetersData.flowmetersPulsesPerMinute = (flowmeter_data_t *)malloc(sizeof(flowmeter_data_t) * flowmetersData.flowmeterCount);

        memcpy(flowmetersData.flowmetersPulsesPerMinute, &data[2], sizeof(flowmeter_data_t) * flowmetersData.flowmeterCount);

        setLastFlowmeterDataResponseTimestamp(senderAddress, millis());
        registerFlowmetersData(senderAddress, flowmetersData);

        if (isAllFlowmetersDataReceived())
        {
            flowmeters_data allFlowmetersData;
            this->getLastFlowmeterData(&allFlowmetersData);
            callGetFlowmetersDataCallbacks(allFlowmetersData);
            this->setLastFlowmetersDataRequestTimestamp(0);
            this->flowmetersData.clear();
        }

        free(flowmetersData.flowmetersPulsesPerMinute);
    }
}

void MainModule::onSendData(const uint8_t *mac_addr, esp_now_send_status_t status)
{
}

int MainModule::getSecondaryModuleCount()
{
    return this->secondaryModuleCount;
}

int MainModule::getSecondaryModuleIndex(const macAddress_t mac_addr)
{
    for (int i = 0; i < getSecondaryModuleCount(); i++)
    {
        if (memcmp(&this->secondaryModules[i], mac_addr, sizeof(macAddress_t)) == 0)
        {
            return i;
        }
    }
    return -1;
}

void MainModule::addSecondaryModule(const macAddress_t mac_addr)
{
    if (isSecondaryModule(mac_addr))
    {
        return;
    }

    this->secondaryModules = (macAddress_t *)realloc(this->secondaryModules, sizeof(macAddress_t) * (getSecondaryModuleCount() + 1));
    memcpy(&this->secondaryModules[getSecondaryModuleCount()], mac_addr, sizeof(macAddress_t));
    this->secondaryModuleCount++;

    this->preferences->putBytes("secMods", (uint8_t *)this->secondaryModules, sizeof(macAddress_t) * getSecondaryModuleCount());
    this->preferences->putUInt("secModsCount", getSecondaryModuleCount());

    printSecondaryModules();
}

void MainModule::removeSecondaryModule(const macAddress_t mac_addr)
{
    removePeer(mac_addr);

    for (int i = 0; i < getSecondaryModuleCount(); i++)
    {
        if (memcmp(&this->secondaryModules[i], mac_addr, sizeof(macAddress_t)) == 0)
        {
            for (int j = i; j < getSecondaryModuleCount() - 1; j++)
            {
                memcpy(&this->secondaryModules[j], &this->secondaryModules[j + 1], sizeof(macAddress_t));
            }
            this->secondaryModules = (macAddress_t *)realloc(this->secondaryModules, sizeof(macAddress_t) * (getSecondaryModuleCount() - 1));
            this->secondaryModuleCount--;

            this->preferences->putBytes("secMods", (uint8_t *)this->secondaryModules, sizeof(macAddress_t) * getSecondaryModuleCount());
            this->preferences->putUInt("secModsCount", getSecondaryModuleCount());

            printSecondaryModules();

            break;
        }
    }
}

void MainModule::removeAllSecondaryModules()
{
    for (int i = 0; i < getSecondaryModuleCount(); i++)
    {
        removePeer(this->secondaryModules[i]);
    }

    free(this->secondaryModules);
    this->secondaryModules = nullptr;
    this->secondaryModuleCount = 0;

    this->preferences->remove("secMods");
    this->preferences->remove("secModsCount");

    printSecondaryModules();
}

void MainModule::printSecondaryModules()
{
    Serial.println("Secondary modules:");
    for (int i = 0; i < getSecondaryModuleCount(); i++)
    {
        Serial.printf("[%d] %02X:%02X:%02X:%02X:%02X:%02X\n",
                      i,
                      this->secondaryModules[i][0],
                      this->secondaryModules[i][1],
                      this->secondaryModules[i][2],
                      this->secondaryModules[i][3],
                      this->secondaryModules[i][4],
                      this->secondaryModules[i][5]);
    }
    if (getSecondaryModuleCount() == 0)
    {
        Serial.println("[empty]");
    }
}

bool MainModule::isSecondaryModule(const macAddress_t mac_addr)
{
    for (int i = 0; i < getSecondaryModuleCount(); i++)
    {
        if (memcmp(&this->secondaryModules[i], mac_addr, sizeof(macAddress_t)) == 0)
        {
            return true;
        }
    }
    return false;
}

ModuleMode MainModule::getModuleMode()
{
    return this->mode;
}

void MainModule::setMode(ModuleMode mode)
{
    this->mode = mode;
    if (mode == MODULE_MODE_PAIRING)
    {
        Serial.println("Pairing mode");
    }
    else if (mode == MODULE_MODE_RUNNING)
    {
        Serial.println("Running mode");
    }
}

void MainModule::getFlowmetersData(std::function<void(flowmeters_data)> callback)
{
    this->addGetFlowmetersDataCallback(callback);
    this->setLastFlowmetersDataRequestTimestamp(millis());

    if (getSecondaryModuleCount() == 0)
    {
        flowmeters_data data;
        data.flowmeterCount = 0;
        data.flowmetersPulsesPerMinute = nullptr;
        callGetFlowmetersDataCallbacks(data);
        return;
    }

    for (int i = 0; i < getSecondaryModuleCount(); i++)
    {
        secondary_module_data_request request;
        request.msgType = FLOWMETER_DATA_REQUEST;
        esp_now_send(this->secondaryModules[i], (uint8_t *)&request, sizeof(secondary_module_data_request));
    }
}

void MainModule::addGetFlowmetersDataCallback(std::function<void(flowmeters_data)> callback)
{
    getFlowmetersDataCallbacks.push_back(callback);
}

void MainModule::callGetFlowmetersDataCallbacks(flowmeters_data data)
{
    for (auto &callback : getFlowmetersDataCallbacks)
    {
        callback(data);
    }

    getFlowmetersDataCallbacks.clear();
}

void MainModule::setLastFlowmetersDataRequestTimestamp(unsigned long timestamp)
{
    this->lastFlowmetersDataRequestTimestamp = timestamp;
}

void MainModule::setLastFlowmeterDataResponseTimestamp(const macAddress_t mac_addr, unsigned long timestamp)
{
    std::string mac_addr_str = this->macToString(mac_addr);
    this->lastFlowmetersDataResponseTimestamps[mac_addr_str] = timestamp;
}

void MainModule::registerFlowmetersData(const macAddress_t mac_addr, flowmeters_data data)
{
    std::string mac_addr_str = this->macToString(mac_addr);

    flowmeters_data flowmetersData;
    flowmetersData.flowmeterCount = data.flowmeterCount;
    flowmetersData.flowmetersPulsesPerMinute = (flowmeter_data_t *)malloc(sizeof(flowmeter_data_t) * data.flowmeterCount);
    memcpy(flowmetersData.flowmetersPulsesPerMinute, data.flowmetersPulsesPerMinute, sizeof(flowmeter_data_t) * data.flowmeterCount);

    this->flowmetersData[mac_addr_str] = flowmetersData;
}

bool MainModule::isAllFlowmetersDataReceived()
{
    if (getSecondaryModuleCount() == 0)
    {
        return true;
    }

    for (int i = 0; i < getSecondaryModuleCount(); i++)
    {
        std::string mac_addr_str = this->macToString(this->secondaryModules[i]);
        unsigned long lastResponseTimestamp = this->lastFlowmetersDataResponseTimestamps[mac_addr_str];
        if (lastResponseTimestamp < this->lastFlowmetersDataRequestTimestamp)
        {
            return false;
        }
    }

    return true;
}

void MainModule::getLastFlowmeterData(flowmeters_data *result)
{
    result->flowmeterCount = 0;
    for (int i = 0; i < getSecondaryModuleCount(); i++)
    {
        std::string mac_addr_str = this->macToString(this->secondaryModules[i]);
        result->flowmeterCount += this->flowmetersData[mac_addr_str].flowmeterCount;
    }
    result->flowmetersPulsesPerMinute = (flowmeter_data_t *)malloc(sizeof(flowmeter_data_t) * result->flowmeterCount);

    int index = 0;
    for (int i = 0; i < getSecondaryModuleCount(); i++)
    {
        std::string mac_addr_str = this->macToString(this->secondaryModules[i]);
        for (int j = 0; j < this->flowmetersData[mac_addr_str].flowmeterCount; j++)
        {
            result->flowmetersPulsesPerMinute[index] = this->flowmetersData[mac_addr_str].flowmetersPulsesPerMinute[j];
            index++;
        }
    }
}

void MainModule::loop()
{
}
