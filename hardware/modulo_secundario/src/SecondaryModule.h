#include <esp_now_types.h>
#include <Preferences.h>

class SecondaryModule
{
public:
    void printMAC(const uint8_t *mac_addr);

    static SecondaryModule *getInstance();

private:
    SecondaryModule();

    ~SecondaryModule();

    static SecondaryModule *instance;

private:
    macAddress_t macAddress = {0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
    macAddress_t serverAddress = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

    Preferences *preferences = new Preferences();

private:
    void printInitialMessage();
    void setupESPNow();
    void setServerAddress(const macAddress_t &address);
    void broadcastPairingRequest();
    void addPeer(const uint8_t *mac_addr);

    void onReceiveData(const uint8_t *mac_addr, const uint8_t *incomingData, int len);

public:
    void getServerAddress(macAddress_t &address);
    void getMacAddress(uint8_t *baseMac);
    bool isServerAddressSet();

    void loop();
};