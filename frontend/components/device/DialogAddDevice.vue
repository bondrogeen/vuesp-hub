<template>
  <div class="pt-4">
    <form class="flex flex-col" action="#" @submit.prevent="">
      <VTextField v-model="name" v-bind="nameAttrs" :label="t('devices.form.name')" />

      <VTextField v-model="ip" v-bind="ipAttrs" :label="t('devices.form.ip')" />

      <VTextField v-model="username" v-bind="usernameAttrs" :label="t('devices.form.login')" />

      <VTextField v-model="password" v-bind="passwordAttrs" :label="t('devices.form.password')" />

      <VTextField v-model="deviceId" :label="t('devices.form.deviceId')" disabled />

      <VButton color="blue" :disabled="!isValid" @click="onAdd">{{ t('devices.form.add') }}</VButton>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { VButton, VTextField } from 'vuesp-components/components';
import { useForm } from 'vuesp-components/composables';
import { required } from 'vuesp-components/validate';

import type { DeviceFormInput } from '@/types';
import type { DialogAddDeviceEmits, DialogAddDeviceProps } from './DialogAddDevice.types.ts';

const { device = {} } = defineProps<DialogAddDeviceProps>();

const emit = defineEmits<DialogAddDeviceEmits>();
const { t } = useI18n();

const initialValues: Record<string, unknown> = { id: 0, name: '', username: 'admin', password: 'admin', ip: '', deviceId: 0 };
Object.assign(initialValues, device);

const validationSchema = {
  name: [required],
  ip: [required],
  username: [],
  password: [],
  deviceId: [],
};

const { values, defineField, isValid, validate } = useForm({ validationSchema, initialValues });
const [name, nameAttrs] = defineField<string>('name');
const [ip, ipAttrs] = defineField<string>('ip');
const [username, usernameAttrs] = defineField<string>('username');
const [password, passwordAttrs] = defineField<string>('password');
const [deviceId] = defineField<string | number>('deviceId');

validate();

const onAdd = () => {
  emit('add', { ...values } as unknown as DeviceFormInput);
};
</script>
