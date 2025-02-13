#pragma once

#include <esp_timer.h>

class LedBlinker
{
public:
    LedBlinker(uint8_t pin, unsigned int interval);

    void start();
    void stop();
    bool isBlinking();

private:
    esp_timer_handle_t timer;
    bool led_state;
    uint8_t pin;
    unsigned int interval;

    void toggleLed();

    static void onTimer(void *arg);
};