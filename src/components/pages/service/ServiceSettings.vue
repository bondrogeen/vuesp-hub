<template>
  <div>
    <VExpansion label="Wi-Fi" value>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <VSelect :value="getMode" label="Mode" :list="listWiFi" @change="onSureOffWifi"></VSelect>

        <VTextField v-model="v.wifiSsid.value" label="SSID" :disabled="isWifi" :append-button="!isWifi" :message="getError('wifiSsid')" @blur="v.wifiSsid.blur" @on-icon="onScan(false)">
          <template #icon>
            <IconSearch></IconSearch>
          </template>
        </VTextField>

        <VTextField
          id="wifiPass"
          v-model="v.wifiPass.value"
          label="Password"
          :disabled="isWifi"
          :type="showPass ? 'text' : 'password'"
          :message="getError('wifiPass')"
          @blur="v.wifiPass.blur"
          @on-icon="showPass = !showPass"
        >
          <template #icon>
            <IconEyeOpen v-if="showPass"></IconEyeOpen>
            
            <IconEyeClose v-else></IconEyeClose>
          </template>
        </VTextField>

        <VTextField
          v-model="v.rePassword.value"
          label="Repeat password"
          :disabled="isWifi"
          :message="getError('rePassword')"
          :type="showPass ? 'text' : 'password'"
          @blur="v.rePassword.blur"
          @on-icon="showPass = !showPass"
        >
          <template #icon>
            <IconEyeOpen v-if="showPass"></IconEyeOpen>

            <IconEyeClose v-else></IconEyeClose>
          </template>
        </VTextField>

        <div class="col-span-full mt-4">
          <VCheckbox v-model="settings.wifiDhcp">DHCP</VCheckbox>
        </div>

        <VTextField v-model="v.wifiIp.value" label="IP" :message="getError('wifiIp')" :disabled="isWifiDHCP" @blur="v.wifiIp.blur" />

        <VTextField v-model="v.wifiSubnet.value" label="Subnet" :message="getError('wifiSubnet')" :disabled="isWifiDHCP" @blur="v.wifiSubnet.blur" />

        <VTextField v-model="v.wifiGateway.value" label="Geteway" :message="getError('wifiGateway')" :disabled="isWifiDHCP" @blur="v.wifiGateway.blur" />

        <VTextField v-model="v.wifiDns.value" label="DNS" :message="getError('wifiDns')" :disabled="isWifiDHCP" @blur="v.wifiDns.blur" />
      </div>
    </VExpansion>

    <VExpansion label="Security" value>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="col-span-full">
          <VCheckbox v-model="settings.authMode">AUTHENTICATION</VCheckbox>
        </div>

        <VTextField v-model="v.authLogin.value" label="Login" :disabled="isAuth" />

        <VTextField
          v-model="v.authPass.value"
          class="col-end-2"
          label="Password"
          :type="showAuthPass ? 'text' : 'password'"
          :disabled="isAuth"
          :message="getError('authPass')"
          @blur="v.authPass.blur"
          @on-icon="showAuthPass = !showAuthPass"
        >
          <template #icon>
            <IconEyeOpen v-if="showAuthPass"></IconEyeOpen>

            <IconEyeClose v-else></IconEyeClose>
          </template>
        </VTextField>

        <VTextField
          v-model="v.reAuthPassword.value"
          label="Password"
          :type="showAuthPass ? 'text' : 'password'"
          :disabled="isAuth"
          :message="getError('reAuthPassword')"
          @blur="v.reAuthPassword.blur"
          @on-icon="showAuthPass = !showAuthPass"
        >
          <template #icon>
            <IconEyeOpen v-if="showAuthPass"></IconEyeOpen>

            <IconEyeClose v-else></IconEyeClose>
          </template>
        </VTextField>
      </div>
    </VExpansion>

    <div class="mt-6">
      <v-button :disabled="invalid" @click="onSave">Save</v-button>
    </div>

    <AppDialog title="SCAN" size="sm" :value="showDialog" @close="onClose">
      <div>
        <VList v-slot="{ item }" :list="scanList">
          <div class="flex items-center w-full" @click="onSelectSsid(item)">
            <div class="mr-2">
              <WifiIcon v-bind="item" />
            </div>

            <div>
              <div class="text-title1">{{ item.ssid }}</div>

              <div class="text-gray-400 text-body">Security: {{ listEncryption[item.encryptionType] || 'unknown' }}</div>
            </div>
          </div>
        </VList>

        <div v-if="!scanList.length" class="flex justify-center">
          <VLoader class="text-primary"></VLoader>
        </div>
      </div>

      <template #footer>
        <v-button @click="onScan(true)">Scan</v-button>
      </template>
    </AppDialog>
  </div>
</template>

<script setup>
import { computed, ref, defineProps, defineEmits, inject, onMounted } from 'vue';
import { rules } from '@/utils/validate/';

import { useForm } from '@/utils/useForm';

import AppDialog from '@/components/app/AppDialog';
import WifiIcon from '@/components/general/WifiIcon';
import VTextField from '@/components/general/VTextField';
import VExpansion from '@/components/general/VExpansion';
import VCheckbox from '@/components/general/VCheckbox';
import VSelect from '@/components/general/VSelect';
import VLoader from '@/components/general/VLoader';
import VList from '@/components/general/VList';

import IconSearch from '@/components/icons/IconSearch';
import IconEyeOpen from '@/components/icons/IconEyeOpen';
import IconEyeClose from '@/components/icons/IconEyeClose';

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  scanList: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue', 'scan', 'save']);

const dialog = inject('dialog');

const showPass = ref(false);
const showAuthPass = ref(false);
const showDialog = ref(false);

const settings = computed({
  set: value => emit('update:modelValue', value),
  get: () => props.modelValue,
});

const wifiIp = computed({
  set: value => (settings.value.wifiIp = value.split('.').map(i => +i)),
  get: () => (settings?.value?.wifiIp || []).join('.'),
});
const wifiSubnet = computed({
  set: value => value.split('.'),
  get: () => (settings?.value?.wifiSubnet || []).join('.'),
});
const wifiGateway = computed({
  set: value => value.split('.'),
  get: () => (settings?.value?.wifiGateway || []).join('.'),
});
const wifiDns = computed({
  set: value => value.split('.'),
  get: () => (settings?.value?.wifiDns || []).join('.'),
});
const wifiSsid = computed({
  set: value => (settings.value.wifiSsid = value),
  get: () => settings?.value?.wifiSsid,
});
const wifiPass = computed({
  set: value => (settings.value.wifiPass = value),
  get: () => settings?.value?.wifiPass,
});
const authLogin = computed({
  set: value => (settings.value.authLogin = value),
  get: () => settings?.value?.authLogin,
});
const authPass = computed({
  set: value => (settings.value.authPass = value),
  get: () => settings?.value?.authPass,
});

const rePassword = ref(settings.value.wifiPass);
const reAuthPassword = ref(settings.value.authPass);

const { required, max, min, sameAs, ip, max12 } = rules;

const form = {
  wifiSsid,
  wifiPass,
  rePassword,

  wifiIp,
  wifiSubnet,
  wifiGateway,
  wifiDns,

  authLogin,
  authPass,
  reAuthPassword,
};

const validators = {
  wifiSsid: { required, max },
  wifiPass: {
    required,
    max,
    min,
    sameAs: value => sameAs(value, rePassword.value),
  },
  rePassword: {
    required,
    max,
    min,
    sameAs: value => sameAs(value, wifiPass.value),
  },

  wifiIp: { ip },
  wifiSubnet: { ip },
  wifiGateway: { ip },
  wifiDns: { ip },

  authLogin: { required, max12 },
  authPass: { required, max12, sameAs: value => sameAs(value, reAuthPassword.value) },
  reAuthPassword: { required, max12, sameAs: value => sameAs(value, authPass.value) },
};

const { v, invalid, getError } = useForm(validators, form);

const listWiFi = [
  { name: 'OFF', value: 0 },
  { name: 'STA', value: 1 },
  { name: 'AP', value: 2 },
  // { name: 'STA + AP', value: 3 },
];

const getMode = computed(() => listWiFi.find(i => i.value === settings.value.wifiMode)?.name || '');
const isWifiDHCP = computed(() => Boolean(settings.value.wifiDhcp || !settings.value.wifiMode));
const isWifi = computed(() => Boolean(!settings.value.wifiMode));
const isAuth = computed(() => Boolean(!settings.value.authMode));

const onSave = () => emit('save', settings.value);

const listEncryption = ['OPEN', 'WEP', 'WPA_PSK', 'WPA2_PSK', 'WPA_WPA2_PSK', 'MAX', '', 'NO', 'AUTO'];

const onSelectSsid = ({ ssid }) => {
  settings.value.wifiMode = 1;
  settings.value.wifiSsid = ssid;
  const input = document.querySelector('#wifiPass input');
  input.select();
  input.focus();
  onClose();
};

const onClose = () => {
  showDialog.value = false;
};

const onScan = value => {
  showDialog.value = true;
  emit('scan', value);
};

const onChange = value => (settings.value.wifiMode = value);
const onSureOffWifi = ({ value }) => (!value ? dialog({ value: true, message: 'You are about to disable Wi-Fi. Are you sure?', callback: onChange.bind(this, value) }) : onChange(value));

onMounted(() => {
  rePassword.value = settings.value.wifiPass;
});
</script>
