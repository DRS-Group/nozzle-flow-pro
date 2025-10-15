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
    addFlowmeter(22, 2500);
    addFlowmeter(14, 2500);
    addFlowmeter(27, 2500);
    addFlowmeter(26, 2500);
    addFlowmeter(25, 2500);
    addFlowmeter(33, 2500);
    addFlowmeter(32, 2500);
    addFlowmeter(35, 2500);
    addFlowmeter(34, 2500);

    espNowManager->registerCallback(
        FLOWMETER_DATA_REQUEST,
        SecondaryModule::onDataRequest);

    espNowManager->registerCallback(
        SET_REFRESH_RATE,
        SecondaryModule::onSetRefreshRate);
    espNowManager->registerCallback(
        SET_DEBOUNCE,
        SecondaryModule::onSetDebounce);
    espNowManager->registerCallback(
        SET_MIN_PULSES_PER_PACKET,
        SecondaryModule::onSetMinPulsesPerPacket);
    espNowManager->registerCallback(
        SET_MAX_NUMBER_OF_PACKETS,
        SecondaryModule::onSetMaxNumberOfPackets);
}

SecondaryModule::~SecondaryModule()
{
}

void SecondaryModule::onDataRequest(const uint8_t *mac_addr, const uint8_t *incomingData, int len)
{
    SecondaryModule *instance = SecondaryModule::getInstance();
    if (!instance)
        return;

    macAddress_t senderAddress;
    memcpy(senderAddress, mac_addr, sizeof(macAddress_t));

    flowmeters_data flowmetersData = instance->getFlowmeterData();
    if (flowmetersData.flowmeterCount == 0)
        return;

    const size_t responseSize = sizeof(uint8_t) +
                                flowmetersData.flowmeterCount * sizeof(unsigned short) +
                                flowmetersData.flowmeterCount * sizeof(unsigned long);

    uint8_t *responseBuffer = static_cast<uint8_t *>(malloc(responseSize));
    if (!responseBuffer)
    {
        free(flowmetersData.flowmetersPulsesPerMinute);
        free(flowmetersData.flowmetersLastPulseAge);
        return;
    }

    responseBuffer[0] = flowmetersData.flowmeterCount;

    memcpy(responseBuffer + 1,
           flowmetersData.flowmetersPulsesPerMinute,
           flowmetersData.flowmeterCount * sizeof(unsigned short));

    memcpy(responseBuffer + 1 + flowmetersData.flowmeterCount * sizeof(unsigned short),
           flowmetersData.flowmetersLastPulseAge,
           flowmetersData.flowmeterCount * sizeof(unsigned long));

    instance->espNowManager->sendBuffer(mac_addr,
                                        FLOWMETER_DATA_REQUEST + 0x80,
                                        responseBuffer,
                                        responseSize);

    free(responseBuffer);
    free(flowmetersData.flowmetersPulsesPerMinute);
    free(flowmetersData.flowmetersLastPulseAge);
}

void SecondaryModule::onSetRefreshRate(const uint8_t *mac_addr, const uint8_t *incomingData, int len)
{
    SecondaryModule *instance = SecondaryModule::getInstance();

    // First 2 bytes are the refreshRate
    unsigned short refreshRate = *reinterpret_cast<const unsigned short *>(incomingData);

    // Next 9 bytes are flowmeter flags (one byte per flowmeter)
    const uint8_t *indexesData = incomingData + sizeof(unsigned short);

    for (uint8_t i = 0; i < 9; i++)
    {
        if (indexesData[i] != 0) // non-zero = update this flowmeter
        {
            instance->setRefreshRate(refreshRate, i);
        }
    }
}

void SecondaryModule::onSetDebounce(const uint8_t *mac_addr, const uint8_t *incomingData, int len)
{
    SecondaryModule *instance = SecondaryModule::getInstance();

    // First 2 bytes are the debounce value
    unsigned short debounce = *reinterpret_cast<const unsigned short *>(incomingData);

    // Next 9 bytes are flowmeter flags
    const uint8_t *indexesData = incomingData + sizeof(unsigned short);

    for (uint8_t i = 0; i < 9; i++)
    {
        if (indexesData[i] != 0) // non-zero = update this flowmeter
        {
            instance->setDebounce(debounce, i);
        }
    }
}

void SecondaryModule::onSetMinPulsesPerPacket(const uint8_t *mac_addr, const uint8_t *incomingData, int len)
{
    SecondaryModule *instance = SecondaryModule::getInstance();

    // First 2 bytes: minPulsesPerPacket
    unsigned short minPulsesPerPacket = *reinterpret_cast<const unsigned short *>(incomingData);

    // Next 9 bytes: flowmeter flags
    const uint8_t *indexesData = incomingData + sizeof(unsigned short);

    for (uint8_t i = 0; i < 9; i++)
    {
        if (indexesData[i] != 0) // non-zero = update this flowmeter
        {
            instance->setMinPulsesPerPacket(minPulsesPerPacket, i);
        }
    }
}

void SecondaryModule::onSetMaxNumberOfPackets(const uint8_t *mac_addr, const uint8_t *incomingData, int len)
{
    SecondaryModule *instance = SecondaryModule::getInstance();

    // First 2 bytes: maxNumberOfPackets
    unsigned short maxNumberOfPackets = *reinterpret_cast<const unsigned short *>(incomingData);

    // Next 9 bytes: flowmeter flags
    const uint8_t *indexesData = incomingData + sizeof(unsigned short);

    for (uint8_t i = 0; i < 9; i++)
    {
        if (indexesData[i] != 0) // non-zero = update this flowmeter
        {
            instance->setMaxNumberOfPackets(maxNumberOfPackets, i);
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

    data.flowmetersPulsesPerMinute = static_cast<unsigned short *>(malloc(this->flowmeterCount * sizeof(unsigned short)));
    data.flowmetersLastPulseAge = static_cast<unsigned long *>(malloc(this->flowmeterCount * sizeof(unsigned long)));

    for (uint8_t i = 0; i < this->flowmeterCount; i++)
    {
        data.flowmetersPulsesPerMinute[i] = this->flowmeters[i]->getProcessedPulsesPerMinute();
        data.flowmetersLastPulseAge[i] = this->flowmeters[i]->getLastPulseAge();
    }

    return data;
}

void SecondaryModule::setRefreshRate(unsigned short refreshRate, uint8_t flowmeterIndex)
{
    this->flowmeters[flowmeterIndex]->setRefreshRate(refreshRate);
    Serial.printf("Setting refreshRate of %d to %d", flowmeterIndex, refreshRate);
}

void SecondaryModule::setDebounce(unsigned short debounce, uint8_t flowmeterIndex)
{
    this->flowmeters[flowmeterIndex]->setDebounce(debounce);
    Serial.printf("Setting debounce of %d to %d", flowmeterIndex, debounce);
}

void SecondaryModule::setMinPulsesPerPacket(unsigned short minPulsesPerPacket, uint8_t flowmeterIndex)
{
    this->flowmeters[flowmeterIndex]->setMinPulsesPerPacket(minPulsesPerPacket);
    Serial.printf("Setting minPulsesPerPacket of sensor %d to %d", flowmeterIndex, minPulsesPerPacket);
}

void SecondaryModule::setMaxNumberOfPackets(unsigned short maxNumberOfPackets, uint8_t flowmeterIndex)
{
    this->flowmeters[flowmeterIndex]->setMaxNumberOfPackets(maxNumberOfPackets);
    Serial.printf("Setting maxNumberOfPackets of sensor %d to %d", flowmeterIndex, maxNumberOfPackets);
}

void SecondaryModule::loop()
{
    if (!espNowManager->isServerAddressSet())
    {
        espNowManager->beginPairing();
    }
}
