<template>
  <div class="grid gap-4">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[100px_300px_100px_100px] gap-4">
      <VTextField v-model="slaveID" v-bind="slaveIDAttrs" :label="t('modbus.slaveId')" />

      <VSelect :model-value="codeLabel" class="" :label="t('modbus.functionCode')" :items="functionOptions" @change="onFunction" />

      <VTextField v-model="address" v-bind="addressAttrs" :label="t('modbus.address')" />

      <VTextField v-model="length" v-bind="lengthAttrs" :label="t('modbus.length')" />
    </div>

    <div>
      <h5 class="mb-2">{{ t('modbus.request') }}</h5>

      <div class="flex gap-4 items-center">
        <div class="flex flex-wrap">
          <div
            v-for="(item, i) of dataPack"
            :key="i"
            class="flex-[0_0_30px] flex justify-center items-center border-r border-t border-b border-gray-600 h-8 w-full uppercase"
            :class="{ 'border-l': !i }"
          >
            {{ intToHex(item) }}
          </div>
        </div>

        <div class="self-start">
          <VButton color="blue" class="w-[100px]" block :disabled="!isValid" @click="onSend">{{ t('common.send') }}</VButton>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1">
      <h5 class="mb-2">{{ t('modbus.response') }}</h5>

      <div class="flex flex-wrap">
        <div
          v-for="(item, i) of getSize"
          :key="item"
          class="flex-[0_0_30px] flex justify-center items-center border-r border-t border-b border-gray-600 h-8 w-full uppercase"
          :class="{ 'border-l': !i }"
        >
          {{ intToHex(getDataByte(i)) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { VButton, VSelect, VTextField } from 'vuesp-components/components';
import { useForm } from 'vuesp-components/composables';

import { CRC, getInt16Bytes, functionList, intToHex, type ModbusFunction } from './modbus.ts';
import type { BlockModBusEmits, BlockModBusProps } from './BlockModBus.types.ts';

const { data = [] } = defineProps<BlockModBusProps>();
const emit = defineEmits<BlockModBusEmits>();
const { t } = useI18n();

const code = ref<ModbusFunction>({ ...functionList[3] });
const functionOptions = computed(() => functionList.map(item => ({
  ...item,
  name: t(`modbus.functions.${item.key}`),
})));
const codeLabel = computed(() => t(`modbus.functions.${code.value.key}`));

const range = (min: number, max: number) => (value: unknown) => {
  if (value === '' || value === null || value === undefined) return t('modbus.required');
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return t('modbus.mustBeNumber');
  if (numeric < min || numeric > max) return t('modbus.range', { min, max });
  return true;
};

const validationSchema = {
  slaveID: [range(0, 255)],
  address: [range(0, 65535)],
  length: [range(1, 255)],
};

const { defineField, isValid, validate } = useForm({
  validationSchema,
  initialValues: { slaveID: 1, address: 0, length: 1 },
});
const [slaveID, slaveIDAttrs] = defineField<number | string>('slaveID');
const [address, addressAttrs] = defineField<number | string>('address');
const [length, lengthAttrs] = defineField<number | string>('length');

validate();

const packAddress = computed(() => getInt16Bytes(Number(address.value)));
const packLength = computed(() => getInt16Bytes(Number(length.value)));

const pack = computed(() => [Number(slaveID.value), code.value.value, ...packAddress.value, ...packLength.value]);
const dataPack = computed(() => [...pack.value, ...getInt16Bytes(CRC(pack.value), true)]);

const getSize = computed(() => data.length);

const onSend = () => {
  emit('send', dataPack.value);
};
const getDataByte = (i: number) => data[i] || 0;

const onFunction = (item: ModbusFunction): void => {
  code.value = item;
};
</script>
