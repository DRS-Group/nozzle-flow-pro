#include "LedBlinker.h"
#include <Arduino.h>

LedBlinker::LedBlinker(uint8_t pin, unsigned int interval)
{
    this->pin = pin;
    pinMode(this->pin, OUTPUT);
    led_state = false;
    this->interval = interval;

    esp_timer_create_args_t timer_args = {
        .callback = &onTimer,
        .arg = this,
        .dispatch_method = ESP_TIMER_TASK,
        .name = "blink_led_timer"};
    esp_timer_create(&timer_args, &timer);
}

void LedBlinker::start()
{
    esp_timer_start_periodic(timer, this->interval * 1000);
}

void LedBlinker::stop()
{
    esp_timer_stop(timer);
    digitalWrite(this->pin, LOW);
}

bool LedBlinker::isBlinking()
{
    return esp_timer_is_active(timer);
}

void LedBlinker::onTimer(void *arg)
{
    LedBlinker *instance = (LedBlinker *)arg;
    instance->toggleLed();
}

void LedBlinker::toggleLed()
{
    led_state = !led_state;
    digitalWrite(this->pin, led_state);
}
