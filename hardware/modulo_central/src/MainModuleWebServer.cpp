#include "MainModuleWebServer.h"
#include "MainModule.h"
#include <ArduinoJson.h>
#include <GPS.h>

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
    WiFi.softAP(this->ssid, this->password);

    IPAddress local_ip(192, 168, 0, 1);
    IPAddress gateway(192, 168, 0, 1);
    IPAddress subnet(255, 255, 255, 0);

    WiFi.softAPConfig(local_ip, gateway, subnet);

    this->setupEndpoints();
}

void MainModuleWebServer::setupEndpoints()
{
    server->on("/data", HTTP_GET, std::bind(&MainModuleWebServer::onDataRequest, this, std::placeholders::_1));

    server->on("/set_module_mode", HTTP_POST, [](AsyncWebServerRequest *request)
               {
        if (!request->hasParam("mode", false))
        {
            request->send(400, "application/json", "{\"error\": \"Missing mode parameter\"}");
            return;
        }
        ModuleMode newMode = (ModuleMode)request->getParam("mode", false)->value().toInt();

        MainModule::getInstance()->setMode(newMode);

        request->send(200); });

    server->on("/remove_all_secondary_modules", HTTP_POST, [](AsyncWebServerRequest *request)
               {
        MainModule::getInstance()->removeAllSecondaryModules();
        request->send(200); });
}

void MainModuleWebServer::setupDefaultHeaders()
{
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "*");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "*");
}

void MainModuleWebServer::onDataRequest(AsyncWebServerRequest *request)
{
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

            request->send(200, "application/json", response);
            canSendResponse = true;
        });

    while (!canSendResponse)
    {
        delay(10);
    }
}