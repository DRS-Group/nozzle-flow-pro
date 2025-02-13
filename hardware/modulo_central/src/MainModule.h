#include <esp_now_types.h>
#include <Preferences.h>
#include <esp_now.h>
#include "MainModuleWebServer.h"
#include <map>
#include <ESPNowCentralManager/ESPNowCentralManager.h>

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
    MainModuleWebServer *webServer = new MainModuleWebServer("NOZZLE FLOW PRO", "123456789");
    ESPNowCentralManager *espNowCentralManager = ESPNowCentralManager::getInstance();

    std::vector<std::function<void(flowmeters_data)>> getFlowmetersDataCallbacks;
    int getFlowmetersDataCallbacksCount = 0;

    unsigned long lastFlowmetersDataRequestTimestamp = 0;
    std::map<std::string, unsigned long> lastFlowmetersDataResponseTimestamps;

    std::map<std::string, flowmeters_data> flowmetersData;

public:
    ESPNowCentralManager *getEspNowCentralManager();

    static void onDataResponseReceived(const uint8_t *mac_addr, const uint8_t *data, int data_len);

    void getFlowmetersData(std::function<void(flowmeters_data)> callback);

    void addGetFlowmetersDataCallback(std::function<void(flowmeters_data)> callback);
    void callGetFlowmetersDataCallbacks(flowmeters_data data);

    void setLastFlowmetersDataRequestTimestamp(unsigned long timestamp);
    void setLastFlowmeterDataResponseTimestamp(const macAddress_t mac_addr, unsigned long timestamp);
    void registerFlowmetersData(const macAddress_t mac_addr, flowmeters_data data);
    bool wasAllFlowmetersDataReceived();

    void getLastFlowmeterData(flowmeters_data *result);

    std::string macAddressToString(const macAddress_t mac_addr);

    void loop();
};