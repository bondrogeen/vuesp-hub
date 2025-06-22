<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-x-4">
    <v-select :value="path" :disabled="isConnect" label="Port" :list="list" @change="onPort"></v-select>

    <v-select :value="baudRate" :disabled="isConnect" label="Baud rate" :list="listBaudRate" @change="onBaudRate"></v-select>

    <v-select :value="parity" :disabled="isConnect" label="Parity" :list="listParity" @change="onParity"></v-select>

    <v-select :value="stopBits" :disabled="isConnect" label="Stop bits" :list="listStopBits" @change="onStopBits"></v-select>

    <v-button block :disabled="!path" @click="onConnect">{{ !isConnect ? 'Connect' : 'Disconnect' }}</v-button>
  </div>
</template>

<script setup lang="ts">
import type { TypeSerialOption } from '@/components/blocks/modbus/types.ts';

import { computed } from 'vue';

interface Props {
  path?: string;
  baudRate?: number;
  bufferSize?: number;
  dataBits?: number;
  parity?: string;
  stopBits?: number;

  list?: any[];
  isConnect: boolean;
}
interface TypeList {
  name: string;
  value: string | number;
}

const { path = '', baudRate = 9600, bufferSize = 255, dataBits = 8, parity = 'none', stopBits = 1, list = [], isConnect = false } = defineProps<Props>();

const emit = defineEmits<{
  (e: 'connect', value: TypeSerialOption): void;
  (e: 'change', value: { name: string; value: number | string }): void;
}>();

const listBaudRate: TypeList[] = [
  { name: '1200', value: 1200 },
  { name: '9600', value: 9600 },
  { name: '14400', value: 14400 },
  { name: '19220', value: 19220 },
  { name: '28800', value: 28800 },
  { name: '38400', value: 38400 },
  { name: '57600', value: 57600 },
  { name: '115200', value: 115200 },
];

const listParity: TypeList[] = [
  { name: 'None', value: 'none' },
  { name: 'Event', value: 'event' },
  { name: 'Odd', value: 'odd' },
];

const listStopBits: TypeList[] = [
  { name: '1', value: 1 },
  { name: '2', value: 2 },
];

const onChange = (data) => emit('change', data);

const onPort = ({ value }: TypeList) => onChange({ name: 'path', value });
const onBaudRate = ({ value }: TypeList) => onChange({ name: 'baudRate', value });
const onParity = ({ value }: TypeList) => onChange({ name: 'parity', value });
const onStopBits = ({ value }: TypeList) => onChange({ name: 'stopBits', value });

const onConnect = () => emit('connect', { path, baudRate, bufferSize, dataBits, parity, stopBits });
</script>
