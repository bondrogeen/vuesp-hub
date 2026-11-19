<template>
  <main class="flex-auto w-full max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb
      :items="[
        { name: t('common.home'), path: '/' },
        { name: t('panels.title'), path: '/panels/' },
        { name: panel?.name ?? t('panels.editorTitle') },
      ]"
      class="mb-6"
    />

    <div v-if="errorMessage" role="alert" class="mb-4 rounded-md border border-red-400/50 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200">
      {{ errorMessage }}
    </div>

    <div v-if="isLoading" class="py-12 text-center text-sm text-gray-dark-25 dark:text-gray-main">
      {{ t('common.refreshing') }}
    </div>

    <template v-else-if="panel">
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="min-w-0 flex-1">
          <router-link to="/panels/" class="mb-2 inline-flex items-center gap-1 text-xs font-medium text-cyan-main hover:underline">
            <VIcon name="arrow-right" class="size-3 rotate-180" />
            {{ t('panels.back') }}
          </router-link>
          <input
            v-model="panel.name"
            class="w-full border-0 bg-transparent text-2xl font-semibold text-gray-dark-40 outline-none dark:text-white"
            :aria-label="t('panels.name')"
          />
          <p class="mt-1 text-xs text-gray-main">{{ t('panels.widgets', { count: panel.widgets.length }) }}</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <select
            v-model="panel.areaId"
            class="h-10 rounded-md border border-gray-light-10 bg-white/70 px-3 text-sm text-gray-dark-40 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            :aria-label="t('areas.title')"
          >
            <option :value="undefined">{{ t('areas.title') }}</option>
            <option v-for="area in areas" :key="area.id" :value="String(area.id)">{{ area.name }}</option>
          </select>
          <select
            v-model="selectedEntity"
            class="h-10 max-w-72 rounded-md border border-gray-light-10 bg-white/70 px-3 text-sm text-gray-dark-40 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            <option value="">{{ t('panels.chooseEntity') }}</option>
            <option v-for="entity in entities" :key="entity.id" :value="entity.id">
              {{ entity.name }} · {{ entity.key }}
            </option>
          </select>
          <VButton color="blue" :disabled="!selectedEntity" @click="addWidget">{{ t('panels.addEntity') }}</VButton>
          <VButton color="gray" :loading="isSaving" @click="save">{{ t('panels.save') }}</VButton>
        </div>
      </div>

      <p v-if="actionMessage" role="alert" class="mb-4 text-sm text-red-600 dark:text-red-400">{{ actionMessage }}</p>

      <div v-if="!panel.widgets.length" class="py-12 text-center">
        <p class="text-sm font-medium text-gray-dark-40 dark:text-white">{{ t('panels.noWidgets') }}</p>
      </div>

      <section v-else ref="gridElement" class="grid-stack">
        <div
          v-for="widget in panel.widgets"
          :key="widget.id"
          class="grid-stack-item"
          :gs-id="widget.id"
          :gs-x="widget.pos.x"
          :gs-y="widget.pos.y"
          :gs-w="widget.pos.w"
          :gs-h="widget.pos.h"
        >
          <div class="grid-stack-item-content">
            <VCard :title="entityById(widget.entityId)?.name ?? widget.entityId" class="h-full">
              <div class="flex items-start justify-between gap-2">
                <p class="text-xs text-gray-main">{{ widget.type }} · {{ widget.entityId }}</p>
                <button
                  type="button"
                  class="panel-widget-handle -mr-1 -mt-1 cursor-grab rounded p-1 text-gray-main transition hover:bg-gray-light-30 hover:text-gray-dark-30 active:cursor-grabbing dark:hover:bg-white/10 dark:hover:text-white"
                  :aria-label="t('panels.addEntity')"
                  :title="t('panels.addEntity')"
                >
                  <VIcon name="grip" class="size-4" />
                </button>
              </div>
              <p class="mt-2 text-xl font-semibold text-gray-dark-40 dark:text-white">{{ entityValue(widget.entityId) }}</p>
              <template #footer>
                <div class="flex justify-end gap-2">
                  <VButton
                    v-if="widget.type === 'button'"
                    color="blue"
                    :disabled="!entityById(widget.entityId)?.available"
                    :title="t('panels.run')"
                    :aria-label="t('panels.run')"
                    @click="runWidget(widget)"
                  >
                    {{ t('panels.run') }}
                  </VButton>
                  <VButton type="icon" color="gray" :title="t('panels.remove')" :aria-label="t('panels.remove')" @click="removeWidget(widget.id)">
                    <VIcon name="trash" class="size-4" />
                  </VButton>
                </div>
              </template>
            </VCard>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { GridStack, type GridStackWidget } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import { BlockBreadcrumb as VBreadcrumb, VButton, VCard, VIcon } from 'vuesp-components/components';

import { useWebSocketStore } from '@/stores/WebSocketStore';
import { api } from '@/utils/helpers.ts';
import type { IArea, IObjectEntity, IObjectsSnapshot, IPanel, IPanelWidget, TPanelWidgetType } from '@/types';

const { t } = useI18n();
const route = useRoute();
const webSocketStore = useWebSocketStore();
const { objectDevices } = storeToRefs(webSocketStore);

const panel = ref<IPanel | null>(null);
const areas = ref<IArea[]>([]);
const selectedEntity = ref('');
const isLoading = ref(true);
const isSaving = ref(false);
const errorMessage = ref('');
const actionMessage = ref('');
const gridElement = ref<HTMLElement | null>(null);
let grid: GridStack | null = null;
let mobileQuery: MediaQueryList | null = null;

const entities = computed(() => Object.values(objectDevices.value).flatMap(device => device.entities));

const entityById = (id: string): IObjectEntity | undefined => entities.value.find(entity => entity.id === id);

const entityValue = (id: string): string => {
  const entity = entityById(id);
  if (!entity) return '—';
  return String(entity.get?.display ?? entity.get?.value ?? '—');
};

const widgetType = (entity: IObjectEntity): TPanelWidgetType => {
  if (['info', 'button', 'dimmer', 'list', 'input', 'chart'].includes(entity.type)) return entity.type as TPanelWidgetType;
  return entity.get ? 'info' : 'custom';
};

const loadObjects = async (): Promise<void> => {
  webSocketStore.connect();
  if (Object.keys(objectDevices.value).length) return;
  const response = await api.get<IObjectsSnapshot>('/objects');
  webSocketStore.setObjectDevices(response.devices);
};

const syncPositions = (): void => {
  if (!grid || !panel.value || mobileQuery?.matches) return;
  const saved = grid.save(false) as GridStackWidget[];
  for (const item of saved) {
    const widget = panel.value.widgets.find(entry => entry.id === String(item.id));
    if (!widget) continue;
    widget.pos = {
      x: item.x ?? widget.pos.x,
      y: item.y ?? widget.pos.y,
      w: item.w ?? widget.pos.w,
      h: item.h ?? widget.pos.h,
    };
  }
};

const initGrid = async (): Promise<void> => {
  grid?.destroy(false);
  grid = null;
  await nextTick();
  if (!gridElement.value) return;
  grid = GridStack.init({
    column: 12,
    margin: 8,
    cellHeight: 80,
    animate: true,
    draggable: { handle: '.panel-widget-handle' },
    resizable: { handles: 'se,e,s,sw,w' },
  }, gridElement.value);
  if (!grid) return;
  grid.column(mobileQuery?.matches ? 1 : 12);
  grid.on('change', () => syncPositions());
};

const onViewportChange = (): void => {
  grid?.column(mobileQuery?.matches ? 1 : 12);
};

const load = async (): Promise<void> => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const id = Number((route.params as Record<string, string | string[]>).id);
    if (!Number.isInteger(id) || id < 1) throw new Error('Invalid panel');
    const response = await api.get<{ panel: IPanel }>(`/panels/${id}`);
    panel.value = response.panel;
    const areaResponse = await api.get<{ areas: IArea[] }>('/areas');
    areas.value = areaResponse.areas;
    await loadObjects();
    await initGrid();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('panels.loadError');
  } finally {
    isLoading.value = false;
  }
};

const addWidget = (): void => {
  if (!panel.value || !selectedEntity.value) return;
  const entity = entityById(selectedEntity.value);
  if (!entity) return;
  const maxY = panel.value.widgets.reduce((max, widget) => Math.max(max, widget.pos.y + widget.pos.h), 0);
  const widget: IPanelWidget = {
    id: `${entity.key}-${Date.now()}`,
    type: widgetType(entity),
    entityId: entity.id,
    pos: { x: 0, y: maxY, w: 3, h: 2 },
  };
  panel.value.widgets.push(widget);
  selectedEntity.value = '';
  void nextTick(() => initGrid());
};

const runWidget = async (widget: IPanelWidget): Promise<void> => {
  const entity = entityById(widget.entityId);
  if (!entity) return;
  actionMessage.value = '';
  try {
    const value = widget.type === 'button' ? !entity.get?.value : entity.get?.value;
    const result = await api.post<{ status: string; error?: { message?: string } }>('/actions', {
      body: JSON.stringify({
        requestId: crypto.randomUUID(),
        deviceId: entity.deviceId,
        entityKey: entity.key,
        value,
      }),
    });
    if (result.error) actionMessage.value = result.error.message ?? t('panels.saveError');
  } catch (error) {
    actionMessage.value = error instanceof Error ? error.message : t('panels.saveError');
  }
};

const removeWidget = (id: string): void => {
  if (!panel.value) return;
  panel.value.widgets = panel.value.widgets.filter(widget => widget.id !== id);
  void nextTick(() => initGrid());
};

const save = async (): Promise<void> => {
  if (!panel.value || isSaving.value) return;
  isSaving.value = true;
  errorMessage.value = '';
  syncPositions();
  try {
    const response = await api.put<{ panel: IPanel }>(`/panels/${panel.value.id}`, {
      body: JSON.stringify({
        name: panel.value.name,
        areaId: panel.value.areaId,
        icon: panel.value.icon,
        widgets: panel.value.widgets,
      }),
    });
    panel.value = response.panel;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('panels.saveError');
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  mobileQuery = window.matchMedia('(max-width: 767px)');
  mobileQuery.addEventListener('change', onViewportChange);
  void load();
});

onUnmounted(() => {
  mobileQuery?.removeEventListener('change', onViewportChange);
  grid?.destroy(false);
  grid = null;
});
</script>
