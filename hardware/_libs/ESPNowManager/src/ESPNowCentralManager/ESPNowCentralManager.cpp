#include "ESPNowCentralManager.h"

ESPNowCentralManager::ESPNowCentralManager() : ESPNowManager()
{
    preferences = new Preferences();
    preferences->begin("espnow", false);

    loadSlaves();

    registerCallback(
        PAIR_REQUEST,
        ESPNowCentralManager::onPairRequestReceived);
}

ESPNowCentralManager::~ESPNowCentralManager()
{
}

void ESPNowCentralManager::onPairRequestReceived(const uint8_t *mac_addr, const uint8_t *data, int data_len)
{
    ESPNowCentralManager *instance = ESPNowCentralManager::getInstance();

    macAddress_t macAddress;
    memcpy(macAddress, mac_addr, sizeof(macAddress_t));

    if (instance->isSlave(macAddress))
    {
        instance->confirmPairing(macAddress);
        return;
    }

    if (!instance->isParingEnabled)
    {
        return;
    }

    instance->addSlave(macAddress);

    instance->confirmPairing(macAddress);
}

bool ESPNowCentralManager::isSlave(const macAddress_t mac_addr)
{
    for (int i = 0; i < getSlavesCount(); i++)
    {
        if (memcmp(&this->slaves[i], mac_addr, sizeof(macAddress_t)) == 0)
        {
            return true;
        }
    }
    return false;
}

void ESPNowCentralManager::confirmPairing(const macAddress_t mac_addr)
{
    uint8_t *buffer = (uint8_t *)malloc(0);
    sendBuffer(mac_addr, PAIR_REQUEST + 0x80, buffer, 0);
}

uint8_t ESPNowCentralManager::getSlaveIndex(const macAddress_t mac_addr)
{
    for (uint8_t i = 0; i < slavesCount; i++)
    {
        if (memcmp(slaves[i], mac_addr, sizeof(macAddress_t)) == 0)
        {
            return i;
        }
    }
    return -1;
}

void ESPNowCentralManager::addSlave(const macAddress_t mac_addr)
{
    if (isSlave(mac_addr))
    {
        return;
    }

    macAddress_t *newSlaves = (macAddress_t *)realloc(this->slaves, sizeof(macAddress_t) * (getSlavesCount() + 1));
    if (newSlaves == nullptr)
    {
        return;
    }
    this->slaves = newSlaves;
    memcpy(&this->slaves[getSlavesCount()], mac_addr, sizeof(macAddress_t));
    this->slavesCount++;

    saveSlaves();

    addPeer(mac_addr);
}

void ESPNowCentralManager::removeSlave(const macAddress_t mac_addr)
{

    for (int i = 0; i < getSlavesCount(); i++)
    {
        if (memcmp(&this->slaves[i], mac_addr, sizeof(macAddress_t)) == 0)
        {
            for (int j = i; j < getSlavesCount() - 1; j++)
            {
                memcpy(&this->slaves[j], &this->slaves[j + 1], sizeof(macAddress_t));
            }
            this->slaves = (macAddress_t *)realloc(this->slaves, sizeof(macAddress_t) * (getSlavesCount() - 1));
            this->slavesCount--;

            saveSlaves();

            break;
        }
    }

    removePeer(mac_addr);
}

void ESPNowCentralManager::loadSlaves()
{
    if (this->preferences->isKey("slavesCount") == false || this->preferences->isKey("slaves") == false)
    {
        return;
    }

    this->slavesCount = this->preferences->getUInt("slavesCount", 0);
    if (this->slavesCount == 0)
    {
        return;
    }

    this->slaves = (macAddress_t *)malloc(sizeof(macAddress_t) * this->slavesCount);
    this->preferences->getBytes("slaves", (uint8_t *)this->slaves, sizeof(macAddress_t) * this->slavesCount);
    for (int i = 0; i < this->slavesCount; i++)
    {
        addPeer(this->slaves[i]);
    }
}

void ESPNowCentralManager::saveSlaves()
{
    this->preferences->putBytes("slaves", (uint8_t *)this->slaves, sizeof(macAddress_t) * getSlavesCount());
    this->preferences->putUInt("slavesCount", getSlavesCount());
}

ESPNowCentralManager *ESPNowCentralManager::getInstance()
{
    if (instance == nullptr)
    {
        instance = new ESPNowCentralManager();
    }
    return static_cast<ESPNowCentralManager *>(instance);
}

void ESPNowCentralManager::enablePairing()
{
    isParingEnabled = true;
}

void ESPNowCentralManager::disablePairing()
{
    isParingEnabled = false;
}

uint8_t ESPNowCentralManager::getSlavesCount()
{
    return slavesCount;
}

void ESPNowCentralManager::getSlaveMacAddress(uint8_t index, macAddress_t &mac_addr)
{
    memcpy(mac_addr, slaves[index], sizeof(macAddress_t));
}

void ESPNowCentralManager::getSlaveMacAddress(uint8_t index, uint8_t *mac_addr)
{
    memcpy(mac_addr, slaves[index], sizeof(macAddress_t));
}

std::string ESPNowCentralManager::getSlaveMacAddress(uint8_t index)
{
    char buffer[18];
    snprintf(buffer, sizeof(buffer), "%02X:%02X:%02X:%02X:%02X:%02X",
             slaves[index][0], slaves[index][1], slaves[index][2], slaves[index][3], slaves[index][4], slaves[index][5]);
    return std::string(buffer);
}

void ESPNowCentralManager::removeAllSlaves()
{
    for (int i = 0; i < getSlavesCount(); i++)
    {
        removePeer(this->slaves[i]);
    }

    if (this->slaves != nullptr)
    {
        free(this->slaves);
        this->slaves = nullptr;
        this->slavesCount = 0;
        saveSlaves();
    }
}

bool ESPNowCentralManager::isPairingEnabled()
{
    return isParingEnabled;
}
