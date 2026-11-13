<template>
  <div class="h-[100dvh] min-h-full flex flex-col">
    <AppDialog v-if="dialog.value" v-bind="dialog" @close="dialog = { value: false }" />

    <div class="hub-shell flex h-screen overflow-hidden">
      <AppAside :isSidebar="sidebarToggle" @sidebar="sidebarToggle = $event">
        <HubNav :groups="getMenu" :is-sidebar="sidebarToggle" :full-path="route.path" @sidebar="sidebarToggle = $event" />
        <div class="mt-auto pt-4 text-xs text-gray-main dark:text-gray-dark-25" :class="sidebarToggle ? 'lg:hidden' : ''">
          {{ t('common.appName') }}
        </div>
      </AppAside>

      <div class="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden scrollbar isolate">
        <div class="hub-atmosphere -z-10" aria-hidden="true">
          <span class="hub-orb hub-orb--one" />
          <span class="hub-orb hub-orb--two" />
          <span class="hub-orb hub-orb--three" />
          <span class="hub-spark hub-spark--one" />
          <span class="hub-spark hub-spark--two" />
          <span class="hub-scan" />
        </div>

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
            <div class="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-gray-light-10/70 bg-white/75 px-3 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-night-main/80">
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
import { ref, provide, computed, onMounted, onUnmounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '@/stores/AppStore';
import { useWebSocketStore } from '@/stores/WebSocketStore';

import { api } from '@/utils/helpers.ts';
import { isAdmin } from '@/utils/auth.ts';
import { useAccessStore } from '@/stores/AccessStore.ts';
import { createDeviceMenu } from '@/utils/deviceMenu.ts';
import { withTrailingSlash } from '@/utils/path.ts';

import AppDialog from '@/components/app/AppDialog.vue';
import HubHeader from '@/components/app/HubHeader.vue';
import HubNav from '@/components/app/HubNav.vue';
import { AppAside, AppNotification, VButton } from 'vuesp-components/components';
import type { DeviceRecord, MenuChildType, MenuItemType, ModuleSummary } from '@/types';
import type { INotification } from 'vuesp-components/types';

const route = useRoute();
const { t } = useI18n();

const webSocketStore = useWebSocketStore();
const appStore = useAppStore();
const accessStore = useAccessStore();

const { menus } = storeToRefs(webSocketStore);
const { dialog, notifications } = storeToRefs(appStore);

const registry = ref<DeviceRecord[]>([]);
const installedModules = ref<ModuleSummary[]>([]);

const loadRegistry = async (): Promise<void> => {
  try {
    registry.value = await api.get<DeviceRecord[]>('/device/');
  } catch {
    registry.value = [];
  }
  try {
    installedModules.value = await api.get<ModuleSummary[]>('/modules');
  } catch {
    installedModules.value = [];
  }
};

const moduleAvailable = (moduleId?: string): boolean =>
  !moduleId || installedModules.value.some(item => item.id === moduleId && item.running);

const getMenu = computed(() => {
  const groups = createDeviceMenu(menus.value, t, registry.value);

  const moduleItems: MenuItemType[] = [];
  const moduleGroups = new Map<string, { name: string; icon: MenuItemType['icon']; order: number; children: MenuChildType[] }>();

  for (const item of installedModules.value) {
    if (!item.running || !item.web?.nav) continue;

    const child = {
      name: item.web.nav.label || item.name,
      icon: item.group?.slug === 'video' ? ('IconVideo' as const) : ('IconPuzzle' as const),
      path: withTrailingSlash(item.route),
    };

    if (!item.group) {
      moduleItems.push({ ...child, icon: child.icon });
      continue;
    }

    let group = moduleGroups.get(item.group.id);
    if (!group) {
      group = {
        name: item.group.name,
        icon: item.group.slug === 'video' ? 'IconVideo' : 'IconPuzzle',
        order: item.group.order ?? 1000,
        children: [],
      };
      moduleGroups.set(item.group.id, group);
    }
    group.children.push(child);
  }

  for (const group of [...moduleGroups.values()].sort((left, right) => left.order - right.order)) {
    moduleItems.push({ name: group.name, icon: group.icon, children: group.children });
  }

  groups.push({
    key: 'modules',
    title: t('common.menuGroups.modules'),
    items: [
      { name: t('common.modules'), icon: 'IconPuzzle' as const, path: '/modules/' },
      ...moduleItems,
    ],
  });

  if (isAdmin()) {
    groups.push({
      key: 'users',
      title: t('common.menuGroups.users'),
      items: [
        { name: t('admin.users'), icon: 'IconUser' as const, path: '/admin/users/' },
        { name: t('admin.access'), icon: 'IconSettings' as const, path: '/admin/access/' },
      ],
    });
  }

  groups.push({
    key: 'settings',
    title: t('common.menuGroups.settings'),
    items: [
      { name: t('common.profile'), icon: 'IconUser' as const, path: '/profile/' },
    ],
  });

  return groups
    .map(group => ({
      ...group,
      items: group.items
        .filter(item => (!item.path || accessStore.can(item.path)) && moduleAvailable(item.moduleId))
        .map(item => ({
          ...item,
          children: item.children?.filter(child =>
            (!child.path || accessStore.can(child.path)) && moduleAvailable(child.moduleId)
          ),
        }))
        .filter(item => Boolean(item.path || item.children?.length)),
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

const onModulesChanged = (): void => {
  void loadRegistry();
};

onMounted(() => {
  void loadRegistry();
  void accessStore.load(true);
  window.addEventListener('vuesp:modules-changed', onModulesChanged);
});

onUnmounted(() => {
  window.removeEventListener('vuesp:modules-changed', onModulesChanged);
});

watch(menus, () => {
  void loadRegistry();
});

const sidebarToggle = ref(false);
const isNotificationsOpen = ref(false);

provide('dialog', appStore.setDialog);
provide('notification', appStore.setNotification);
</script>
