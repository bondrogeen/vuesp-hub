<template>
  <div class="grid gap-4">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[100px_300px_100px_100px] gap-4">
      <VTextField v-model="v.slaveID.value" label="Slave ID" :message="getError('slaveID')" @blur="v.slaveID.blur" />

      <VSelect :value="code.name" class="" label="Function Code" :list="functionList" @change="onFunction"></VSelect>

      <VTextField v-model="v.address.value" label="Address" :message="getError('address')" @blur="v.address.blur" />

      <VTextField v-model="v.length.value" label="Length" :message="getError('length')" />
    </div>

    <div>
      <h5 class="mb-2">Request</h5>

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
          <v-button class="w-[100px]" block :disabled="invalid" @click="onSend">Send</v-button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1">
      <h5 class="mb-2">Response</h5>

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

    <!-- <VTextField class="col-span-3" hideMessage /> -->
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed, watch, onMounted } from 'vue';
import { required, maxNumber, minNumber } from '@/utils/validate.ts';
import { useForm } from '@/composables/useForm.ts';
import { CRC, getInt16Bytes, functionList, intToHex, getBytesInt16 } from './modbus.js';

const props = defineProps({
  data: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['send']);

const slaveID = ref(1);
const address = ref(0);
const length = ref(1);
const code = ref({ ...functionList[3] });

const data = ref(1);

const packAddress = computed(() => getInt16Bytes(address.value));
const packLength = computed(() => getInt16Bytes(length.value));

const pack = computed(() => [+slaveID.value, code.value.value, ...packAddress.value, ...packLength.value]);
const dataPack = computed(() => [...pack.value, ...getInt16Bytes(CRC(pack.value), true)]);

const form = { slaveID, address, length };

const validators = {
  slaveID: { required, min: minNumber(0), max: maxNumber(255) },
  address: { required, min: minNumber(0), max: maxNumber(65535) },
  length: { required, min: minNumber(1), max: maxNumber(255) },
};

const { v, invalid, getError } = useForm(validators, form);

watch(
  () => props.data,
  (value) => {
    data.value = value;
  }
);

const getData = computed(() => props?.data?.data || []);
const getSize = computed(() => props?.data?.size || []);

const onSend = () => emit('send', dataPack.value);
const getDataByte = (i) => data?.value?.data?.[i] || 0;

const onFunction = (item) => {
  code.value = item;
};
</script>
