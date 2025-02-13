#include "ESPNowManager.h"

class ESPNowSlaveManager : public ESPNowManager
{
public:
    ESPNowSlaveManager();
    ~ESPNowSlaveManager();

private:
    macAddress_t macAddress = {0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
    macAddress_t serverAddress = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

    void broadcastPairingRequest();
    void getServerAddress(macAddress_t &address);
    void getMacAddress(uint8_t *baseMac);

    static void onPairResponseReceived(const uint8_t *mac_addr, const uint8_t *data, int data_len);

public:
    static ESPNowSlaveManager *getInstance();

    bool isServerAddressSet();
    void setServerAddress(const macAddress_t &address);
    void beginPairing();
};