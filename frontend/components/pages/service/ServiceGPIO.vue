<template>
  <div class="relative p-4 flex flex-col gap-4">
    <div v-for="pin in ports" :key="pin.gpio">
      <div v-if="pin" class="flex justify-between">
        <VSelect class="max-w-[250px]" :value="getModeName(pin)" :label="`GPIO: ${pin.gpio}`" :list="listMode" @change="onMode(pin, $event)" />

        <v-button class="ml-2" :disabled="isDisabled(pin)" @click="onSetPort(pin, !getStateValue(pin))">{{ getStateValue(pin) ? 'ON' : 'OFF' }}</v-button>
      </div>
    </div>

    <div class="mt-6">
      <div class="flex j-end">
        <v-button class="mr-4" @click="onGetPort">Update</v-button>
        
        <v-button :disabled="!isDifferent" @click="onSave">Save</v-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, onMounted, ref, computed } from 'vue';
import { getBinary, onUploadBinary } from '@/utils/fs/';
import { command, getKey, getData, setData, parseDateGPIO, stringifyDateGPIO } from '@/utils/gpio/';
import { pathGPIO } from '@/utils/const';

import VSelect from '@/components/general/VSelect';

const props = defineProps({
  gpio: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['click', 'send', 'reboot']);

const ports = ref([]);
const portsDef = ref([]);

const isDifferent = computed(() => {
  for (let i = 0; i < ports.value.length; i++) {
    if (getMode(ports.value[i])?.value !== getMode(portsDef.value[i])?.value) return 1;
  }
  return 0;
});

const listMode = [
  { name: 'OFF', value: 0 },
  { name: 'INPUT', value: 8 }, // 0x00
  { name: 'OUTPUT', value: 9 }, // 0x01
  { name: 'INPUT_PULLUP', value: 10 }, // 0x02
  { name: 'OUTPUT_OPEN_DRAIN', value: 11 }, // 0x03
  // { name: 'INPUT_PULLDOWN_16', value: 12 }, // 0x04
  // { name: 'WAKEUP_PULLUP', value: 13 }, // 0x05
  // { name: 'WAKEUP_PULLDOWN', value: 15 }, // 0x07
];

const onMode = (port, item) => {
  const obj = getData(port.data);
  const value = item.value;
  obj.init = value & 0b00001111 ? 1 : 0;
  obj.mode = value & 0b00000111;
  port.data = setData(obj);
};

const getMode = ({ data }) => {
  const mode = getKey(data, 'mode');
  const init = getKey(data, 'init');
  const value = init * 8 + mode;
  return listMode.find(i => i.value === value) || {};
};

const getModeName = pin => getMode(pin).name;

const getValue = ({ data }) => Boolean(getKey(data, 'value'));

const getStateValue = ({ gpio }) => getValue(props?.gpio?.[gpio] || {});

const isDisabled = pin => Boolean(![9, 11].includes(getMode(pin).value));

const onSetPort = (port, value) => {
  const obj = getData(port.data);
  obj.value = value;
  port.data = setData(obj);

  emit('send', { comm: 'PORT', data: { gpio: port.gpio, command: command.GPIO_COMMAND_SET, data: port.data } });
};

const onGetPort = () => {
  emit('send', { comm: 'PORT', data: { command: command.GPIO_COMMAND_GET_ALL } });
};

const onLoadDataGpio = async () => {
  const array = await getBinary(pathGPIO);
  return parseDateGPIO(array);
};

const onSave = async () => {
  const data = stringifyDateGPIO(ports.value);
  const buffer = new Uint8Array(data).buffer;
  await onUploadBinary(pathGPIO, buffer);
  portsDef.value = JSON.parse(JSON.stringify(ports.value));
  emit('reboot');
};

onMounted(async () => {
  ports.value = await onLoadDataGpio();
  portsDef.value = JSON.parse(JSON.stringify(ports.value));
  onGetPort();
});
</script>
