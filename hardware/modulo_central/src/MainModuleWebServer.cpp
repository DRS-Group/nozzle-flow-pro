#include "MainModuleWebServer.h"
#include "MainModule.h"
#include <ArduinoJson.h>
#include <GPS.h>
#include <esp_task_wdt.h>

MainModuleWebServer::MainModuleWebServer(const char *ssid, const char *password)
{
    this->ssid = ssid;
    this->password = password;

    this->setup();
}

MainModuleWebServer::~MainModuleWebServer()
{
}

void MainModuleWebServer::setup()
{
    if (WiFi.getMode() == WIFI_STA)
    {
        WiFi.mode(WIFI_AP_STA);
    }
    else
    {
        WiFi.mode(WIFI_AP);
    }

    WiFi.softAP(this->ssid, this->password);

    IPAddress local_ip(192, 168, 0, 1);
    IPAddress gateway(192, 168, 0, 1);
    IPAddress subnet(255, 255, 255, 0);

    WiFi.softAPConfig(local_ip, gateway, subnet);

    this->setupEndpoints();
    this->setupDefaultHeaders();
}

void MainModuleWebServer::setupEndpoints()
{
    server->on("/data", HTTP_GET, std::bind(&MainModuleWebServer::onDataRequest, this, std::placeholders::_1));

    server->on(
        "/get_module_mode",
        HTTP_GET,
        [](AsyncWebServerRequest *request)
        {
            ModuleMode mode = MainModule::getInstance()->getEspNowCentralManager()->isPairingEnabled() ? MODULE_MODE_PAIRING : MODULE_MODE_RUNNING;
            request->send(200, "application/json", "{\"mode\": " + String(mode) + "}");
        });

    server->on("/set_module_mode", HTTP_POST, [](AsyncWebServerRequest *request)
               {
        if (!request->hasParam("mode", false))
        {
            request->send(400, "application/json", "{\"error\": \"Missing mode parameter\"}");
            return;
        }
        ModuleMode newMode = (ModuleMode)request->getParam("mode", false)->value().toInt();

        if(newMode == MODULE_MODE_PAIRING)
        {
            MainModule::getInstance()->getEspNowCentralManager()->enablePairing();
        }
        else
        {
            MainModule::getInstance()->getEspNowCentralManager()->disablePairing();
        }

        request->send(200); });

    server->on(
        "/remove_all_secondary_modules",
        HTTP_POST, [](AsyncWebServerRequest *request)
        {
            MainModule::getInstance()->getEspNowCentralManager()->removeAllSlaves();
            request->send(200); });

    server->on(
        "/get_secondary_modules_count",
        HTTP_GET, [](AsyncWebServerRequest *request)
        {
            uint8_t count = MainModule::getInstance()->getEspNowCentralManager()->getSlavesCount();
            request->send(200, "application/json", "{\"count\": " + String(count) + "}"); });

    server->on(
        "/set_refresh_rate",
        HTTP_POST, [](AsyncWebServerRequest *request)
        {
            if (!request->hasParam("refresh_rate", false))
            {
                request->send(400, "application/json", "{\"error\": \"Missing rate parameter\"}");
                return;
            }
            unsigned short newRate = request->getParam("refresh_rate", false)->value().toInt();

            MainModule::getInstance()->setRefreshRate(newRate);

            request->send(200); });
}

void MainModuleWebServer::setupDefaultHeaders()
{
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "*");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "*");
}

int count = 0;
void MainModuleWebServer::onDataRequest(AsyncWebServerRequest *request)
{
    Serial.printf("Data request received: %d\n", count++);

    MainModule *mainModule = MainModule::getInstance();

    bool canSendResponse = false;

    mainModule->getFlowmetersData(
        [request, &canSendResponse](flowmeters_data data)
        {
            JsonDocument doc;
            JsonArray flowmeters = doc["flowmetersPulsesPerMinute"].to<JsonArray>();
            for (int i = 0; i < data.flowmeterCount; i++)
            {
                flowmeters.add(data.flowmetersPulsesPerMinute[i]);
            }

            float speed = GPS::getInstance()->getSpeed();
            doc["speed"] = speed;

            uint32_t satelliteCount = GPS::getInstance()->getSatelliteCount();
            doc["satelliteCount"] = satelliteCount;

            String response;
            serializeJson(doc, response);

            try
            {

                if (request->client()->connected())
                {
                    request->send(200, "application/json", response);
                }
            }
            catch (const std::exception &e)
            {
                Serial.printf("Error sending response: %s\n", e.what());
            }

            canSendResponse = true;
        });

    while (!canSendResponse)
    {
        delay(10);
        esp_task_wdt_reset();
    }
}