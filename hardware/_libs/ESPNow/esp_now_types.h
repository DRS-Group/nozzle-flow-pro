#pragma once

#include <stdint.h>

typedef uint8_t macAddress_t[6];

typedef struct struct_pair_request
{
    uint8_t msgType;
} struct_pair_request;

typedef struct struct_pair_response
{
    uint8_t msgType;
    uint8_t success;
} struct_pair_response;

enum MessageType
{
    PAIR_REQUEST = 0X10,
    PAIR_RESPONSE,
    FLOWMETER_DATA_REQUEST,
    FLOWMETER_DATA_RESPONSE
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

typedef unsigned short flowmeter_data_t;

typedef struct flowmeters_data
{
    uint8_t flowmeterCount;
    flowmeter_data_t *flowmetersPulsesPerMinute;
} flowmeters_data;

typedef struct secondary_module_data_request
{
    uint8_t msgType;
} secondary_module_data_request;
