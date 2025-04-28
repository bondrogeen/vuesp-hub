<template>
  <div class="container mx-auto">
    <h1 class="mb-6">Service</h1>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="lg:order-last lg:mt-14">
        <ServiceInfo v-bind="info" />
      </div>

      <div>
        <VTabs>
          <VTab label="Settings">
            <ServiceSettings v-model="settings" :scan-list="scanList" @save="onSave" @scan="onScan" />
          </VTab>

          <VTab label="Storage">
            <ServiceStorage v-model="path" :files="fileList" :progress="progress" :info="info" @send="onSend" />
          </VTab>

          <VTab label="System">
            <ServiceSystem @reboot="onSureReboot" @reset="onSureReset" />
          </VTab>

          <VTab label="GPIO">
            <ServiceGPIO :gpio="gpio" @send="onSend" @reboot="onSureReboot" />
          </VTab>
        </VTabs>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, inject, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import event from '@/assets/js/event';

import ServiceGPIO from '@/components/pages/service/ServiceGPIO';
import ServiceStorage from '@/components/pages/service/ServiceStorage';
import ServiceSettings from '@/components/pages/service/ServiceSettings';
import ServiceInfo from '@/components/pages/service/ServiceInfo';
import ServiceSystem from '@/components/pages/service/ServiceSystem';

import VTabs from '@/components/general/VTabs';
import VTab from '@/components/general/VTab';

import { useWebSocketStore } from '@/stores/WebSocketStore';

const dialog = inject('dialog');
const notification = inject('notification');

const webSocketStore = useWebSocketStore();
const { fileList, info, path, progress, settings, scanList, gpio } = storeToRefs(webSocketStore);

const onReboot = () => {
  webSocketStore.onSend('REBOOT');
  nextTick(() => {
    notification({ text: 'Reboot' });
  });
};
const onReset = () => {
  settings.value.version = Math.floor(Math.random() * 65000);
  nextTick(() => onSave(settings.value));
};

const onSureReboot = () => dialog({ value: true, message: 'Do you want to restart your device?', callback: onReboot });
const onSureReset = () => dialog({ value: true, message: 'The configuration will be reset to default. <br/>Are you sure?', callback: onReset });

const onSend = ({ comm, data }) => {
  fileList.value = [];
  webSocketStore.onSend(comm, data);
};

const onSave = settings => {
  webSocketStore.onSend('SETTINGS', settings);
  dialog({ value: true, title: 'Done', message: 'Do you want to restart your device?', callback: onReboot });
};

const onScan = value => {
  if (value) scanList.value = [];
  if (!scanList.value.length) webSocketStore.onSend('SCAN');
};

event.on('init', () => {
  if (!settings?.key) webSocketStore.onSend('SETTINGS');
});

onMounted(() => {
  webSocketStore.onSend('SETTINGS');
  webSocketStore.onSend('INFO');
});
</script>
