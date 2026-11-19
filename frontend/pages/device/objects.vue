<template>
  <main class="flex-auto w-full max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="[{ name: t('common.home'), path: '/' }, { name: t('objects.title') }]" class="mb-6" />

    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-dark-40 dark:text-white">{{ t('objects.title') }}</h1>
        <p class="mt-2 max-w-2xl text-sm text-gray-dark-25 dark:text-gray-main">{{ t('objects.subtitle') }}</p>
      </div>

      <div class="flex items-center gap-2">
        <label class="relative min-w-0">
          <span class="sr-only">{{ t('objects.search') }}</span>
          <VIcon name="search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-main" />
          <input
            v-model="query"
            type="search"
            :placeholder="t('objects.search')"
            class="h-10 w-full rounded-md border border-gray-light-10 bg-white/70 pl-9 pr-3 text-sm text-gray-dark-40 outline-none transition focus:border-cyan-main dark:border-white/10 dark:bg-white/5 dark:text-white md:w-72"
          />
        </label>
        <select
          v-model="areaFilter"
          class="h-10 rounded-md border border-gray-light-10 bg-white/70 px-3 text-sm text-gray-dark-40 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
          :aria-label="t('areas.title')"
        >
          <option value="">{{ t('areas.title') }}</option>
          <option v-for="area in areas" :key="area.id" :value="String(area.id)">{{ area.name }}</option>
        </select>
        <VButton type="icon" color="gray" :loading="isLoading" :title="t('objects.refresh')" :aria-label="t('objects.refresh')" @click="load">
          <VIcon name="refresh" class="size-4" />
        </VButton>
      </div>
    </div>

    <div v-if="errorMessage" role="alert" class="mb-4 rounded-md border border-red-400/50 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200">
      {{ errorMessage }}
    </div>

    <div v-if="isLoading && !devices.length" class="py-12 text-center text-sm text-gray-dark-25 dark:text-gray-main">
      {{ t('common.refreshing') }}
    </div>

    <div v-else-if="!devices.length" class="py-12 text-center">
      <p class="text-sm font-medium text-gray-dark-40 dark:text-white">{{ t('objects.emptyTitle') }}</p>
      <p class="mt-1 text-sm text-gray-dark-25 dark:text-gray-main">{{ t('objects.emptyHint') }}</p>
    </div>

    <section v-else class="space-y-6">
      <div v-for="group in deviceGroups" :key="group.key" class="space-y-4">
        <h2 class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-main">
          <VIcon name="home" class="size-4" />
          {{ group.name }}
        </h2>

        <VCard v-for="device in group.devices" :key="device.deviceId" :title="device.name">
        <div class="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-dark-25 dark:text-gray-main">
          <span class="inline-flex items-center gap-2 font-medium" :class="device.online ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
            <span class="h-2 w-2 rounded-full" :class="device.online ? 'bg-emerald-500' : 'bg-red-500'" />
            {{ device.online ? t('common.online') : t('common.offline') }}
          </span>
          <span class="text-gray-light-10 dark:text-gray-dark-30">·</span>
          <span>{{ device.ip }}</span>
          <span class="text-gray-light-10 dark:text-gray-dark-30">·</span>
          <span class="break-all">{{ device.deviceId }}</span>
          <span class="text-gray-light-10 dark:text-gray-dark-30">·</span>
          <span>{{ t('objects.entities', { count: device.entities.length }) }}</span>
          <select
            :value="assignmentFor(device)"
            class="h-7 rounded border border-gray-light-10 bg-transparent px-2 text-xs text-gray-dark-25 dark:border-white/10 dark:text-gray-main"
            :aria-label="t('areas.title')"
            @change="assignArea(device, ($event.target as HTMLSelectElement).value)"
          >
            <option value="">{{ t('areas.unassigned') }}</option>
            <option v-for="area in areas" :key="area.id" :value="String(area.id)">{{ area.name }}</option>
          </select>
        </div>

        <div v-if="!device.entities.length" class="py-4 text-sm text-gray-dark-25 dark:text-gray-main">
          {{ t('objects.noEntities') }}
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[44rem] border-collapse text-sm">
            <thead>
              <tr class="border-b border-gray-light-10 text-left text-xs uppercase tracking-wide text-gray-main dark:border-white/10">
                <th class="px-2 py-2 font-medium">{{ t('devices.tableName') }}</th>
                <th class="px-2 py-2 font-medium">Key</th>
                <th class="px-2 py-2 font-medium">Type</th>
                <th class="px-2 py-2 font-medium">Value</th>
                <th class="px-2 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entity in visibleEntities(device)" :key="entity.key" class="border-b border-gray-light-10/60 align-top last:border-0 dark:border-white/5">
                <td class="px-2 py-2 font-medium text-gray-dark-40 dark:text-white">{{ entity.name }}</td>
                <td class="px-2 py-2 font-mono text-xs text-gray-dark-25 dark:text-gray-main">{{ entity.key }}</td>
                <td class="px-2 py-2 text-gray-dark-25 dark:text-gray-main">{{ entity.entityType }}</td>
                <td class="px-2 py-2 text-gray-dark-40 dark:text-white">
                  <span>{{ displayValue(entity) }}</span>
                  <span v-if="entity.set" class="ml-2 text-[10px] uppercase text-gray-main">{{ entity.available ? t('objects.available') : t('objects.unavailable') }}</span>
                </td>
                <td class="px-2 py-2">
                  <span class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium" :class="statusClass(entity)">
                    {{ entity.get?.status ?? 'unknown' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="device.entities.length > ENTITY_PAGE_SIZE" class="mt-3 flex justify-end">
          <button type="button" class="text-xs font-medium text-cyan-main hover:underline" @click="toggleShowAll(device.deviceId)">
            {{ showAll[device.deviceId] ? t('objects.showLess') : t('objects.showAll') }}
          </button>
        </div>
        </VCard>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { BlockBreadcrumb as VBreadcrumb, VButton, VCard, VIcon } from 'vuesp-components/components';

import { useWebSocketStore } from '@/stores/WebSocketStore';
import { api } from '@/utils/helpers.ts';
import type { IArea, IObjectDevice, IObjectEntity, IObjectsSnapshot } from '@/types';

const { t } = useI18n();
const webSocketStore = useWebSocketStore();
const { objectDevices } = storeToRefs(webSocketStore);

const query = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const showAll = ref<Record<string, boolean>>({});
const areas = ref<IArea[]>([]);
const assignments = ref<Record<string, string>>({});
const areaFilter = ref('');
const ENTITY_PAGE_SIZE = 50;

const assignmentFor = (device: IObjectDevice): string => assignments.value[device.deviceId] ?? '';

const deviceGroups = computed(() => {
  const list = devices.value.filter(device => !areaFilter.value || assignmentFor(device) === areaFilter.value);
  const groups = new Map<string, { key: string; name: string; devices: IObjectDevice[] }>();
  for (const device of list) {
    const areaId = assignmentFor(device);
    const area = areas.value.find(item => String(item.id) === areaId);
    const key = area ? String(area.id) : 'unassigned';
    const group = groups.get(key) ?? { key, name: area?.name ?? t('areas.unassigned'), devices: [] };
    group.devices.push(device);
    groups.set(key, group);
  }
  return [...groups.values()];
});

const devices = computed(() => {
  const text = query.value.trim().toLowerCase();
  const list = Object.values(objectDevices.value);
  if (!text) return list;

  return list.flatMap(device => {
    if (`${device.name} ${device.ip} ${device.deviceId}`.toLowerCase().includes(text)) return [device];
    const entities = device.entities.filter(entity =>
      `${entity.name} ${entity.key} ${entity.type} ${entity.entityType}`.toLowerCase().includes(text),
    );
    return entities.length ? [{ ...device, entities }] : [];
  });
});

const visibleEntities = (device: IObjectDevice): IObjectEntity[] =>
  showAll.value[device.deviceId] ? device.entities : device.entities.slice(0, ENTITY_PAGE_SIZE);

const toggleShowAll = (deviceId: string): void => {
  showAll.value[deviceId] = !showAll.value[deviceId];
};

const displayValue = (entity: IObjectEntity): string => {
  if (entity.get?.display !== undefined) return String(entity.get.display);
  if (entity.get?.value !== undefined && entity.get.value !== '') return String(entity.get.value);
  return '—';
};

const statusClass = (entity: IObjectEntity): string => {
  switch (entity.get?.status) {
    case 'live': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
    case 'stale': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
    case 'error': return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300';
    default: return 'bg-gray-light-20 text-gray-dark-25 dark:bg-white/10 dark:text-gray-main';
  }
};

const assignArea = async (device: IObjectDevice, areaId: string): Promise<void> => {
  try {
    await api.put('/areas/assignments', { body: JSON.stringify({ targetId: device.deviceId, areaId: areaId || null }) });
    if (areaId) assignments.value[device.deviceId] = areaId;
    else delete assignments.value[device.deviceId];
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('objects.loadError');
  }
};

const load = async (): Promise<void> => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const [response, areaResponse, assignmentResponse] = await Promise.all([
      api.get<IObjectsSnapshot>('/objects'),
      api.get<{ areas: IArea[] }>('/areas'),
      api.get<{ assignments: Record<string, string> }>('/areas/assignments'),
    ]);
    webSocketStore.setObjectDevices(response.devices);
    areas.value = areaResponse.areas;
    assignments.value = assignmentResponse.assignments;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('objects.loadError');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  webSocketStore.connect();
  if (!Object.keys(objectDevices.value).length) void load();
});
</script>
