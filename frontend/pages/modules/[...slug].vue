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
            class="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
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
          variant="outline"
          color="gray"
          size="sm"
          :loading="starting"
          @click="startModule"
        >
          {{ module.running ? t('common.refresh') : t('modules.start') }}
        </VButton>
        <VButton
          variant="outline"
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
        class="module-host min-h-50"
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
import { isAdmin } from '@/utils/auth.ts';
import type { IModuleSummary } from '@/types';

const { t } = useI18n();
const route = useRoute();

const normalizePath = (value: string): string => value.replace(/\/+$/, '') || '/';
const path = computed(() => normalizePath(route.path));
const label = computed(() => path.value.split('/').filter(Boolean).at(-1) ?? path.value);
const module = ref<IModuleSummary>();
const container = ref<HTMLElement>();
/** Modules with their own UI already have a title and controls; keep the header for fallbacks. */
const showHeader = computed(() => !module.value?.web || !module.value.running);
const loading = ref(true);
const starting = ref(false);
const error = ref('');

let frame: HTMLIFrameElement | undefined;
let messageHandler: ((event: MessageEvent) => void) | undefined;
let mountMessage: Record<string, unknown> | undefined;
let themeObserver: MutationObserver | undefined;

const isDark = (): boolean => document.documentElement.classList.contains('dark');

const syncTheme = (): void => {
  frame?.contentWindow?.postMessage({ type: 'theme', value: isDark() ? 'dark' : 'light' }, '*');
};

const clear = (): void => {
  if (messageHandler) window.removeEventListener('message', messageHandler);
  messageHandler = undefined;
  frame?.remove();
  frame = undefined;
  container.value?.replaceChildren();
};

/**
 * Module UI runs inside a sandboxed iframe without `allow-same-origin`: the
 * module gets an opaque origin, so it cannot reach the hub DOM, cookies or
 * localStorage. Only a short-lived module token crosses the boundary.
 */
const mountUi = async (): Promise<void> => {
  const info = module.value;
  if (!info?.web || !container.value) return;

  try {
    const { token } = await api.get<{ token: string }>(`/modules/${encodeURIComponent(info.id)}/token`);
    mountMessage = {
      type: 'mount',
      url: info.web.url,
      element: info.web.element,
      token,
      moduleId: info.id,
      apiBase: `/api/v1/modules/${info.id}/proxy`,
      wsBase: info.web?.ws ?? '',
      theme: isDark() ? 'dark' : 'light',
    };

    const element = document.createElement('iframe');
    element.title = info.name;
    element.className = 'block w-full min-h-50 border-0 bg-transparent';
    element.setAttribute('sandbox', 'allow-scripts');
    const handler = (event: MessageEvent) => {
      if (event.source !== element.contentWindow) return;
      const data = (event.data ?? {}) as Record<string, unknown>;
      if (data.type === 'ready') {
        element.contentWindow?.postMessage(mountMessage, '*');
        return;
      }
      if (data.type === 'mounted') {
        element.dataset.status = 'mounted';
        element.dataset.text = String(data.text ?? '');
        return;
      }
      if (data.type === 'module-error') {
        element.dataset.status = 'error';
        error.value = String(data.message ?? t('modules.loadError'));
      }
    };

    clear();
    messageHandler = handler;
    window.addEventListener('message', handler);
    container.value.replaceChildren(element);
    frame = element;
    element.src = '/module-frame.html';
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('modules.loadError');
  }
};

const load = async (): Promise<void> => {
  loading.value = true;
  error.value = '';
  try {
    const modules = await api.get<IModuleSummary[]>('/modules');
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

