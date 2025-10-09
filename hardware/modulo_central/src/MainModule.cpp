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
    // Allocate and copy pulse counts
    flowmetersData.flowmetersPulseCount = (flowmeter_data_t *)malloc(sizeof(flowmeter_data_t) * flowmetersData.flowmeterCount);
    memcpy(flowmetersData.flowmetersPulseCount, &data[1], sizeof(flowmeter_data_t) * flowmetersData.flowmeterCount);

    // After the pulse counts, the secondary sends last pulse ages (unsigned long per flowmeter)
    flowmetersData.flowmetersLastPulseAge = (unsigned long *)malloc(sizeof(unsigned long) * flowmetersData.flowmeterCount);
    const uint8_t *agesSrc = &data[1 + sizeof(flowmeter_data_t) * flowmetersData.flowmeterCount];
    memcpy(flowmetersData.flowmetersLastPulseAge, agesSrc, sizeof(unsigned long) * flowmetersData.flowmeterCount);

    instance->setLastFlowmeterDataResponseTimestamp(senderAddress, millis());
    instance->registerFlowmetersData(senderAddress, flowmetersData);

    if (instance->wasAllFlowmetersDataReceived())
    {
        flowmeters_data allFlowmetersData;
        instance->getLastFlowmeterData(&allFlowmetersData);
        instance->callGetFlowmetersDataCallbacks(allFlowmetersData);
        instance->setLastFlowmetersDataRequestTimestamp(0);
        for (auto &pair : instance->flowmetersData)
        {
            free(pair.second.flowmetersPulseCount);
            if(pair.second.flowmetersLastPulseAge != nullptr) {
                free(pair.second.flowmetersLastPulseAge);
            }
        }
        instance->flowmetersData.clear();
        free(allFlowmetersData.flowmetersPulseCount);
        if(allFlowmetersData.flowmetersLastPulseAge != nullptr) {
            free(allFlowmetersData.flowmetersLastPulseAge);
        }
    }

    free(flowmetersData.flowmetersPulseCount);
    if(flowmetersData.flowmetersLastPulseAge != nullptr) {
        free(flowmetersData.flowmetersLastPulseAge);
    }
}

void MainModule::getFlowmetersData(std::function<void(flowmeters_data)> callback)
{
    this->addGetFlowmetersDataCallback(callback);
    this->setLastFlowmetersDataRequestTimestamp(millis());

    if (espNowCentralManager->getSlavesCount() == 0)
    {
        flowmeters_data data;
        data.flowmeterCount = 0;
        data.flowmetersPulseCount = nullptr;
        data.flowmetersLastPulseAge = nullptr;
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
            uint8_t *buffer = nullptr;

            // Serial.printf("Requesting data from %02X:%02X:%02X:%02X:%02X:%02X\n", mac_addr[0], mac_addr[1], mac_addr[2], mac_addr[3], mac_addr[4], mac_addr[5]);
            ESPNowManager::getInstance()->sendBuffer(mac_addr, messageType, buffer, 0);
            free(mac_addr);
        }

        esp_task_wdt_reset();
        delay(250);
    }
}

void MainModule::setRefreshRate(unsigned short refreshRate, std::vector<uint8_t> flowmeterIndexes)
{
    uint8_t flowmeterIndexesBySlave[espNowCentralManager->getSlavesCount()][9];

    for(int i = 0; i < flowmeterIndexes.size(); i++)
    {
        uint8_t index = flowmeterIndexes[i] % 9;
        uint8_t slave = flowmeterIndexes[i] / 9;
        if(slave < espNowCentralManager->getSlavesCount())
        {
            flowmeterIndexesBySlave[slave][index] = 1;
        }
    }

    // Send flowmeter irefreshrate followed by the indexes to each slave. Each slave can handle up to 9 flowmeters. The indexes are represented by 9 bits.
    for (int i = 0; i < espNowCentralManager->getSlavesCount(); i++)
    {
        uint8_t *mac_addr = (uint8_t *)malloc(6);
        espNowCentralManager->getSlaveMacAddress(i, mac_addr);

        uint8_t messageType = SET_REFRESH_RATE;
        uint8_t *buffer = (uint8_t *)malloc(sizeof(unsigned short) + 9);
        memcpy(buffer, &refreshRate, sizeof(unsigned short));

        for(int j = 0; j < 9; j++)
        {
            buffer[sizeof(unsigned short) + j] = flowmeterIndexesBySlave[i][j];
        }

        ESPNowManager::getInstance()->sendBuffer(mac_addr, messageType, buffer, sizeof(unsigned short) + 9);
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
    flowmetersData.flowmetersPulseCount = (flowmeter_data_t *)malloc(sizeof(flowmeter_data_t) * data.flowmeterCount);
    memcpy(flowmetersData.flowmetersPulseCount, data.flowmetersPulseCount, sizeof(flowmeter_data_t) * data.flowmeterCount);
    // Copy last pulse ages if present
    flowmetersData.flowmetersLastPulseAge = (unsigned long *)malloc(sizeof(unsigned long) * data.flowmeterCount);
    if(data.flowmetersLastPulseAge != nullptr) {
        memcpy(flowmetersData.flowmetersLastPulseAge, data.flowmetersLastPulseAge, sizeof(unsigned long) * data.flowmeterCount);
    } else {
        // Initialize to zero if not provided
        memset(flowmetersData.flowmetersLastPulseAge, 0, sizeof(unsigned long) * data.flowmeterCount);
    }

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
    result->flowmetersPulseCount = (flowmeter_data_t *)malloc(sizeof(flowmeter_data_t) * result->flowmeterCount);
    result->flowmetersLastPulseAge = (unsigned long *)malloc(sizeof(unsigned long) * result->flowmeterCount);

    int index = 0;
    for (int i = 0; i < espNowCentralManager->getSlavesCount(); i++)
    {
        std::string mac_addr_str = espNowCentralManager->getSlaveMacAddress(i);
        for (int j = 0; j < this->flowmetersData[mac_addr_str].flowmeterCount; j++)
        {
            result->flowmetersPulseCount[index] = this->flowmetersData[mac_addr_str].flowmetersPulseCount[j];
            result->flowmetersLastPulseAge[index] = this->flowmetersData[mac_addr_str].flowmetersLastPulseAge[j];
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
