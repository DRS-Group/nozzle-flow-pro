#include <esp_now_types.h>
#include <Preferences.h>
#include <esp_now.h>
#include "MainModuleWebServer.h"
#include <map>

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

    std::vector<std::function<void(flowmeters_data)>> getFlowmetersDataCallbacks;
    int getFlowmetersDataCallbacksCount = 0;

    unsigned long lastFlowmetersDataRequestTimestamp = 0;
    std::map<std::string, unsigned long> lastFlowmetersDataResponseTimestamps;

    std::map<std::string, flowmeters_data> flowmetersData;

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
    int getSecondaryModuleIndex(const macAddress_t mac_addr);
    void addSecondaryModule(const macAddress_t mac_addr);
    void removeSecondaryModule(const macAddress_t mac_addr);
    void removeAllSecondaryModules();
    void printSecondaryModules();
    bool isSecondaryModule(const macAddress_t mac_addr);
    ModuleMode getModuleMode();
    void setMode(ModuleMode mode);

    void getFlowmetersData(std::function<void(flowmeters_data)> callback);

    void addGetFlowmetersDataCallback(std::function<void(flowmeters_data)> callback);
    void callGetFlowmetersDataCallbacks(flowmeters_data data);

    void setLastFlowmetersDataRequestTimestamp(unsigned long timestamp);
    void setLastFlowmeterDataResponseTimestamp(const macAddress_t mac_addr, unsigned long timestamp);
    void registerFlowmetersData(const macAddress_t mac_addr, flowmeters_data data);
    bool isAllFlowmetersDataReceived();

    /*
     * This function returns the last flowmeters data received from all secondary modules.
     * @param result: pointer to a flowmeters_data struct that will be filled with the data.
     */
    void getLastFlowmeterData(flowmeters_data *result);

    // function to convert macAddress_t to string
    static std::string macToString(const macAddress_t mac)
    {
        char macStr[18] = {0};
        snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
        return std::string(macStr);
    }

    void loop();
};