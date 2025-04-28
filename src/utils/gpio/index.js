export const mask = {
  GPIO_VALUE: 0b00000001,
  GPIO_STATUS: 0b00000010,
  GPIO_EMPTY: 0b00001100,
  GPIO_MODE: 0b01110000,
  GPIO_INIT: 0b10000000,
};

export const command = {
  GPIO_COMMAND_GET: 0,
  GPIO_COMMAND_SET: 1,
  GPIO_COMMAND_GET_ALL: 2,
};

export const parseDateGPIO = array => {
  const arr = [];
  for (let i = 0; i < array.length; i += 2) {
    arr.push({ gpio: array[i], data: array[i + 1] });
  }
  return arr;
};

export const stringifyDateGPIO = object => {
  const arr = [];

  for (const key in object) {
    arr.push(object[key].gpio);
    arr.push(object[key].data);
  }
  return arr;
};

export const getBit = (byte, mask) => (byte & mask ? 1 : 0);

export const setBit = (byte, mask) => (byte |= mask);

export const clearBit = (byte, mask) => (byte &= ~mask);

export const toggleBit = (byte, mask) => (byte ^= mask);

export const getData = byte => {
  return {
    init: (byte & mask.GPIO_INIT) >> 7,
    mode: (byte & mask.GPIO_MODE) >> 4,
    empty: (byte & mask.GPIO_EMPTY) >> 2,
    status: (byte & mask.GPIO_STATUS) >> 1,
    value: (byte & mask.GPIO_VALUE) >> 0,
  };
};

export const setData = obj => {
  let data = 0;
  data = obj.value ? setBit(data, mask.GPIO_VALUE) : clearBit(data, mask.GPIO_VALUE);
  data = obj.init ? setBit(data, mask.GPIO_INIT) : clearBit(data, mask.GPIO_INIT);
  data = obj.status ? setBit(data, mask.GPIO_STATUS) : clearBit(data, mask.GPIO_STATUS);
  data = clearBit(data, mask.GPIO_MODE);
  data |= (obj.mode & 0b111) << 4;
  return data;
};

export const getKey = (byte, key) => {
  return getData(byte)?.[key];
};

// export const setData = byte => {
//   return {
//     value: getBit(byte, mask.GPIO_VALUE),
//     mode: getBit(byte, mask.GPIO_MODE),
//     init: getBit(byte, mask.GPIO_INIT),
//     status: getBit(byte, mask.GPIO_STATUS),
//   };
// };

export const getValue = data => {
  return Boolean(data | mask.GPIO_VALUE);
};

// export const getValue = () => {

// }
