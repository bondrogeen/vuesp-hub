<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb
      :items="[
        { name: t('common.home'), path: '/' },
        { name: t('modules.title'), path: '/modules/' },
        { name: module?.name ?? label },
      ]"
      class="mb-6"
    />

    <div v-if="showHeader" class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold text-gray-dark-40 dark:text-white">
          {{ module?.name ?? label }}
        </h1>
        <p v-if="module" class="mt-2 text-sm text-gray-dark-25 dark:text-gray-main">
          {{ module.id }} · v{{ module.version }}
          <span
            class="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            :class="module.running
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-gray-dark-25/15 text-gray-dark-25 dark:text-gray-main'"
          >
            {{ module.running ? t('modules.running') : t('modules.stopped') }}
          </span>
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <VButton
          v-if="isAdmin() && module"
          outline
          color="gray"
          size="sm"
          :loading="starting"
          @click="startModule"
        >
          {{ module.running ? t('common.refresh') : t('modules.start') }}
        </VButton>
        <VButton
          outline
          color="gray"
          size="sm"
          :to="'/modules/'"
        >
          {{ t('modules.back') }}
        </VButton>
      </div>
    </div>

    <div
      v-if="error"
      class="mb-4 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300"
    >
      {{ error }}
    </div>

    <div v-if="loading" class="text-sm text-gray-dark-25 dark:text-gray-main">
      {{ t('common.refreshing') }}
    </div>

    <template v-else-if="module">
      <div
        v-if="module.web"
        ref="container"
        class="module-host"
      />
      <p
        v-else
        class="rounded-md border border-dashed border-gray-light-10/70 px-4 py-10 text-center text-sm text-gray-dark-25 dark:border-white/15 dark:text-gray-main"
      >
        {{ t('modules.noUi') }}
      </p>
    </template>

    <p
      v-else-if="!loading"
      class="rounded-md border border-dashed border-gray-light-10/70 px-4 py-10 text-center text-sm text-gray-dark-25 dark:border-white/15 dark:text-gray-main"
    >
      {{ t('modules.notFound') }}
    </p>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { BlockBreadcrumb as VBreadcrumb, VButton } from 'vuesp-components/components';

import { api } from '@/utils/helpers.ts';
import { getToken, isAdmin } from '@/utils/auth.ts';
import type { ModuleSummary } from '@/types';

const { t } = useI18n();
const route = useRoute();

const normalizePath = (value: string): string => value.replace(/\/+$/, '') || '/';
const path = computed(() => normalizePath(route.path));
const label = computed(() => path.value.split('/').filter(Boolean).at(-1) ?? path.value);
const module = ref<ModuleSummary>();
const container = ref<HTMLElement>();
/** Modules with their own UI already have a title and controls; keep the header for fallbacks. */
const showHeader = computed(() => !module.value?.web || !module.value.running);
const loading = ref(true);
const starting = ref(false);
const error = ref('');

let mountedElement: HTMLElement | undefined;
let themeObserver: MutationObserver | undefined;

const syncTheme = (): void => {
  mountedElement?.classList.toggle('dark', document.documentElement.classList.contains('dark'));
};

const clear = (): void => {
  mountedElement?.remove();
  mountedElement = undefined;
  container.value?.replaceChildren();
};

const mountUi = async (): Promise<void> => {
  const info = module.value;
  if (!info?.web || !container.value) return;

  try {
    await import(/* @vite-ignore */ info.web.url);
    if (!customElements.get(info.web.element)) {
      throw new Error(`Custom element ${info.web.element} is not registered`);
    }

    const element = document.createElement(info.web.element);
    element.style.display = 'block';
    Object.assign(element, {
      token: getToken(),
      moduleId: info.id,
      apiBase: `/api/v1/modules/${info.id}/proxy`,
      wsBase: info.web?.ws ?? '',
    });
    clear();
    container.value.replaceChildren(element);
    mountedElement = element;
    syncTheme();
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('modules.loadError');
  }
};

const load = async (): Promise<void> => {
  loading.value = true;
  error.value = '';
  try {
    const modules = await api.get<ModuleSummary[]>('/modules');
    module.value = modules.find(item => normalizePath(item.route) === path.value || item.id === path.value.replace(/^\/modules\//, ''));
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('modules.loadError');
  } finally {
    loading.value = false;
  }

  // The container exists only after the loading branch is removed.
  await nextTick();
  if (module.value) await mountUi();
};

const startModule = async (): Promise<void> => {
  if (!module.value) return;
  starting.value = true;
  error.value = '';
  try {
    if (!module.value.running) {
      await api.post(`/modules/${encodeURIComponent(module.value.id)}/start`);
      window.dispatchEvent(new Event('vuesp:modules-changed'));
    }
    await load();
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('modules.actionError');
  } finally {
    starting.value = false;
  }
};

onMounted(() => {
  themeObserver = new MutationObserver(syncTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
});

watch(() => route.path, () => void load(), { immediate: true });

onBeforeUnmount(() => {
  themeObserver?.disconnect();
  themeObserver = undefined;
  clear();
});
</script>

<style scoped>
.module-host {
  min-height: 200px;
}
</style>
