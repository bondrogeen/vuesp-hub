<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="[{ name: t('common.service'), path: '/' }, { name: t('common.modbus') }]" class="mb-6" />

    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-dark-40 dark:text-white">{{ t('modbus.title') }}</h1>
      <p class="mt-2 text-sm text-gray-dark-25 dark:text-gray-main">{{ t('modbus.subtitle') }}</p>
    </div>

    <div class="grid grid-cols-1 gap-4">
      <CardMain :title="t('modbus.serial')" :loading="false" disabled>
        <template #header>
          <span class="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">{{ t('common.preview') }}</span>
        </template>
        <BlockSerial v-bind="settings" :list="listPort" :isConnect="isConnect" @change="onChange" @connect="onConnect" />
      </CardMain>

      <CardMain :title="t('modbus.config')" :loading="false" disabled>
        <template #header>
          <span class="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">{{ t('common.preview') }}</span>
        </template>
        <div class="grid grid-cols-1 gap-4">
          <BlockModBus :data="buffer" @send="onSend" />
        </div>
      </CardMain>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { BlockBreadcrumb as VBreadcrumb, CardMain } from 'vuesp-components/components';

import BlockModBus from '@/components/blocks/modbus/BlockModBus.vue';
import BlockSerial from '@/components/blocks/modbus/BlockSerial.vue';
import { useChromeSerial } from '@/composables/modbus/useChromeSerial.ts';
import { useServerSerial } from '@/composables/modbus/useServerSerial.ts';
import { debounce } from '@/utils/helpers.ts';
import type { SerialChangePayload, SerialConfig, SerialStatusPayload } from '@/types';

const { t } = useI18n();

const buffer = ref<number[]>([]);
const isConnect = ref(false);
const settings = ref<SerialConfig>({
  path: '',
  baudRate: 9600,
  bufferSize: 255,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
});

const isChrome = computed(() => settings.value.path === 'chrome');

const onLoad = debounce((data: number[]): void => {
  buffer.value = data;
}, 100);

const updateData = (value: Uint8Array | number[]): void => {
  buffer.value.push(...Array.from(value));
  onLoad(buffer.value);
};

const onChange = ({ name, value }: SerialChangePayload): void => {
  settings.value = { ...settings.value, [name]: value } as SerialConfig;
};

const onStatus = ({ status, options }: SerialStatusPayload): void => {
  isConnect.value = status;
  settings.value = options;
};

const { connectChrome, disconnectChrome, onWriteChrome } = useChromeSerial(updateData);

const { listPort, init, connectServer, disconnectServer, onWriteServer } = useServerSerial(updateData, onStatus);

const onConnect = async (options: SerialConfig): Promise<void> => {
  if (isConnect.value) {
    if (isChrome.value) await disconnectChrome();
    else disconnectServer();
  } else {
    if (isChrome.value) await connectChrome(options);
    else connectServer(options);
  }
  isConnect.value = !isConnect.value;
};

const onSend = (data: number[]): void => {
  if (isChrome.value) onWriteChrome(data);
  else onWriteServer(data);
  buffer.value = [];
};

onMounted(() => {
  init();
});
</script>
