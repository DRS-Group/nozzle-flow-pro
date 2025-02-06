void sendBytes(unsigned short id, uint8_t *byte_array, size_t size)
{
  CAN.beginPacket(id);
  CAN.write(byte_array, size);
  if (CAN.endPacket() == 0)
  {
    throw "Error while sending CAN message.";
  }
}

void sendInteger(int id, int value)
{
  uint8_t *byte_array = integerToBytes(value);
  sendBytes(id, byte_array, sizeof(float));
}

void sendFloat(int id, float value)
{
  uint8_t *byte_array = floatToBytes(value);
  sendBytes(id, byte_array, sizeof(float));
}
