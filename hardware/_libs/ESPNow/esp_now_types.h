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
    PAIR_RESPONSE
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