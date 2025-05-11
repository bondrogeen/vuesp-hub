<template>
  <div class="h-[100dvh] min-h-full flex flex-col">
    <AppOverlay v-if="!isConnect" @click="onClose">
      <div class="mb-4">Disconnected</div>

      <div class="flex justify-center">
        <VLoader class="text-primary"></VLoader>
      </div>
    </AppOverlay>

    <AppDialog v-bind="dialog" @close="dialog = {}" />

    <div class="flex h-screen overflow-hidden">
      <AppAside :menu="menu" :sidebarToggle="sidebarToggle" @sidebar="sidebarToggle = !sidebarToggle" />

      <div class="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <AppHeader :state="isConnect" :change-theme="appStore.changeTheme" @sidebar="sidebarToggle = !sidebarToggle" />

        <AppNotification class="fixed right-4 md:right-10 lg:right-20 top-20 z-20" :notifications="notifications" @close="onNotifications" />

        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, provide } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppStore } from '@/stores/AppStore';
import { useWebSocket } from '@/stores/WebSocket';
import { useWebSocketStore } from '@/stores/WebSocketStore';

import { menu } from '@/temp.js';

import AppAside from '@/components/app/AppAside.vue';
import AppDialog from '@/components/app/AppDialog.vue';
import AppHeader from '@/components/app/AppHeader.vue';
import AppOverlay from '@/components/app/AppOverlay.vue';
import AppNotification from '@/components/app/AppNotification.vue';

const appStore = useAppStore();
const webSocket = useWebSocket();
const webSocketStore = useWebSocketStore();

const { dialog, theme, notifications } = storeToRefs(appStore);

const { socket, isConnect } = storeToRefs(webSocket);
const { info } = storeToRefs(webSocketStore);

const drawer = ref(false);
const sidebarToggle = ref(false);

let ping = null;

provide('dialog', appStore.setDialog);
provide('notification', appStore.setNotification);

// const host =
//   process.env.NODE_ENV === "production"
//     ? window.location.host
//     : process.env.PROXY;

const connect = () => {
  const instance = new WebSocket(`ws://${host}/esp`);
  instance.binaryType = 'arraybuffer';
  instance.onopen = webSocket.onopen;
  instance.onmessage = webSocket.onmessage;
  instance.onclose = (e) => {
    webSocket.onclose(e);
    if (e.code !== 1000) connect();
  };
  instance.onerror = webSocket.onerror;
  socket.value = instance;
};

const onClose = () => {
  drawer.value = false;
  dialog.value = {};
};

const onNotifications = (item) => {
  console.log(item);

  notifications.value = notifications.value.filter((i) => i.id !== item.id);
};

onMounted(() => {
  // ping = setInterval(webSocket.onPing, 1000);
  // setTimeout(connect, 100);
  appStore.init();
});

onUnmounted(() => {
  // clearInterval(ping);
  // socket.value.close(1000);
});
</script>

<style lang="scss"></style>
