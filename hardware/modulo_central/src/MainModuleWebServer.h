#pragma once

#include <ESPAsyncWebServer.h>
#include <esp_now_types.h>

class MainModuleWebServer
{
public:
    MainModuleWebServer(const char *ssid, const char *password);
    ~MainModuleWebServer();

    void setup();

private:
    const char *ssid;
    const char *password;

    AsyncWebServer *server = new AsyncWebServer(80);

    std::function<ModuleMode(void)> getModuleMode;

private:
    void setupEndpoints();
    void setupDefaultHeaders();

    void onDataRequest(AsyncWebServerRequest *request);

public:
    void setGetModuleMode(std::function<ModuleMode(void)> getModuleMode)
    {
        this->getModuleMode = getModuleMode;
    }

    void start()
    {
        server->begin();
    }

    void stop()
    {
        server->end();
    }
};