<template>
  <component :is="layout">
    <router-view />
  </component>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { computed, onMounted } from 'vue';
import { useAppStore } from '@/stores/AppStore';
import { useWebSocketStore } from '@/stores/WebSocketStore';
import { io } from 'socket.io-client';
import { storeToRefs } from 'pinia';

import LayoutEmpty from '@/layouts/LayoutEmpty.vue';
import LayoutMain from '@/layouts/LayoutMain.vue';

const route = useRoute();

const layouts = { LayoutEmpty, LayoutMain };

const layout = computed(() => layouts[route?.meta?.layout]);

const appStore = useAppStore();
const webSocketStore = useWebSocketStore();

const { socket } = storeToRefs(webSocketStore);

const init = () => {
  socket.value = io({ transports: ['websocket'], path: '/ws/device' });
  socket.value.on('connect', () => {
    console.log('connect');
    webSocketStore.getMenus();
  });

  socket.value.on('broadcast', (msg) => {
    console.log(msg);
  });

  socket.value.on('service:status', (data) => {
    console.log(data);
  });

  socket.value.on('device:data', (data) => {
    webSocketStore.onData(data);
  });

  socket.value.on('service:error', (error) => {
    console.log(error);
  });
};

onMounted(() => {
  appStore.init();
  init();
  webSocketStore.startService();
});
</script>

<style lang="scss"></style>
