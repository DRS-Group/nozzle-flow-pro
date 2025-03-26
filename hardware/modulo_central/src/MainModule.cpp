#include "MainModule.h"
#include <esp_task_wdt.h>

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
    ESPNowManager::getInstance()->registerCallback(
        FLOWMETER_DATA_REQUEST + 0x80,
        MainModule::onDataResponseReceived);

    this->webServer->start();
}

MainModule::~MainModule()
{
    instance = nullptr;
}

ESPNowCentralManager *MainModule::getEspNowCentralManager()
{
    return this->espNowCentralManager;
}

void MainModule::onDataResponseReceived(const uint8_t *mac_addr, const uint8_t *data, int data_len)
{
    MainModule *instance = MainModule::getInstance();

    macAddress_t senderAddress;
    memcpy(senderAddress, mac_addr, sizeof(macAddress_t));

    flowmeters_data flowmetersData;
    flowmetersData.flowmeterCount = data[0];
    flowmetersData.flowmetersPulsesPerMinute = (flowmeter_data_t *)malloc(sizeof(flowmeter_data_t) * flowmetersData.flowmeterCount);

    memcpy(flowmetersData.flowmetersPulsesPerMinute, &data[1], sizeof(flowmeter_data_t) * flowmetersData.flowmeterCount);

    instance->setLastFlowmeterDataResponseTimestamp(senderAddress, millis());
    instance->registerFlowmetersData(senderAddress, flowmetersData);

    if (instance->wasAllFlowmetersDataReceived())
    {
        flowmeters_data allFlowmetersData;
        instance->getLastFlowmeterData(&allFlowmetersData);

        instance->callGetFlowmetersDataCallbacks(allFlowmetersData);
        instance->setLastFlowmetersDataRequestTimestamp(0);
        instance->flowmetersData.clear();
    }

    free(flowmetersData.flowmetersPulsesPerMinute);
}

void MainModule::getFlowmetersData(std::function<void(flowmeters_data)> callback)
{
    this->addGetFlowmetersDataCallback(callback);
    this->setLastFlowmetersDataRequestTimestamp(millis());

    if (espNowCentralManager->getSlavesCount() == 0)
    {
        flowmeters_data data;
        data.flowmeterCount = 0;
        data.flowmetersPulsesPerMinute = nullptr;
        callGetFlowmetersDataCallbacks(data);
        return;
    }

    while (getPendingFlowmetersDataCount() > 0)
    {
        for (int i = 0; i < espNowCentralManager->getSlavesCount(); i++)
        {
            uint8_t *mac_addr = (uint8_t *)malloc(6);
            espNowCentralManager->getSlaveMacAddress(i, mac_addr);

            if (this->lastFlowmetersDataRequestTimestamp < this->lastFlowmetersDataResponseTimestamps[macAddressToString(mac_addr)])
            {
                continue;
            }

            uint8_t messageType = FLOWMETER_DATA_REQUEST;
            uint8_t *buffer = (uint8_t *)malloc(0);

            Serial.printf("Requesting data from %02X:%02X:%02X:%02X:%02X:%02X\n", mac_addr[0], mac_addr[1], mac_addr[2], mac_addr[3], mac_addr[4], mac_addr[5]);
            ESPNowManager::getInstance()->sendBuffer(mac_addr, messageType, buffer, 0);
        }

        esp_task_wdt_reset();
        delay(250);
    }
}

void MainModule::setRefreshRate(unsigned short refreshRate)
{
    for (int i = 0; i < espNowCentralManager->getSlavesCount(); i++)
    {
        uint8_t *mac_addr = (uint8_t *)malloc(6);
        espNowCentralManager->getSlaveMacAddress(i, mac_addr);

        uint8_t messageType = SET_REFRESH_RATE;
        uint8_t *buffer = (uint8_t *)malloc(sizeof(unsigned short));

        memcpy(buffer, &refreshRate, sizeof(unsigned short));

        ESPNowManager::getInstance()->sendBuffer(mac_addr, messageType, buffer, sizeof(unsigned short));

        free(buffer);
        free(mac_addr);
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
    std::string mac_addr_str = macAddressToString(mac_addr);
    this->lastFlowmetersDataResponseTimestamps[mac_addr_str] = timestamp;
}

void MainModule::registerFlowmetersData(const macAddress_t mac_addr, flowmeters_data data)
{
    std::string mac_addr_str = macAddressToString(mac_addr);

    flowmeters_data flowmetersData;
    flowmetersData.flowmeterCount = data.flowmeterCount;
    flowmetersData.flowmetersPulsesPerMinute = (flowmeter_data_t *)malloc(sizeof(flowmeter_data_t) * data.flowmeterCount);
    memcpy(flowmetersData.flowmetersPulsesPerMinute, data.flowmetersPulsesPerMinute, sizeof(flowmeter_data_t) * data.flowmeterCount);

    this->flowmetersData[mac_addr_str] = flowmetersData;
}

bool MainModule::wasAllFlowmetersDataReceived()
{
    if (espNowCentralManager->getSlavesCount() == 0)
    {
        return true;
    }

    for (int i = 0; i < espNowCentralManager->getSlavesCount(); i++)
    {
        std::string mac_addr_str = espNowCentralManager->getSlaveMacAddress(i);
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
    for (int i = 0; i < espNowCentralManager->getSlavesCount(); i++)
    {
        std::string mac_addr_str = espNowCentralManager->getSlaveMacAddress(i);
        result->flowmeterCount += this->flowmetersData[mac_addr_str].flowmeterCount;
    }
    result->flowmetersPulsesPerMinute = (flowmeter_data_t *)malloc(sizeof(flowmeter_data_t) * result->flowmeterCount);

    int index = 0;
    for (int i = 0; i < espNowCentralManager->getSlavesCount(); i++)
    {
        std::string mac_addr_str = espNowCentralManager->getSlaveMacAddress(i);
        for (int j = 0; j < this->flowmetersData[mac_addr_str].flowmeterCount; j++)
        {
            result->flowmetersPulsesPerMinute[index] = this->flowmetersData[mac_addr_str].flowmetersPulsesPerMinute[j];
            index++;
        }
    }
}

int MainModule::getPendingFlowmetersDataCount()
{
    int count = 0;
    for (int i = 0; i < espNowCentralManager->getSlavesCount(); i++)
    {
        std::string mac_addr_str = espNowCentralManager->getSlaveMacAddress(i);
        unsigned long lastResponseTimestamp = this->lastFlowmetersDataResponseTimestamps[mac_addr_str];
        if (lastResponseTimestamp < this->lastFlowmetersDataRequestTimestamp)
        {
            count++;
        }
    }
    return count;
}

std::string MainModule::macAddressToString(const macAddress_t mac_addr)
{
    char mac_str[18] = {0};
    snprintf(mac_str, sizeof(mac_str), "%02X:%02X:%02X:%02X:%02X:%02X", mac_addr[0], mac_addr[1], mac_addr[2], mac_addr[3], mac_addr[4], mac_addr[5]);
    return std::string(mac_str);
}

void MainModule::loop()
{
}
