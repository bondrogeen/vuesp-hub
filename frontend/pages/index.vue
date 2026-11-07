<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <section class="glass-panel relative overflow-hidden rounded-[10px] px-5 py-10 sm:px-8 sm:py-14">
      <div class="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/15 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full bg-[var(--accent-blue)]/10 blur-3xl"></div>

      <div class="relative max-w-3xl">
        <span class="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <span class="size-1.5 rounded-full bg-emerald-500"></span>
          {{ t('landing.badge') }}
        </span>

        <h1 class="mt-5 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          {{ t('landing.title') }}
        </h1>
        <p class="mt-4 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-300">
          {{ t('landing.subtitle') }}
        </p>

        <div class="mt-7 flex flex-wrap gap-3">
          <VButton color="blue" to="/device/list/">{{ t('landing.openDevices') }}</VButton>
          <VButton outline color="gray" to="/dashboard/">{{ t('landing.openDashboard') }}</VButton>
        </div>
      </div>
    </section>

    <section class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article v-for="feature in features" :key="feature.title" class="glass-panel rounded-[10px] p-5">
        <div class="flex size-10 items-center justify-center rounded-md bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]">
          <component :is="feature.icon" class="size-5" />
        </div>
        <h2 class="mt-4 text-base font-semibold text-gray-900 dark:text-white">{{ t(feature.title) }}</h2>
        <p class="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{{ t(feature.text) }}</p>
      </article>
    </section>

    <section class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div class="glass-panel rounded-[10px] p-5">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('landing.quick.title') }}</h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('landing.quick.subtitle') }}</p>

        <div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <router-link
            v-for="link in quickLinks"
            :key="link.path"
            :to="link.path"
            class="flex items-center justify-between rounded-md border border-gray-200/70 bg-white/40 px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:bg-primary/5 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-200"
          >
            {{ t(link.label) }}
            <IconChevron class="size-4 rotate-90 text-gray-400" />
          </router-link>
        </div>
      </div>

      <div class="glass-panel rounded-[10px] p-5">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('landing.roles.title') }}</h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('landing.roles.subtitle') }}</p>

        <ul class="mt-4 space-y-3">
          <li v-for="role in roles" :key="role.name" class="flex items-center gap-3">
            <span class="flex size-2.5 rounded-full" :class="role.color"></span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">{{ t(role.name) }}</span>
            <span class="text-sm text-gray-500 dark:text-gray-400">— {{ t(role.text) }}</span>
          </li>
        </ul>

        <p class="mt-4 text-xs text-gray-400 dark:text-gray-500">{{ t('landing.roles.current', { role: t(`admin.roles.${currentRole}`) }) }}</p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { VButton } from 'vuesp-components/components';

import legacyIcons from '@/components/app/legacyIcons.ts';
import { getRole } from '@/utils/auth.ts';

const { t } = useI18n();
const currentRole = getRole();

const { IconDevice, IconVideo, IconStorage, IconSettings, IconChevron } = legacyIcons;

const features = [
  { icon: IconDevice, title: 'landing.features.devices.title', text: 'landing.features.devices.text' },
  { icon: IconVideo, title: 'landing.features.cameras.title', text: 'landing.features.cameras.text' },
  { icon: IconStorage, title: 'landing.features.local.title', text: 'landing.features.local.text' },
  { icon: IconSettings, title: 'landing.features.roles.title', text: 'landing.features.roles.text' },
];

const quickLinks = [
  { label: 'landing.quick.devices', path: '/device/list/' },
  { label: 'landing.quick.dashboard', path: '/dashboard/' },
  { label: 'landing.quick.video', path: '/video/' },
  { label: 'landing.quick.profile', path: '/profile/' },
];

const roles = [
  { name: 'admin.roles.admin', text: 'landing.roles.adminText', color: 'bg-blue-500' },
  { name: 'admin.roles.user', text: 'landing.roles.userText', color: 'bg-emerald-500' },
  { name: 'admin.roles.viewer', text: 'landing.roles.viewerText', color: 'bg-gray-400' },
];
</script>
