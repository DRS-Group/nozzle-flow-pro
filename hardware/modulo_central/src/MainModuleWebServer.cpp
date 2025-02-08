#include "MainModuleWebServer.h"
#include "MainModule.h"

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
    // server->on("/module_mode", HTTP_GET, [](AsyncWebServerRequest *request)
    //            {
    //                 ModuleMode mode = MainModule::getInstance()->getModuleMode();
    //                 request->send(200, "application/json", "{\"mode\": " + String(mode) + "}"); });

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

    server->on("/", HTTP_GET, [](AsyncWebServerRequest *request)
               { 
                Serial.println("GET /");
                request->send(200, "text/plain", "Hello, world"); });
}

void MainModuleWebServer::setupDefaultHeaders()
{
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "*");
    DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "*");
}
