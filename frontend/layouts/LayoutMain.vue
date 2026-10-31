<template>
  <div class="h-[100dvh] min-h-full flex flex-col">
    <AppDialog v-if="dialog.value" v-bind="dialog" @close="dialog = { value: false }" />

    <div class="flex h-screen overflow-hidden">
      <AppAside :menu="getMenu" :sidebarToggle="sidebarToggle" @sidebar="sidebarToggle = $event" />

      <div class="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
        <AppHeader
          :change-theme="appStore.changeTheme"
          :notifications="headerNotifications"
          @sidebar="sidebarToggle = !sidebarToggle"
          @notif="isNotificationsOpen = !isNotificationsOpen"
        />

        <AppNotification
          :value="isNotificationsOpen"
          :notifications="headerNotifications"
          @close="isNotificationsOpen = false"
          @remove="appStore.removeNotification"
          @read="appStore.readNotification"
        >
          <template #header="{ isNew }">
            <div class="sticky top-0 z-20 flex items-center justify-between bg-gray-50 px-2 py-4 dark:bg-gray-900">
              <h2 class="font-medium">Notifications</h2>
              <VButton size="sm" color="gray" :disabled="!isNew" @click="appStore.readAllNotification">
                Mark all as read
              </VButton>
            </div>
          </template>
          <template #empty>
            <p class="py-10 text-center">No notifications</p>
          </template>
        </AppNotification>

        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, provide, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useAppStore } from '@/stores/AppStore';
import { useWebSocketStore } from '@/stores/WebSocketStore';

import { createDeviceMenu } from '@/utils/deviceMenu.ts';

import AppAside from '@/components/app/AppAside.vue';
import AppDialog from '@/components/app/AppDialog.vue';
import { AppHeader, AppNotification, VButton } from 'vuesp-components/components';

const webSocketStore = useWebSocketStore();
const appStore = useAppStore();

const { menus } = storeToRefs(webSocketStore);
const { dialog, notifications } = storeToRefs(appStore);

const getMenu = computed(() => createDeviceMenu(menus.value));
const headerNotifications = computed(() => notifications.value.map(notification => ({
  key: typeof notification.id === 'number'
    ? notification.id
    : Number.isFinite(Number(notification.id))
      ? Number(notification.id)
      : notification.date ?? Date.now(),
  isNew: notification.isNew ?? 1,
  color: notification.color ?? 0,
  timeout: notification.timeout ?? 10,
  date: notification.date ?? Date.now(),
  text: notification.text ?? notification.message ?? notification.title ?? '',
})));

const sidebarToggle = ref(false);
const isNotificationsOpen = ref(false);

provide('dialog', appStore.setDialog);
provide('notification', appStore.setNotification);
</script>
