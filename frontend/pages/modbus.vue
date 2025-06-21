<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="[{ name: 'Home', path: '/' }, { name: 'List' }]" class="mb-6" />

    <VCardGray title="Setting">
      <div class="grid grid-cols-4 gap-4">
        <v-select :value="modbus.port" label="Port" :list="listBaudRate" @change="onBaudRate"></v-select>
        <v-select :value="modbus.baudRate" label="Baud rate" :list="listBaudRate" @change="onBaudRate"></v-select>
        <v-select :value="modbus.parity" label="Parity" :list="listParity" @change="onParity"></v-select>
        <v-select :value="modbus.stopBits" label="Stop bits" :list="listStopBits" @change="onStopBits"></v-select>
        <v-button block @click="onConnect">Connect</v-button>
      </div>
    </VCardGray>

    <div class="mt-4">
      <VCardGray title="Master">
        <h5 class="mb-6"></h5>
        <div class="grid grid-cols-1 gap-4">
          <BlockModBus :data="modbus" @send="onSendModBus" />
        </div>
      </VCardGray>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { debounce } from '@/utils/helpers.ts';

import BlockModBus from '@/components/blocks/modbus/BlockModBus.vue';

const listBaudRate = [
  { name: '1200', value: 1200 },
  { name: '9600', value: 9600 },
  { name: '14400', value: 14400 },
  { name: '19220', value: 19220 },
  { name: '28800', value: 28800 },
  { name: '38400', value: 38400 },
  { name: '57600', value: 57600 },
  { name: '115200', value: 115200 },
];
const listParity = [
  { name: 'None', value: 'None' },
  { name: 'Event', value: 'Event' },
  { name: 'Odd', value: 'Odd' },
];
const listStopBits = [
  { name: '1', value: 1 },
  { name: '2', value: 2 },
];

const modbus = ref({
  port: 1,
  baudRate: 9600,
  parity: 'None',
  stopBits: 2,
});

const onBaudRate = (item) => (modbus.value.baudRate = item.value);
const onParity = (item) => (modbus.value.parity = item.value);
const onStopBits = (item) => (modbus.value.stopBits = item.value);

let port;
let reader;
let writer;

const connect = async () => {
  try {
    port = await navigator.serial.requestPort();

    const { usbProductId, usbVendorId } = port.getInfo();
    console.log(usbProductId, usbVendorId);

    await port.open({
      baudRate: 9600,
      bufferSize: 255,
      dataBits: 8,
      flowControl: 'none', // 'hardware'
      parity: 'none', // 'even', 'odd'
      stopBits: 1, // 2,
    });

    setInterval(() => {
      send();
    }, 5000);

    readData();

    log('Успешно подключено!');
  } catch (error) {
    log(`Ошибка подключения: ${error}`);
  }
};

let buffer = [];
const onLoad = debounce(() => {
  console.log(buffer);
}, 300);

const addBuffer = (value) => {
  const regularArray = Array.from(value);
  buffer.push(...regularArray);
  onLoad();
};

const readData = async () => {
  try {
    const decoder = new TextDecoder();
    reader = port.readable.getReader();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      addBuffer(value);
    }
  } catch (error) {
    log(`Ошибка чтения: ${error}`);
  } finally {
    reader?.releaseLock();
  }
};

const send = async () => {
  try {
    if (!writer) writer = port.writable.getWriter();

    const data = new Uint8Array([1, 4, 0, 0, 0, 1, 49, 202]);
    await writer.write(data);

    buffer = [];
  } catch (error) {
    log(`Ошибка отправки: ${error}`);
  }
};

// 3. Чтение данных

const disconnect = async () => {
  try {
    await reader?.cancel();
    await writer?.close();
    await port?.close();
    log('Отключено');
  } catch (error) {
    log(`Ошибка отключения: ${error}`);
  }
};

const log = (message) => {
  console.log(message);
};
const onConnect = async (message) => {
  await connect();
};
</script>
