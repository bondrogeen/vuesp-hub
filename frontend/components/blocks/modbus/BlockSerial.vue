<template>
  <div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
    <VSelect :model-value="path" :disabled="isConnect" :label="t('modbus.port')" :items="list" @change="onPort" />

    <VSelect :model-value="baudRate" :disabled="isConnect" :label="t('modbus.baudRate')" :items="listBaudRate" @change="onBaudRate" />

    <VSelect :model-value="parity" :disabled="isConnect" :label="t('modbus.parity')" :items="listParity" @change="onParity" />

    <VSelect :model-value="stopBits" :disabled="isConnect" :label="t('modbus.stopBits')" :items="listStopBits" @change="onStopBits" />

    <VButton color="blue" block :disabled="!path" @click="onConnect">{{ isConnect ? t('common.disconnect') : t('common.connect') }}</VButton>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { VButton, VSelect } from 'vuesp-components/components';

import type { ISerialChangePayload, ISerialConfig, TSerialSelectOption } from '@/types';
import type { IBlockSerialEmits, IBlockSerialProps } from './BlockSerial.types.ts';

const {
  path = '',
  baudRate = 9600,
  bufferSize = 255,
  dataBits = 8,
  parity = 'none',
  stopBits = 1,
  list = [],
  isConnect = false,
} = defineProps<IBlockSerialProps>();

const emit = defineEmits<IBlockSerialEmits>();
const { t } = useI18n();

const listBaudRate: TSerialSelectOption[] = [
  { name: '1200', value: 1200 },
  { name: '9600', value: 9600 },
  { name: '14400', value: 14400 },
  { name: '19220', value: 19220 },
  { name: '28800', value: 28800 },
  { name: '38400', value: 38400 },
  { name: '57600', value: 57600 },
  { name: '115200', value: 115200 },
];

const listParity = computed<TSerialSelectOption[]>(() => [
  { name: t('modbus.parityNone'), value: 'none' },
  { name: t('modbus.parityEven'), value: 'even' },
  { name: t('modbus.parityOdd'), value: 'odd' },
]);

const listStopBits: TSerialSelectOption[] = [
  { name: '1', value: 1 },
  { name: '2', value: 2 },
];

const onChange = (data: ISerialChangePayload): void => emit('change', data);

const onPort = ({ value }: TSerialSelectOption): void => onChange({ name: 'path', value: String(value) });
const onBaudRate = ({ value }: TSerialSelectOption): void => onChange({ name: 'baudRate', value: Number(value) });
const onParity = ({ value }: TSerialSelectOption): void => onChange({ name: 'parity', value: String(value) });
const onStopBits = ({ value }: TSerialSelectOption): void => onChange({ name: 'stopBits', value: Number(value) });

const onConnect = (): void => {
  const options: ISerialConfig = { path, baudRate, bufferSize, dataBits, parity, stopBits };
  emit('connect', options);
};
</script>
