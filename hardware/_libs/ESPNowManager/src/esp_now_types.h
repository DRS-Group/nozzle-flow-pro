#pragma once

#include <stdint.h>

typedef uint8_t macAddress_t[6];

typedef struct struct_pair_response
{
    uint8_t msgType;
    uint8_t success;
} struct_pair_response;

enum MessageType
{
    PAIR_REQUEST = 0X10,
    FLOWMETER_DATA_REQUEST,
    SET_REFRESH_RATE,
    SET_DEBOUNCE,
    SET_MIN_PULSES_PER_PACKET,
    SET_MAX_NUMBER_OF_PACKETS
};

enum moduleType
{
    MAIN_MODULE = 0x10,
    SECONDARY_MODULE,
};

enum ModuleMode
{
    MODULE_MODE_RUNNING,
    MODULE_MODE_PAIRING
};

typedef struct flowmeters_data
{
    uint8_t flowmeterCount;
    unsigned short *flowmetersPulsesPerMinute;
    unsigned long *flowmetersLastPulseAge;
} flowmeters_data;

typedef struct secondary_module_data_request
{
    uint8_t msgType;
} secondary_module_data_request;
