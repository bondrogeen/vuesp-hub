<template>
  <div class="h-[100dvh] min-h-full flex flex-col">
    <AppDialog v-if="dialog.value" v-bind="dialog" @close="dialog = {}" />

    <div class="flex h-screen overflow-hidden">
      <AppAside :menu="getMenu" :sidebarToggle="sidebarToggle" @sidebar="sidebarToggle = !sidebarToggle" />

      <div class="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <AppHeader :change-theme="appStore.changeTheme" @sidebar="sidebarToggle = !sidebarToggle" />

        <AppNotification class="fixed right-4 md:right-10 lg:right-20 top-20 z-20" :notifications="notifications" @close="onNotifications" />

        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, provide, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppStore } from '@/stores/AppStore';
import { useWebSocketStore } from '@/stores/WebSocketStore';

import { menu } from '@/temp.js';

import AppAside from '@/components/app/AppAside.vue';


const webSocketStore = useWebSocketStore();
const appStore = useAppStore();

const { menus } = storeToRefs(webSocketStore);
const { dialog, notifications } = storeToRefs(appStore);

const getMenu = computed(() => menu(menus.value));

const drawer = ref(false);
const sidebarToggle = ref(false);

provide('dialog', appStore.setDialog);
provide('notification', appStore.setNotification);

const onNotifications = (item) => {
  notifications.value = notifications.value.filter((i) => i.id !== item.id);
};

onMounted(() => {
  appStore.init();
});
</script>
