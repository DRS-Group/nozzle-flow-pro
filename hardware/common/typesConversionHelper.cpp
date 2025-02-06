uint8_t *integerToBytes(int value) {
  size_t size = sizeof(value);
  uint8_t *byte_array = (uint8_t *)malloc(size);
  memcpy(byte_array, &value, size);
  return byte_array;
}

uint8_t *floatToBytes(float value) {
  size_t size = sizeof(value);
  uint8_t *byte_array = (uint8_t *)malloc(size);
  memcpy(byte_array, &value, size);
  return byte_array;
}