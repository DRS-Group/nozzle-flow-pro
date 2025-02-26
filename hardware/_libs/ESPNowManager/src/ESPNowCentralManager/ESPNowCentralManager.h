#include "ESPNowManager.h"
#include <vector>
#include <Preferences.h>

class ESPNowCentralManager : ESPNowManager
{
public:
    ESPNowCentralManager();
    ~ESPNowCentralManager();

private:
    Preferences *preferences = nullptr;

    bool isParingEnabled = false;

    macAddress_t *slaves = nullptr;
    uint8_t slavesCount = 0;

    static void onPairRequestReceived(const uint8_t *mac_addr, const uint8_t *data, int data_len);

    bool isSlave(const macAddress_t mac_addr);

    void confirmPairing(const macAddress_t mac_addr);

    uint8_t getSlaveIndex(const macAddress_t mac_addr);
    void addSlave(const macAddress_t mac_addr);
    void removeSlave(const macAddress_t mac_addr);
    void loadSlaves();
    void saveSlaves();

public:
    static ESPNowCentralManager *getInstance();

    void enablePairing();
    void disablePairing();
    uint8_t getSlavesCount();
    void getSlaveMacAddress(uint8_t index, macAddress_t &mac_addr);
    void getSlaveMacAddress(uint8_t index, uint8_t *mac_addr);
    std::string getSlaveMacAddress(uint8_t index);
    void removeAllSlaves();
    bool isPairingEnabled();
};