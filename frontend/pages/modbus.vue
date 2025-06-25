<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="[{ name: 'Service', path: '/' }, { name: 'Modbus' }]" class="mb-6" />

    <div class="grid grid-cols-1 gap-4">
      <VCardGray title="Serial" disabled>
        <BlockSerial v-bind="settings" :list="listPort" :isConnect="isConnect" @change="onChange" @connect="onConnect" />
      </VCardGray>

      {{ buffer }}
      <VCardGray title="Config" disabled>
        <div class="grid grid-cols-1 gap-4">
          <BlockModBus :data="buffer" @send="onSend" />
        </div>
      </VCardGray>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { Ref } from 'vue';
import type { TypeSerialOption } from '@/components/blocks/modbus/types.ts';

import { ref, onMounted, computed } from 'vue';

import BlockModBus from '@/components/blocks/modbus/BlockModBus.vue';
import BlockSerial from '@/components/blocks/modbus/BlockSerial.vue';

import { useChromeSerial } from '@/composables/modbus/useChromeSerial.ts';
import { useServerSerial } from '@/composables/modbus/useServerSerial.ts';
import { debounce } from '@/utils/helpers.ts';

const buffer = ref([]);

const isConnect = ref(false);

const settings: Ref<TypeSerialOption> = ref({
  path: '',
  baudRate: 9600,
  bufferSize: 255,
  dataBits: 8,
  parity: 'none', // 'even', 'odd'
  stopBits: 1, // 2,
});

const onChange = ({ name, value }: any) => {
  settings.value[name] = value;
};

const isChrome = computed(() => settings.value.path === 'chrome');

const updateData = (value) => {
  console.log(value);

  buffer.value.push(...Array.from(value));
  onLoad(buffer.value);
};

const onStatus = ({ status, options }) => {
  isConnect.value = status;
  settings.value = options;
};

const onLoad = debounce((data: any) => {
  buffer.value = data;
}, 100);

const { connectChrome, disconnectChrome, onWriteChrome } = useChromeSerial(updateData);

const { listPort, init, connectServer, disconnectServer, onWriteServer } = useServerSerial(updateData, onStatus);

const onConnect = async (options: TypeSerialOption) => {
  if (isConnect.value) {
    if (isChrome.value) await disconnectChrome();
    else disconnectServer();
  } else {
    if (isChrome.value) await connectChrome(options);
    else connectServer(options);
  }
  isConnect.value = !isConnect.value;
};

const onSend = (data: any) => {
  console.log(data);

  if (isChrome.value) onWriteChrome(data);
  else onWriteServer(data);
  buffer.value = [];
};

onMounted(() => {
  init();
});
</script>
