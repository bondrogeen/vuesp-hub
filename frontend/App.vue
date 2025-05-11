<template>
  <component :is="layout">
    <router-view />
  </component>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { computed, onMounted } from 'vue';
import { useAppStore } from '@/stores/AppStore';
import { io } from 'socket.io-client';

import LayoutEmpty from '@/layouts/LayoutEmpty.vue';
import LayoutMain from '@/layouts/LayoutMain.vue';

const route = useRoute();

const layouts = { LayoutEmpty, LayoutMain };

const layout = computed(() => layouts[route?.meta?.layout]);

const appStore = useAppStore();

let socket = null;

const init = () => {
  socket = io({ transports: ['websocket'], path: '/ws/device' });
  socket.on('connect', () => {
    console.log('connect');
  });

  socket.on('broadcast', msg => {
    console.log(msg);
  });

  // Обработчики событий
  socket.on('service:status', data => {
    console.log(data);
  });

  socket.on('service:log', log => {
    console.log(log);
  });

  socket.on('service:error', error => {
    console.log(error);
  });

  // Запрос статуса при загрузке
  socket.emit('service:get-status', {}, response => {
    console.log(response);
  });
};
// Методы управления
function startService() {
  socket.emit('service:start', {}, response => {
    console.log('Start response:', response);
  });
}

function stopService() {
  socket.emit('service:stop', {}, response => {
    console.log('Stop response:', response);
  });
}

onMounted(() => {
  appStore.init();
  init();
  startService();
});
</script>

<style lang="scss"></style>
