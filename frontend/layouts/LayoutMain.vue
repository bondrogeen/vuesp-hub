<template>
  <div class="h-[100dvh] min-h-full flex flex-col">
    <AppDialog v-if="dialog.value" v-bind="dialog" @close="dialog = {}" />

    <div class="flex h-screen overflow-hidden">
      <AppAside :menu="menu" :sidebarToggle="sidebarToggle" @sidebar="sidebarToggle = !sidebarToggle" />

      <div class="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <AppHeader :change-theme="appStore.changeTheme" @sidebar="sidebarToggle = !sidebarToggle" />

        <AppNotification class="fixed right-4 md:right-10 lg:right-20 top-20 z-20" :notifications="notifications" @close="onNotifications" />

        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, provide } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppStore } from '@/stores/AppStore';

import { menu } from '@/temp.js';

import AppAside from '@/components/app/AppAside.vue';
import AppDialog from '@/components/app/AppDialog.vue';
import AppHeader from '@/components/app/AppHeader.vue';
import AppNotification from '@/components/app/AppNotification.vue';

const appStore = useAppStore();

const { dialog, notifications } = storeToRefs(appStore);

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
