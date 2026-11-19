<template>
  <div class="h-[100dvh] min-h-full flex flex-col">
    <AppDialog v-if="dialog.value" v-bind="dialog" @close="dialog = { value: false }" />

    <div class="hub-shell flex h-screen overflow-hidden">
      <AppAside :is-sidebar="sidebarToggle" @sidebar="sidebarToggle = $event">
        <AppNav :groups="getMenu" :is-sidebar="sidebarToggle" :full-path="route.path" @sidebar="sidebarToggle = $event" />
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

        <AppHeader
          :notifications="headerNotifications"
          :change-theme="appStore.changeTheme"
          :show-logout="false"
          @sidebar="sidebarToggle = !sidebarToggle"
          @notif="isNotificationsOpen = !isNotificationsOpen"
        >
          <template #status>
            <div class="hidden items-center gap-2 text-xs text-gray-dark-25 dark:text-gray-main lg:flex">
              <span class="h-2 w-2 rounded-full bg-emerald-500 shadow-green-ring"></span>
              <span>{{ t('header.localHub') }}</span>
            </div>
          </template>

          <template #actions>
            <button
              type="button"
              class="flex h-10 min-w-10 items-center justify-center rounded-md px-2 text-xs font-semibold uppercase text-gray-dark-25 transition hover:bg-gray-light-30 hover:text-gray-dark-40 dark:text-gray-main dark:hover:bg-white/5 dark:hover:text-white"
              :aria-label="t('common.language')"
              @click="toggleLocale"
            >
              {{ locale }}
            </button>
          </template>

          <template #account>
            <VDropdown left="unset" right="0" top="calc(100% + 10px)" :title="t('common.account')">
              <template #activator="{ on }">
                <button type="button" class="flex items-center gap-2 rounded-md p-1.5 pr-2 text-left transition hover:bg-gray-light-30 dark:hover:bg-white/5" @click="on.click($event)">
                  <span class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-main to-blue-main text-xs font-semibold uppercase text-white shadow-sm">{{ initials }}</span>
                  <span class="hidden min-w-0 sm:block">
                    <span class="block truncate text-sm font-medium text-gray-dark-40 dark:text-white">{{ username }}</span>
                    <span class="block text-xs text-gray-dark-25 dark:text-gray-main">{{ roleLabel }}</span>
                  </span>
                  <VIcon name="chevron-down" class="hidden size-4 text-gray-main sm:block" />
                </button>
              </template>

              <template #default="{ hide }">
                <div class="glass-popover w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-[10px] lg:w-64">
                  <div class="border-b border-gray-light-10/70 px-4 py-3 dark:border-white/10">
                    <p class="truncate text-sm font-semibold text-gray-dark-40 dark:text-white">{{ username }}</p>
                    <p class="mt-0.5 text-xs text-gray-dark-25 dark:text-gray-main">{{ roleLabel }}</p>
                  </div>
                  <div class="p-1.5">
                    <button type="button" class="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-gray-dark-30 transition hover:bg-gray-light-30 dark:text-gray-light-10 dark:hover:bg-white/5" @click="goProfile(hide)">
                      <VIcon name="user" class="size-4 text-gray-main" />
                      {{ t('header.profile') }}
                    </button>
                    <button type="button" class="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40" @click="onLogout(hide)">
                      <VIcon name="logout" class="size-4" />
                      {{ t('header.signOut') }}
                    </button>
                  </div>
                </div>
              </template>
            </VDropdown>
          </template>
        </AppHeader>

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
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '@/stores/AppStore';
import { useWebSocketStore } from '@/stores/WebSocketStore';

import { api } from '@/utils/helpers.ts';
import { getRole, getUsername, isAdmin, logout } from '@/utils/auth.ts';
import { setLocale } from '@/i18n/index.ts';
import { useAccessStore } from '@/stores/AccessStore.ts';
import { createDeviceMenu } from '@/utils/deviceMenu.ts';
import { withTrailingSlash } from '@/utils/path.ts';

import AppDialog from '@/components/app/AppDialog.vue';
import { AppAside, AppHeader, AppNav, AppNotification, VButton, VDropdown, VIcon } from 'vuesp-components/components';
import type { IDeviceRecord, IMenuChildType, IMenuItemType, IModuleSummary } from '@/types';
import type { INotification } from 'vuesp-components/types';

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();

const username = computed(() => getUsername() || 'admin');
const roleLabel = computed(() => t(`admin.roles.${getRole()}`));
const initials = computed(() => username.value.slice(0, 2).toUpperCase());
const toggleLocale = (): void => setLocale(locale.value === 'ru' ? 'en' : 'ru');
const goProfile = (hide: (event: Event) => void) => {
  hide(new Event('click'));
  void router.push('/profile');
};
const onLogout = (hide: (event: Event) => void) => {
  hide(new Event('click'));
  void logout();
};

const webSocketStore = useWebSocketStore();
const appStore = useAppStore();
const accessStore = useAccessStore();

const { menus } = storeToRefs(webSocketStore);
const { dialog, notifications } = storeToRefs(appStore);

const registry = ref<IDeviceRecord[]>([]);
const installedModules = ref<IModuleSummary[]>([]);

const loadRegistry = async (): Promise<void> => {
  try {
    registry.value = await api.get<IDeviceRecord[]>('/device/');
  } catch {
    registry.value = [];
  }
  try {
    installedModules.value = await api.get<IModuleSummary[]>('/modules');
  } catch {
    installedModules.value = [];
  }
};

const moduleAvailable = (moduleId?: string): boolean =>
  !moduleId || installedModules.value.some(item => item.id === moduleId && item.running);

const getMenu = computed(() => {
  const groups = createDeviceMenu(menus.value, t, registry.value);

  const moduleItems: IMenuItemType[] = [];
  const moduleGroups = new Map<string, { name: string; icon: IMenuItemType['icon']; order: number; children: IMenuChildType[] }>();

  for (const item of installedModules.value) {
    if (!item.running || !item.web?.nav) continue;

    const child = {
      name: item.web.nav.label || item.name,
      icon: item.group?.slug === 'video' ? ('video' as const) : ('box' as const),
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
        icon: item.group.slug === 'video' ? 'video' : 'box',
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
      { name: t('common.modules'), icon: 'box' as const, path: '/modules/' },
      ...moduleItems,
    ],
  });

  if (isAdmin()) {
    groups.push({
      key: 'users',
      title: t('common.menuGroups.users'),
      items: [
        { name: t('admin.users'), icon: 'user' as const, path: '/admin/users/' },
        { name: t('admin.access'), icon: 'settings' as const, path: '/admin/access/' },
      ],
    });
  }

  groups.push({
    key: 'settings',
    title: t('common.menuGroups.settings'),
    items: [
      { name: t('common.profile'), icon: 'user' as const, path: '/profile/' },
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
