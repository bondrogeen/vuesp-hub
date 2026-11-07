<template>
  <div class="h-[100dvh] min-h-full flex flex-col">
    <AppDialog v-if="dialog.value" v-bind="dialog" @close="dialog = { value: false }" />

    <div class="hub-shell flex h-screen overflow-hidden">
      <AppAside :isSidebar="sidebarToggle" @sidebar="sidebarToggle = $event">
        <div v-for="group in getMenu" :key="group.title" class="mb-4">
          <h3 class="mb-4 text-xs leading-[20px] text-gray-400 uppercase" :class="sidebarToggle ? 'lg:hidden' : ''">
            {{ group.title }}
          </h3>

          <AppNav :menu="getGroupItems(group.items)" :isSidebar="sidebarToggle" :fullPath="route.path" @sidebar="sidebarToggle = $event">
            <template #icon="{ item }">
              <component :is="getComponent(item.icon)" class="size-5" />
            </template>

            <template #icon-children="{ item }">
              <component :is="getComponent(item.icon)" class="size-5" />
            </template>
          </AppNav>
        </div>
        <div class="mt-auto pt-4 text-xs text-gray-400 dark:text-gray-500" :class="sidebarToggle ? 'lg:hidden' : ''">
          {{ t('common.appName') }}
        </div>
      </AppAside>

      <div class="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden scrollbar">
        <HubHeader
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
            <div class="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/70 bg-white/75 px-3 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#07112c]/80">
              <h2 class="font-medium">{{ t('notifications.title') }}</h2>
              <VButton size="sm" color="gray" class="whitespace-nowrap text-xs" :disabled="!isNew" @click="appStore.readAllNotification">
                {{ t('notifications.markAllRead') }}
              </VButton>
            </div>
          </template>
          <template #empty>
            <p class="py-10 text-center">{{ t('notifications.empty') }}</p>
          </template>
        </AppNotification>

        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, provide, computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '@/stores/AppStore';
import { useWebSocketStore } from '@/stores/WebSocketStore';

import { api } from '@/utils/helpers.ts';
import { isAdmin } from '@/utils/auth.ts';
import { useAccessStore } from '@/stores/AccessStore.ts';
import { createDeviceMenu } from '@/utils/deviceMenu.ts';
import legacyIcons from '@/components/app/legacyIcons.ts';

import AppDialog from '@/components/app/AppDialog.vue';
import HubHeader from '@/components/app/HubHeader.vue';
import { AppAside, AppNav, AppNotification, VButton } from 'vuesp-components/components';
import type { DeviceRecord, MenuChildType, MenuItemType } from '@/types';
import type { IMenuItem, INotification } from 'vuesp-components/types';

const route = useRoute();
const { t } = useI18n();

const webSocketStore = useWebSocketStore();
const appStore = useAppStore();
const accessStore = useAccessStore();

const {
  IconDashboard,
  IconDevice,
  IconVideo,
  IconList,
  IconHome,
  IconScript,
  IconSettings,
  IconStorage,
  IconGpio,
} = legacyIcons;

const iconComponents = {
  IconDashboard,
  IconDevice,
  IconVideo,
  IconList,
  IconHome,
  IconScript,
  IconSettings,
  IconStorage,
  IconGpio,
};

const getComponent = (name?: string) => iconComponents[name as keyof typeof iconComponents] ?? IconDashboard;

const toNavigationItem = (item: MenuItemType | MenuChildType): IMenuItem => ({
  name: item.name,
  icon: item.icon ?? 'IconDevice',
  path: item.path ?? '',
  children: item.children?.map(toNavigationItem),
});

const getGroupItems = (items: MenuItemType[]): IMenuItem[] => items.map(toNavigationItem);

const { menus } = storeToRefs(webSocketStore);
const { dialog, notifications } = storeToRefs(appStore);

const registry = ref<DeviceRecord[]>([]);

const loadRegistry = async (): Promise<void> => {
  try {
    registry.value = await api.get<DeviceRecord[]>('/device/');
  } catch {
    registry.value = [];
  }
};

const getMenu = computed(() => {
  const groups = createDeviceMenu(menus.value, t, registry.value);
  if (isAdmin()) {
    groups.push({
      title: t('admin.title'),
      items: [
        { name: t('admin.users'), icon: 'IconSettings', path: '/admin/users/' },
        { name: t('admin.access'), icon: 'IconSettings', path: '/admin/access/' },
      ],
    });
  }

  return groups
    .map(group => ({
      ...group,
      items: group.items
        .filter(item => !item.path || accessStore.can(item.path))
        .map(item => ({
          ...item,
          children: item.children?.filter(child => !child.path || accessStore.can(child.path)),
        })),
    }))
    .filter(group => group.items.length > 0);
});
const headerNotifications = computed<INotification[]>(() => notifications.value.map(notification => ({
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

onMounted(() => {
  void loadRegistry();
  void accessStore.load(true);
});

watch(menus, () => {
  void loadRegistry();
});

const sidebarToggle = ref(false);
const isNotificationsOpen = ref(false);

provide('dialog', appStore.setDialog);
provide('notification', appStore.setNotification);
</script>
