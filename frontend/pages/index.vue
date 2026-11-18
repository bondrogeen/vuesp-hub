<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VCard variant="glass" padding="none" class="relative overflow-hidden px-5 py-10 sm:px-8 sm:py-14">
      <div class="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-cyan-main/15 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full bg-blue-main/10 blur-3xl"></div>

      <div class="relative max-w-3xl">
        <span class="inline-flex items-center gap-2 rounded-full border border-cyan-main/25 bg-cyan-main/5 px-3 py-1 text-xs font-medium text-cyan-main">
          <span class="size-1.5 rounded-full bg-emerald-500"></span>
          {{ t('landing.badge') }}
        </span>

        <h1 class="mt-5 text-3xl font-bold tracking-tight text-gray-dark-40 dark:text-white sm:text-4xl">
          {{ t('landing.title') }}
        </h1>
        <p class="mt-4 max-w-2xl text-base leading-relaxed text-gray-dark-25 dark:text-gray-light-10">
          {{ t('landing.subtitle') }}
        </p>

        <div class="mt-7 flex flex-wrap gap-3">
          <VButton color="blue" to="/device/list/">{{ t('landing.openDevices') }}</VButton>
          <VButton variant="outline" color="gray" to="/dashboard/">{{ t('landing.openDashboard') }}</VButton>
        </div>
      </div>
    </VCard>

    <section class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <VCard v-for="feature in features" :key="feature.title" variant="glass" padding="lg">
        <div class="flex size-10 items-center justify-center rounded-md bg-blue-main/10 text-blue-main">
          <VIcon :name="feature.icon" class="size-5" />
        </div>
        <h2 class="mt-4 text-base font-semibold text-gray-dark-40 dark:text-white">{{ t(feature.title) }}</h2>
        <p class="mt-2 text-sm leading-relaxed text-gray-dark-25 dark:text-gray-main">{{ t(feature.text) }}</p>
      </VCard>
    </section>

    <section class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <VCard variant="glass" padding="lg">
        <h2 class="text-lg font-semibold text-gray-dark-40 dark:text-white">{{ t('landing.quick.title') }}</h2>
        <p class="mt-1 text-sm text-gray-dark-25 dark:text-gray-main">{{ t('landing.quick.subtitle') }}</p>

        <div class="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <router-link
            v-for="link in quickLinks"
            :key="link.path"
            :to="link.path"
            class="flex items-center justify-between rounded-md border border-gray-light-10/70 bg-white/40 px-4 py-3 text-sm font-medium text-gray-dark-30 transition hover:border-cyan-main/30 hover:bg-cyan-main/5 dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-light-10"
          >
            {{ t(link.label) }}
            <VIcon name="chevron-down" class="size-4 text-gray-main" />
          </router-link>
        </div>
      </VCard>

      <VCard variant="glass" padding="lg">
        <h2 class="text-lg font-semibold text-gray-dark-40 dark:text-white">{{ t('landing.roles.title') }}</h2>
        <p class="mt-1 text-sm text-gray-dark-25 dark:text-gray-main">{{ t('landing.roles.subtitle') }}</p>

        <ul class="mt-4 space-y-3">
          <li v-for="role in roles" :key="role.name" class="flex items-center gap-3">
            <span class="flex size-2.5 rounded-full" :class="role.color"></span>
            <span class="text-sm font-medium text-gray-dark-40 dark:text-white">{{ t(role.name) }}</span>
            <span class="text-sm text-gray-dark-25 dark:text-gray-main">— {{ t(role.text) }}</span>
          </li>
        </ul>

        <p class="mt-4 text-xs text-gray-main dark:text-gray-dark-25">{{ t('landing.roles.current', { role: t(`admin.roles.${currentRole}`) }) }}</p>
      </VCard>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { VButton, VIcon, VCard } from 'vuesp-components/components';
import { getRole } from '@/utils/auth.ts';

const { t } = useI18n();
const currentRole = getRole();

const features = [
  { icon: 'layout-grid', title: 'landing.features.devices.title', text: 'landing.features.devices.text' },
  { icon: 'video', title: 'landing.features.cameras.title', text: 'landing.features.cameras.text' },
  { icon: 'storage', title: 'landing.features.local.title', text: 'landing.features.local.text' },
  { icon: 'settings', title: 'landing.features.roles.title', text: 'landing.features.roles.text' },
];

const quickLinks = [
  { label: 'landing.quick.devices', path: '/device/list/' },
  { label: 'landing.quick.dashboard', path: '/dashboard/' },
  { label: 'landing.quick.video', path: '/modules/video/cameras/' },
  { label: 'landing.quick.profile', path: '/profile/' },
];

const roles = [
  { name: 'admin.roles.admin', text: 'landing.roles.adminText', color: 'bg-blue-500' },
  { name: 'admin.roles.user', text: 'landing.roles.userText', color: 'bg-emerald-500' },
  { name: 'admin.roles.viewer', text: 'landing.roles.viewerText', color: 'bg-gray-main' },
];
</script>
