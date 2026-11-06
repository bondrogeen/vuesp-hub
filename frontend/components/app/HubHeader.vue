<template>
  <header class="glass-header sticky top-0 z-20 border-b">
    <div class="flex h-[72px] items-center gap-2 px-3 sm:px-5 lg:px-7">
      <button
        type="button"
        class="flex h-10 w-10 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
        :aria-label="t('header.toggleSidebar')"
        @click="emit('sidebar', $event)"
      >
        <IconMenu class="size-5" />
      </button>

      <router-link to="/" class="flex items-center lg:hidden">
        <IconLogoMini class="h-7 text-primary" />
      </router-link>

      <div class="hidden items-center gap-2 text-xs text-gray-500 dark:text-gray-400 lg:flex">
        <span class="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"></span>
        <span>{{ t('header.localHub') }}</span>
      </div>

      <div class="flex-1"></div>

      <button
        type="button"
        class="flex h-10 min-w-10 items-center justify-center rounded-md px-2 text-xs font-semibold uppercase text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
        :aria-label="t('common.language')"
        @click="toggleLocale"
      >
        {{ locale }}
      </button>

      <button
        type="button"
        class="flex h-10 w-10 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
        :aria-label="t('header.toggleTheme')"
        @click="appStore.changeTheme()"
      >
        <IconSun v-if="theme === 'dark'" class="size-5" />
        <IconMoon v-else class="size-5" />
      </button>

      <button
        type="button"
        class="relative flex h-10 w-10 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
        :aria-label="t('header.notifications')"
        @click="emit('notif', $event)"
      >
        <span v-if="hasUnread" class="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-400 ring-2 ring-white/80 dark:ring-[#0b1538]"></span>
        <IconBell class="size-5" />
      </button>

      <div class="mx-1 h-6 w-px bg-gray-200/70 dark:bg-white/10"></div>

      <VDropdown left="unset" right="0" top="calc(100% + 10px)" :title="t('common.account')">
        <template #activator="{ on }">
          <button
            type="button"
            class="flex items-center gap-2 rounded-md p-1.5 pr-2 text-left transition hover:bg-gray-100 dark:hover:bg-white/5"
            @click="on.click($event)"
          >
            <span class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[var(--accent-blue)] text-xs font-semibold uppercase text-white shadow-sm">
              {{ initials }}
            </span>

            <span class="hidden min-w-0 sm:block">
              <span class="block truncate text-sm font-medium text-gray-900 dark:text-white">{{ username }}</span>
              <span class="block text-xs text-gray-500 dark:text-gray-400">{{ t('header.administrator') }}</span>
            </span>

            <IconChevron class="hidden size-4 rotate-90 text-gray-400 sm:block" />
          </button>
        </template>

        <template #default="{ hide }">
          <div class="glass-popover w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-[10px] lg:w-64">
            <div class="border-b border-gray-200/70 px-4 py-3 dark:border-white/10">
              <p class="truncate text-sm font-semibold text-gray-900 dark:text-white">{{ username }}</p>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ t('header.localAdministrator') }}</p>
            </div>

            <div class="p-1.5">
              <button
                type="button"
                class="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5"
                @click="goProfile(hide)"
              >
                <IconUser class="size-4 text-gray-400" />
                {{ t('header.profile') }}
              </button>

              <button
                type="button"
                class="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                @click="onLogout(hide)"
              >
                <IconLogout class="size-4" />
                {{ t('header.signOut') }}
              </button>
            </div>
          </div>
        </template>
      </VDropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { VDropdown } from 'vuesp-components/components';
import type { INotification } from 'vuesp-components/types';

import { useAppStore } from '@/stores/AppStore';
import { getUsername, logout } from '@/utils/auth.ts';
import legacyIcons from '@/components/app/legacyIcons.ts';
import { setLocale } from '@/i18n/index.ts';
import type { HubHeaderEmits, HubHeaderProps } from './HubHeader.types.ts';

const { notifications = [] } = defineProps<HubHeaderProps>();
const emit = defineEmits<HubHeaderEmits>();

const { t, locale } = useI18n();

const router = useRouter();
const appStore = useAppStore();
const { theme } = storeToRefs(appStore);

const { IconBell, IconChevron, IconLogout, IconLogoMini, IconMenu, IconMoon, IconSun, IconUser } = legacyIcons;

const username = computed(() => getUsername() || 'admin');
const initials = computed(() => username.value.slice(0, 2).toUpperCase());
const hasUnread = computed(() => notifications.some(notification => notification.isNew));

const toggleLocale = (): void => setLocale(locale.value === 'ru' ? 'en' : 'ru');

const goProfile = (hide: (event: Event) => void) => {
  hide(new Event('click'));
  void router.push('/profile');
};

const onLogout = (hide: (event: Event) => void) => {
  hide(new Event('click'));
  logout();
};
</script>
