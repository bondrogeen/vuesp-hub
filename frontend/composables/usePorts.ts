import type { Ref } from 'vue';
import { ref } from 'vue';
import { getBinary, onUploadBinary } from '@/utils/fs';

import { command, getKey, getData, setData, parseDateGPIO, stringifyDateGPIO } from '@/utils/gpio/index.ts';

import { pathGPIO } from '@/utils/const.ts';

export const usePorts = (onSend: (data: any) => void) => {
  interface TypePort {
    gpio: number;
    data: number;
  }

  interface TypeMode {
    name: string;
    value: number;
  }

  const ports: Ref<TypePort[]> = ref([]);
  const portsDef = ref([]);

  const listMode: TypeMode[] = [
    { name: 'OFF', value: 0 },
    { name: 'INPUT', value: 8 }, // 0x00
    { name: 'OUTPUT', value: 9 }, // 0x01
    { name: 'INPUT_PULLUP', value: 10 }, // 0x02
    { name: 'OUTPUT_OPEN_DRAIN', value: 11 }, // 0x03
    // { name: 'INPUT_PULLDOWN_16', value: 12 }, // 0x04
    // { name: 'WAKEUP_PULLUP', value: 13 }, // 0x05
    // { name: 'WAKEUP_PULLDOWN', value: 15 }, // 0x07
  ];

  const onMode = (port: TypePort, item: TypeMode) => {
    const obj = getData(port.data) || {};
    const value = item?.value || 0;
    obj.init = value & 0b00001111 ? 1 : 0;
    obj.mode = value & 0b00000111;
    port.data = setData(obj);
  };

  const getMode = ({ data }: TypePort): TypeMode | undefined => {
    const mode = getKey(data, 'mode');
    const init = getKey(data, 'init');
    const value = init * 8 + mode;
    return listMode.find((i) => i.value === value);
  };

  const getModeName = (pin: TypePort) => getMode(pin)?.name || '';

  const getValue = ({ data }: TypePort) => Boolean(getKey(data, 'value'));

  const getStateValue = (gpio: any, pin: TypePort) => getValue(gpio?.[pin.gpio] || {});

  const isDisabled = (pin: TypePort) => Boolean(![9, 11].includes(getMode(pin)?.value || 0));

  const onSetPort = (port: TypePort, value: boolean) => {
    const obj = getData(port.data);
    obj.value = value;
    port.data = setData(obj);
    onSend({ comm: 'PORT', data: { gpio: port.gpio, command: command.GPIO_COMMAND_SET, data: port.data } });
  };

  const onGetPort = () => {
    onSend({ comm: 'PORT', data: { command: command.GPIO_COMMAND_GET_ALL } });
  };

  const onLoadDataGpio = async () => {
    const array = await getBinary(pathGPIO);
    return parseDateGPIO(array);
  };

  const init = async () => {
    ports.value = await onLoadDataGpio();
    portsDef.value = JSON.parse(JSON.stringify(ports.value));
    onGetPort();
  };

  return { ports, portsDef, listMode, init, isDisabled, getModeName, getStateValue, onSetPort, onMode, onUploadBinary, stringifyDateGPIO };
};
