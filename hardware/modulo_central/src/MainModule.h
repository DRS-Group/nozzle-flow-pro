#include <esp_now_types.h>
#include <Preferences.h>
#include <esp_now.h>
#include "MainModuleWebServer.h"

class MainModule
{
private:
    MainModule();
    ~MainModule();

    static MainModule *instance;

public:
    static MainModule *getInstance();

private:
    macAddress_t macAddress = {0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
    macAddress_t *secondaryModules = nullptr;
    unsigned int secondaryModuleCount = 0;
    ModuleMode mode = MODULE_MODE_RUNNING;
    Preferences *preferences = new Preferences();
    MainModuleWebServer *webServer = new MainModuleWebServer("NOZZLE FLOW PRO", "123456789");

public:
    void setup();
    void getMacAddress(uint8_t *baseMac);
    void addPeer(const macAddress_t mac_addr);
    void removePeer(const macAddress_t mac_addr);

    void loadSavedSecondaryModules();
    void confirmPairing(const macAddress_t mac_addr);

    void onReceiveData(const uint8_t *mac_addr, const uint8_t *data, int data_len);
    void onSendData(const uint8_t *mac_addr, esp_now_send_status_t status);

    int getSecondaryModuleCount();
    void addSecondaryModule(const macAddress_t mac_addr);
    void removeSecondaryModule(const macAddress_t mac_addr);
    void removeAllSecondaryModules();
    void printSecondaryModules();
    bool isSecondaryModule(const macAddress_t mac_addr);
    ModuleMode getModuleMode();
    void setMode(ModuleMode mode);

    void loop();
};