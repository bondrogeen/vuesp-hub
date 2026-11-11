<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="breadcrumbs" class="mb-6" />

    <div class="relative flex h-[calc(100dvh-11rem)] min-h-[480px] flex-col overflow-hidden">
      <div
        v-if="isLoading"
        class="absolute inset-0 z-10 flex items-center justify-center bg-white/65 backdrop-blur-sm dark:bg-[#060b28]/80"
      >
        <VLoader />
      </div>

      <div
        v-if="errorMessage"
        class="absolute inset-0 z-10 flex items-center justify-center p-6 text-center text-sm text-red-600 dark:text-red-400"
        role="alert"
      >
        {{ errorMessage }}
      </div>

      <iframe
        v-if="frameSrc"
        ref="deviceFrame"
        :key="frameSrc"
        :src="frameSrc"
        class="h-full w-full"
        frameborder="0"
        @load="onFrameLoad"
      ></iframe>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { BlockBreadcrumb as VBreadcrumb, VLoader } from 'vuesp-components/components';

import { useAppStore } from '@/stores/AppStore';
import { useWebSocketStore } from '@/stores/WebSocketStore';
import { SUPPORTED_LOCALES, getLocale as getHubLocale, setLocale as setHubLocale } from '@/i18n/index.ts';
import type { SupportedLocale } from '@/i18n/index.ts';
import { api } from '@/utils/helpers.ts';
import { getDeviceMenuLabel, normalizeDeviceMenuPath } from '@/utils/deviceMenu.ts';
import type { BreadcrumbType, DeviceRecord, DeviceUiSession } from '@/types';

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const appStore = useAppStore();
const webSocketStore = useWebSocketStore();
const { menus } = storeToRefs(webSocketStore);

const deviceFrame = useTemplateRef<HTMLIFrameElement>('deviceFrame');

const registry = ref<DeviceRecord[]>([]);
const frameSrc = ref('');
const frameOrigin = ref('');
const frameReady = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
let sessionRequest = 0;

const deviceIp = computed(() => {
  const path = route.path.replace(/^\/device\//, '');
  return decodeURIComponent(path.split('/')[0] ?? '');
});

const devicePath = computed(() => {
  const path = route.path.replace(/^\/device\//, '');
  const [, ...segments] = path.split('/');
  return normalizeDeviceMenuPath(segments.join('/'));
});

const deviceSearch = computed(() => route.fullPath.slice(route.path.length));
const deviceFullPath = computed(() => `${devicePath.value}${deviceSearch.value}`);

const runtimeDevice = computed(() => menus.value.find(menu => menu.ip === deviceIp.value));
const registeredDevice = computed(() => registry.value.find(device => device.ip === deviceIp.value));
const deviceId = computed(() => runtimeDevice.value?.recordId ?? registeredDevice.value?.id);
const deviceName = computed(() => runtimeDevice.value?.name ?? registeredDevice.value?.name ?? deviceIp.value);

const currentMenuItem = computed(() => (runtimeDevice.value?.menu ?? []).find(
  item => normalizeDeviceMenuPath(item.path) === devicePath.value,
));

const breadcrumbs = computed(() => {
  const items: BreadcrumbType[] = [
    { name: t('common.devices'), path: '/device/list/' },
    { name: deviceName.value, path: `/device/${encodeURIComponent(deviceIp.value)}/` },
  ];

  if (currentMenuItem.value && devicePath.value !== '/') {
    items.push({ name: getDeviceMenuLabel(currentMenuItem.value.name, t) });
  }

  return items;
});

const postToFrame = (message: unknown): void => {
  const frame = deviceFrame.value;
  frame?.contentWindow?.postMessage(message, '*');
};

const sendRoute = (): void => {
  if (!frameReady.value) return;
  postToFrame({ type: 'route', data: { path: deviceFullPath.value } });
};

const sendTheme = (): void => {
  if (!frameReady.value) return;
  postToFrame({ type: 'theme', value: appStore.theme });
};

const sendLocale = (): void => {
  if (!frameReady.value) return;
  postToFrame({ type: 'locale', value: getHubLocale() });
};

const withLocale = (path: string): string => {
  const url = new URL(path, 'http://device.local');
  url.searchParams.set('locale', getHubLocale());
  return `${url.pathname}${url.search}${url.hash}`;
};

const onFrameLoad = (): void => {
  isLoading.value = false;
  frameReady.value = true;

  window.setTimeout(() => {
    sendRoute();
    sendTheme();
    sendLocale();
  }, 0);
  window.setTimeout(sendRoute, 700);
};

const primeDeviceAuth = async ({ origin, authorization }: DeviceUiSession): Promise<void> => {
  if (!authorization) return;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 3000);

  try {
    // Cross-origin responses are opaque here. The request still verifies the
    // credentials and primes the browser auth cache used by the iframe.
    await fetch(`${origin}/`, {
      headers: { Authorization: authorization },
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal,
    });
  } catch {
    // Expected: the device does not expose CORS headers.
  } finally {
    window.clearTimeout(timeout);
  }
};

const prepareFrame = async (): Promise<void> => {
  const id = deviceId.value;
  if (!id) return;

  const requestId = ++sessionRequest;
  isLoading.value = true;
  errorMessage.value = '';
  frameReady.value = false;
  frameSrc.value = '';
  frameOrigin.value = '';

  try {
    const session = await api.get<DeviceUiSession>(`/device/${id}/ui/`);
    if (requestId !== sessionRequest) return;

    await primeDeviceAuth(session);
    if (requestId !== sessionRequest) return;

    frameOrigin.value = session.origin;
    frameSrc.value = `${session.origin}${withLocale(deviceFullPath.value)}`;
  } catch (error) {
    if (requestId !== sessionRequest) return;
    isLoading.value = false;
    errorMessage.value = error instanceof Error ? error.message : t('devicePage.errors.open');
  }
};

const onMessage = (event: MessageEvent): void => {
  const frame = deviceFrame.value;
  if (!frame || event.source !== frame.contentWindow) return;
  if (frameOrigin.value && event.origin !== frameOrigin.value) return;

  const payload = event.data as { type?: unknown; data?: { path?: unknown }; value?: unknown } | null;

  if (payload?.type === 'vuesp:ready') {
    sendRoute();
    sendTheme();
    sendLocale();
    return;
  }
  if (payload?.type === 'locale') {
    const value = payload.value;
    if (typeof value === 'string' && value !== locale.value && (SUPPORTED_LOCALES as readonly string[]).includes(value)) {
      setHubLocale(value as SupportedLocale);
    }
    return;
  }
  if (payload?.type !== 'route') return;

  const path = payload.data?.path;
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return;

  // The iframe URL carries ?locale for the initial device UI render; keep it
  // out of the hub address bar.
  const url = new URL(path, 'http://device.local');
  url.searchParams.delete('locale');
  const nextPath = `${url.pathname}${url.search}${url.hash}`;
  if (nextPath === deviceFullPath.value) return;

  void router.replace(`/device/${encodeURIComponent(deviceIp.value)}${nextPath}`);
};

const loadRegistry = async (): Promise<void> => {
  try {
    registry.value = await api.get<DeviceRecord[]>('/device/');
  } catch {
    // The runtime menu still lets us resolve the device when the registry is unavailable.
  }
};

watch(deviceId, id => {
  if (id) void prepareFrame();
}, { immediate: true });

watch(deviceFullPath, () => sendRoute());
watch(() => appStore.theme, () => sendTheme());
watch(locale, () => sendLocale());

onMounted(async () => {
  window.addEventListener('message', onMessage);
  await loadRegistry();

  if (!deviceId.value) {
    errorMessage.value = t('devicePage.errors.notRegistered');
  }
});

onUnmounted(() => {
  window.removeEventListener('message', onMessage);
  sessionRequest += 1;
});
</script>
