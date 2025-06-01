<template>
  <div class="pt-4">
    <form class="flex flex-col" action="#" @submit.prevent="">
      <VTextField v-model="v.name.value" label="Name" :message="getError('name')" @blur="v.name.blur" />

      <VTextField v-model="v.ip.value" label="IP" :message="getError('ip')" @blur="v.ip.blur" />

      <VTextField v-model="v.username.value" label="Login" :message="getError('username')" @blur="v.username.blur" />

      <VTextField v-model="v.password.value" label="Password" :message="getError('password')" @blur="v.password.blur" />

      <VTextField v-model="v.deviceId.value" label="DeviceId" disabled />

      <VButton color="blue" :disabled="invalid" @click="onAdd">Add</VButton>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits, defineProps } from 'vue';

import { useForm } from '@/composables/useForm.js';

import { rules } from '@/utils/validate/index.js';

interface TypeDevice {
  id: number;
  name: string;
  username: string;
  password: string;
  ip: string;
  deviceId: number;
}

interface Props {
  device?: TypeDevice;
}

const { device = {} } = defineProps<Props>();

const emit = defineEmits<{
  (e: 'add', value: TypeDevice): void;
}>();

const { required } = rules;

const isLoading = ref(false);

const form: TypeDevice = { id: 0, name: '', username: 'admin', password: 'admin', ip: '', deviceId: 0 };

const validators = { name: { required }, ip: { required }, username: {}, password: {}, deviceId: 0 };

if (Object.keys(device).length) {
  for (const key in form) {
    if (device?.[key]) {
      form[key] = device[key];
    }
  }
}

const { v, invalid, getError, data } = useForm(validators, form);

const onAdd = () => {
  emit('add', data.value);
};
</script>
