#include "SecondaryModule.h"
#include <WiFi.h>
#include <esp_wifi.h>
#include <esp_now.h>

SecondaryModule *SecondaryModule::instance = nullptr;

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
    addFlowmeter(22, 5000);
    addFlowmeter(14, 5000);
    addFlowmeter(27, 5000);
    addFlowmeter(26, 5000);
    addFlowmeter(25, 5000);
    addFlowmeter(33, 5000);
    addFlowmeter(32, 5000);
    addFlowmeter(35, 5000);
    addFlowmeter(34, 5000);

    espNowManager->registerCallback(
        FLOWMETER_DATA_REQUEST,
        SecondaryModule::onDataRequest);

    espNowManager->registerCallback(
        SET_REFRESH_RATE,
        SecondaryModule::onSetRefreshRate);
}

SecondaryModule::~SecondaryModule()
{
}

void SecondaryModule::onDataRequest(const uint8_t *mac_addr, const uint8_t *incomingData, int len)
{
    SecondaryModule *instance = SecondaryModule::getInstance();

    macAddress_t senderAddress;
    memcpy(senderAddress, mac_addr, sizeof(macAddress_t));

    flowmeters_data flowmetersData = instance->getFlowmeterData();

    // Calculate response size: 1 byte for count, pulse counts, and last pulse ages
    const size_t responseSize = sizeof(uint8_t) +
        flowmetersData.flowmeterCount * sizeof(flowmeter_data_t) +
        flowmetersData.flowmeterCount * sizeof(unsigned long);

    uint8_t *responseBuffer = static_cast<uint8_t *>(malloc(responseSize));
    responseBuffer[0] = flowmetersData.flowmeterCount;

    // Copy pulse counts
    memcpy(responseBuffer + 1, flowmetersData.flowmetersPulseCount, flowmetersData.flowmeterCount * sizeof(flowmeter_data_t));
    // Copy last pulse ages
    memcpy(responseBuffer + 1 + flowmetersData.flowmeterCount * sizeof(flowmeter_data_t),
           flowmetersData.flowmetersLastPulseAge, flowmetersData.flowmeterCount * sizeof(unsigned long));

    instance->espNowManager->sendBuffer(mac_addr, FLOWMETER_DATA_REQUEST + 0x80, responseBuffer, responseSize);

    free(responseBuffer);
    free(flowmetersData.flowmetersPulseCount);
    free(flowmetersData.flowmetersLastPulseAge);
}

void SecondaryModule::onSetRefreshRate(const uint8_t *mac_addr, const uint8_t *incomingData, int len)
{
    SecondaryModule *instance = SecondaryModule::getInstance();

    unsigned short refreshRate = *reinterpret_cast<const unsigned short *>(incomingData);
    uint8_t flowmeterIndexes = *(incomingData + sizeof(unsigned short)); // Get the flowmeter indexes from the incoming data

    for (uint8_t i = 0; i < 9; i++) // Assuming 9 flowmeters
    {
        if (flowmeterIndexes & (1 << i)) // Check if the i-th bit is set
        {
            instance->setRefreshRate(refreshRate, i); // Set refresh rate for the specific flowmeter
            // You may want to implement a method to set refresh rate for a specific flowmeter
        }
    }
}

void SecondaryModule::addFlowmeter(uint8_t pin, unsigned short refreshRate)
{
    Flowmeter *newFlowmeter = new Flowmeter(pin, refreshRate);

    const uint8_t flowmeterCount = this->getFlowmeterCount();

    Flowmeter **newFlowmeters = static_cast<Flowmeter **>(realloc(this->flowmeters, (flowmeterCount + 1) * sizeof(Flowmeter *)));
    this->flowmeters = newFlowmeters;
    this->flowmeters[flowmeterCount] = newFlowmeter;
    this->flowmeterCount++;
}

uint8_t SecondaryModule::getFlowmeterCount()
{
    return this->flowmeterCount;
}

flowmeters_data SecondaryModule::getFlowmeterData()
{
    flowmeters_data data;
    data.flowmeterCount = this->flowmeterCount;

    data.flowmetersPulseCount = static_cast<flowmeter_data_t *>(malloc(this->flowmeterCount * sizeof(flowmeter_data_t)));
    data.flowmetersLastPulseAge = static_cast<unsigned long *>(malloc(this->flowmeterCount * sizeof(unsigned long)));

    for (uint8_t i = 0; i < this->flowmeterCount; i++)
    {
        data.flowmetersPulseCount[i] = this->flowmeters[i]->getPulseCount();
        data.flowmetersLastPulseAge[i] = this->flowmeters[i]->getLastPulseAge();
    }

    return data;
}

void SecondaryModule::setRefreshRate(unsigned short refreshRate, uint8_t flowmeterIndex)
{
    this->flowmeters[flowmeterIndex]->setRefreshRate(refreshRate);
}

void SecondaryModule::loop()
{
    if (!espNowManager->isServerAddressSet())
    {
        espNowManager->beginPairing();
    }
}
