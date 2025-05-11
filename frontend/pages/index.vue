<template>
  <div class="flex"></div>
</template>

<script setup>
import { io } from 'socket.io-client';
import { onMounted } from 'vue';

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
  console.log('startService');
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
  setTimeout(() => {
    // init();
    // startService();
  }, 5000);
});
</script>
