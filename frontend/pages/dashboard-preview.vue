<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb
      :items="[{ name: t('common.home'), path: '/' }, { name: t('dashboardPreview.title') }]"
      class="mb-6"
    />

    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold text-gray-dark-40 dark:text-white">
          {{ t('dashboardPreview.title') }}
        </h1>
        <p class="mt-2 max-w-2xl text-sm text-gray-dark-25 dark:text-gray-main">
          {{ t('dashboardPreview.subtitle') }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <span class="glass-inset inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs text-gray-dark-25 dark:text-gray-main">
          <span class="size-1.5 rounded-full bg-emerald-500" />
          {{ t('dashboardPreview.demo') }}
        </span>
        <span class="glass-inset inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs text-gray-dark-25 dark:text-gray-main">
          {{ t('dashboardPreview.tilesCount', { count: tilesCount }) }}
        </span>
        <span class="text-[11px] text-gray-main dark:text-gray-dark-25">
          {{ saving ? t('dashboardPreview.saving') : t('dashboardPreview.saved') }}
        </span>

        <VButton
          type="icon"
          color="gray"
          :aria-label="t('dashboardPreview.add')"
          :title="t('dashboardPreview.add')"
          @click="pickerOpen = true"
        >
          <IconAddLine class="size-5" />
        </VButton>
        <VButton
          type="icon"
          color="gray"
          :aria-label="locked ? t('dashboardPreview.unlock') : t('dashboardPreview.lock')"
          :title="locked ? t('dashboardPreview.unlock') : t('dashboardPreview.lock')"
          @click="toggleLock"
        >
          <IconLockLine
            v-if="locked"
            class="size-5"
          />
          <IconLockUnlockLine
            v-else
            class="size-5"
          />
        </VButton>
        <VButton
          type="icon"
          color="gray"
          :aria-label="t('dashboardPreview.reset')"
          :title="t('dashboardPreview.reset')"
          @click="resetOpen = true"
        >
          <IconRefreshLine class="size-5" />
        </VButton>
      </div>
    </div>

    <p class="mb-3 text-xs text-gray-main dark:text-gray-dark-25">
      {{ t('dashboardPreview.dragHint') }}
    </p>

    <div
      ref="gridElement"
      class="grid-stack pv-grid"
      :class="{ 'pv-locked': locked }"
    />

    <VDialog
      v-if="pickerOpen"
      :title="t('dashboardPreview.addTitle')"
      size="lg"
      @close="pickerOpen = false"
    >
      <div class="grid gap-2 sm:grid-cols-2">
        <button
          v-for="widget of widgetList"
          :key="widget.type"
          type="button"
          class="flex items-start gap-3 rounded-md border border-gray-light-10/70 bg-white/40 p-4 text-left transition hover:border-cyan-main/40 hover:bg-cyan-main/5 dark:border-white/10 dark:bg-white/[0.03]"
          @click="addWidget(widget.type)"
        >
          <span
            class="grid size-10 shrink-0 place-items-center rounded-md"
            :class="`pv-picker-${widget.type}`"
          >
            <component
              :is="widget.icon"
              class="size-5"
            />
          </span>
          <span class="min-w-0">
            <span class="block text-sm font-semibold text-gray-dark-40 dark:text-white">{{ t(widget.label) }}</span>
            <span class="mt-1 block text-xs leading-relaxed text-gray-dark-25 dark:text-gray-main">{{ t(widget.text) }}</span>
          </span>
        </button>
      </div>
    </VDialog>

    <VDialog v-if="resetOpen" :title="t('dashboardPreview.reset')" size="sm" @close="resetOpen = false">
      <p class="text-sm leading-relaxed text-gray-dark-25 dark:text-gray-light-10">
        {{ t('dashboardPreview.resetConfirm') }}
      </p>
      <div class="mt-4 flex flex-wrap justify-end gap-2">
        <VButton outline color="gray" size="sm" @click="resetOpen = false">
          {{ t('common.cancel') }}
        </VButton>
        <VButton color="rose" size="sm" @click="resetLayout">
          {{ t('dashboardPreview.reset') }}
        </VButton>
      </div>
    </VDialog>
  </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, type Component } from 'vue';
import { useI18n } from 'vue-i18n';
import { BlockBreadcrumb as VBreadcrumb, VButton, VDialog } from 'vuesp-components/components';
import { GridStack, type GridStackNode, type GridStackWidget } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import IconAddLine from '~icons/ri/add-line';
import IconBarChartLine from '~icons/ri/bar-chart-line';
import IconGridLine from '~icons/ri/grid-line';
import IconLightbulbLine from '~icons/ri/lightbulb-line';
import IconLockLine from '~icons/ri/lock-line';
import IconLockUnlockLine from '~icons/ri/lock-unlock-line';
import IconPlayCircleLine from '~icons/ri/play-circle-line';
import IconRefreshLine from '~icons/ri/refresh-line';
import IconSensorLine from '~icons/ri/sensor-line';
import IconTempHotLine from '~icons/ri/temp-hot-line';
import IconVideoLine from '~icons/ri/video-line';

type TileType = 'sensor' | 'camera' | 'chart' | 'light' | 'climate' | 'media' | 'group';

interface TileDefinition {
  w: number;
  h: number;
  minW: number;
  minH: number;
  icon: Component;
  label: string;
  text: string;
}

interface TileState {
  on: boolean;
  brightness: number;
  target: number;
  playing: boolean;
  progress: number;
}

interface SavedTile {
  id: string;
  type: TileType;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  children?: SavedTile[];
}

const STORAGE_KEY = 'vuesp.hub.dashboardPreview.v1';
const { t } = useI18n();

const tileDefinitions: Record<TileType, TileDefinition> = {
  sensor: { w: 4, h: 3, minW: 2, minH: 2, icon: IconSensorLine, label: 'dashboardPreview.types.sensor', text: 'dashboardPreview.typeText.sensor' },
  camera: { w: 7, h: 4, minW: 3, minH: 3, icon: IconVideoLine, label: 'dashboardPreview.types.camera', text: 'dashboardPreview.typeText.camera' },
  chart: { w: 5, h: 2, minW: 3, minH: 2, icon: IconBarChartLine, label: 'dashboardPreview.types.chart', text: 'dashboardPreview.typeText.chart' },
  light: { w: 3, h: 2, minW: 2, minH: 2, icon: IconLightbulbLine, label: 'dashboardPreview.types.light', text: 'dashboardPreview.typeText.light' },
  climate: { w: 4, h: 2, minW: 3, minH: 2, icon: IconTempHotLine, label: 'dashboardPreview.types.climate', text: 'dashboardPreview.typeText.climate' },
  media: { w: 5, h: 2, minW: 3, minH: 2, icon: IconPlayCircleLine, label: 'dashboardPreview.types.media', text: 'dashboardPreview.typeText.media' },
  group: { w: 12, h: 5, minW: 4, minH: 4, icon: IconGridLine, label: 'dashboardPreview.types.group', text: 'dashboardPreview.typeText.group' },
};

const widgetList = (Object.entries(tileDefinitions) as Array<[TileType, TileDefinition]>).map(([type, definition]) => ({
  type,
  ...definition,
}));

const gridElement = ref<HTMLElement | null>(null);
const locked = ref(false);
const resetOpen = ref(false);
const pickerOpen = ref(false);
const saving = ref(false);
const tilesCount = ref(0);

let grid: GridStack | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let dataTimer: ReturnType<typeof setInterval> | null = null;
let hydrating = false;

const tileTypes = new Map<string, TileType>();
const tileStates = new Map<string, TileState>();

const demo = reactive({
  temperature: 23.4,
  humidity: 46,
  co2: 612,
  power: 1.8,
  chart: [38, 44, 41, 52, 48, 57, 63, 58, 66, 72, 68, 74, 71, 78, 82, 76, 84, 88, 81, 86, 92, 87, 95, 90],
  cameraTime: '',
  mediaProgress: 32,
});

const isTileType = (value: unknown): value is TileType => typeof value === 'string' && value in tileDefinitions;

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);

const iconPaths: Record<string, string> = {
  sensor: '<path d="M12 3v10a4 4 0 1 0 0 8 4 4 0 0 0 0-8V3Z"/><path d="M12 11v6"/>',
  camera: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  light: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z"/>',
  climate: '<path d="M12 3v18M8 8l4-4 4 4M8 16l4 4 4-4"/>',
  media: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/>',
  group: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  remove: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
};

const icon = (name: string): string =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] ?? iconPaths.sensor}</svg>`;

const stateFor = (id: string): TileState => {
  let state = tileStates.get(id);
  if (!state) {
    state = { on: true, brightness: 70, target: 23, playing: true, progress: demo.mediaProgress };
    tileStates.set(id, state);
  }
  return state;
};

const head = (type: TileType, titleKey: string, subtitleKey: string): string => `
  <div class="pv-head pv-drag">
    <span class="pv-icon pv-icon-${type}">${icon(type)}</span>
    <div class="pv-headtext">
      <p class="pv-title">${escapeHtml(t(titleKey))}</p>
      <p class="pv-sub">${escapeHtml(t(subtitleKey))}</p>
    </div>
    <button type="button" class="pv-remove" data-action="remove" aria-label="${escapeHtml(t('dashboardPreview.remove'))}" title="${escapeHtml(t('dashboardPreview.remove'))}">${icon('remove')}</button>
  </div>`;

const contentFor = (type: TileType, id: string): string => {
  if (type === 'camera') {
    return `<div class="pv-tile pv-camera">
      ${head(type, 'dashboardPreview.tiles.cameraName', 'dashboardPreview.tiles.cameraSub')}
      <div class="pv-cam">
        <span class="pv-cam-grid"></span>
        <span class="pv-cam-scan"></span>
        <span class="pv-live"><span></span>LIVE</span>
        <span class="pv-cam-time" data-bind="cameraTime">${demo.cameraTime}</span>
        <span class="pv-cam-label">CAM 01 · 1080p</span>
      </div>
    </div>`;
  }

  if (type === 'chart') {
    return `<div class="pv-tile">
      ${head(type, 'dashboardPreview.tiles.chartName', 'dashboardPreview.tiles.chartSub')}
      <div class="pv-chart" data-chart></div>
    </div>`;
  }

  if (type === 'sensor') {
    return `<div class="pv-tile">
      ${head(type, 'dashboardPreview.tiles.sensorName', 'dashboardPreview.tiles.sensorSub')}
      <div class="pv-sensor-grid">
        <div><span class="pv-value" data-bind="temperature">${demo.temperature.toFixed(1)}</span><span class="pv-unit">°C</span><p>${escapeHtml(t('dashboardPreview.sensor.temperature'))}</p></div>
        <div><span class="pv-value" data-bind="humidity">${demo.humidity}</span><span class="pv-unit">%</span><p>${escapeHtml(t('dashboardPreview.sensor.humidity'))}</p></div>
        <div><span class="pv-value" data-bind="co2">${demo.co2}</span><span class="pv-unit">ppm</span><p>${escapeHtml(t('dashboardPreview.sensor.co2'))}</p></div>
        <div><span class="pv-value" data-bind="power">${demo.power.toFixed(1)}</span><span class="pv-unit">кВт</span><p>${escapeHtml(t('dashboardPreview.sensor.power'))}</p></div>
      </div>
    </div>`;
  }

  if (type === 'light') {
    const state = stateFor(id);
    return `<div class="pv-tile ${state.on ? 'is-on' : ''}" data-tile-state>
      ${head(type, 'dashboardPreview.tiles.lightName', 'dashboardPreview.tiles.lightSub')}
      <div class="pv-light">
        <div class="pv-light-row">
          <span class="pv-state" data-bind="lightState">${state.on ? 'Вкл' : 'Выкл'}</span>
          <button type="button" class="pv-switch" data-action="light-toggle" role="switch" aria-checked="${state.on}" aria-label="${escapeHtml(t('dashboardPreview.tiles.lightName'))}"><span></span></button>
        </div>
        <div class="pv-range-row">
          <input type="range" min="1" max="100" step="1" value="${state.brightness}" data-action="light-brightness" aria-label="${escapeHtml(t('dashboardPreview.types.light'))}">
          <span data-bind="lightBrightness">${state.brightness}%</span>
        </div>
      </div>
    </div>`;
  }

  if (type === 'climate') {
    const state = stateFor(id);
    return `<div class="pv-tile">
      ${head(type, 'dashboardPreview.tiles.climateName', 'dashboardPreview.tiles.climateSub')}
      <div class="pv-climate">
        <button type="button" class="pv-round" data-action="climate-down" aria-label="-">−</button>
        <span class="pv-value pv-climate-value"><span data-bind="climateTarget">${state.target}</span><span class="pv-unit">°C</span></span>
        <button type="button" class="pv-round" data-action="climate-up" aria-label="+">+</button>
      </div>
    </div>`;
  }

  if (type === 'media') {
    const state = stateFor(id);
    return `<div class="pv-tile">
      ${head(type, 'dashboardPreview.tiles.mediaName', 'dashboardPreview.tiles.mediaSub')}
      <div class="pv-media">
        <span class="pv-cover"><span></span></span>
        <div class="pv-media-body">
          <button type="button" class="pv-round" data-action="media-toggle" aria-label="Play">${icon('media')}</button>
          <div class="pv-progress"><span data-bind="mediaProgress" style="width:${state.progress}%"></span></div>
        </div>
      </div>
    </div>`;
  }

  return `<div class="pv-tile pv-group">
    <div class="pv-group-head pv-drag">
      <span class="pv-icon pv-icon-group">${icon('group')}</span>
      <div class="pv-headtext">
        <p class="pv-title">${escapeHtml(t('dashboardPreview.tiles.groupName'))}</p>
        <p class="pv-sub">${escapeHtml(t('dashboardPreview.tiles.groupSub'))}</p>
      </div>
      <button type="button" class="pv-remove" data-action="remove" aria-label="${escapeHtml(t('dashboardPreview.remove'))}" title="${escapeHtml(t('dashboardPreview.remove'))}">${icon('remove')}</button>
    </div>
    <p class="pv-group-hint">${escapeHtml(t('dashboardPreview.groupHint'))}</p>
  </div>`;
};

const makeId = (type: TileType): string => `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const toWidget = (tile: SavedTile): GridStackWidget => {
  const definition = tileDefinitions[tile.type];
  const children = tile.children?.map(toWidget);
  return {
    id: tile.id,
    x: tile.x,
    y: tile.y,
    w: tile.w ?? definition.w,
    h: tile.h ?? definition.h,
    minW: definition.minW,
    minH: definition.minH,
    autoPosition: tile.x === undefined || tile.y === undefined,
    content: contentFor(tile.type, tile.id),
    ...(children?.length
      ? {
          subGridOpts: {
            column: 12,
            cellHeight: 72,
            margin: 4,
            acceptWidgets: true,
            children,
          },
        }
      : {}),
  };
};

const newTile = (type: TileType, children?: SavedTile[]): SavedTile => {
  const id = makeId(type);
  tileTypes.set(id, type);
  stateFor(id);
  children?.forEach((child) => tileTypes.set(child.id, child.type));
  return { id, type, children };
};

const defaultLayout = (): SavedTile[] => {
  const groupChildren: SavedTile[] = [
    { ...newTile('sensor'), w: 4, h: 3 },
    { ...newTile('light'), w: 4, h: 3 },
    { ...newTile('media'), w: 4, h: 3 },
  ];

  return [
    { ...newTile('camera'), x: 0, y: 0, w: 7, h: 5 },
    { ...newTile('sensor'), x: 7, y: 0, w: 5, h: 3 },
    { ...newTile('chart'), x: 7, y: 3, w: 5, h: 2 },
    { ...newTile('light'), x: 0, y: 5, w: 3, h: 2 },
    { ...newTile('climate'), x: 3, y: 5, w: 4, h: 2 },
    { ...newTile('media'), x: 7, y: 5, w: 5, h: 2 },
    { ...newTile('group', groupChildren), x: 0, y: 7, w: 12, h: 5 },
  ];
};

const refreshCount = (): void => {
  if (!grid) {
    tilesCount.value = 0;
    return;
  }
  let count = 0;
  const walk = (items: GridStackWidget[]): void => {
    for (const item of items) {
      count += 1;
      if (item.subGridOpts?.children) walk(item.subGridOpts.children as GridStackWidget[]);
    }
  };
  walk(grid.save(false) as GridStackWidget[]);
  tilesCount.value = count;
};

const collectTypes = (items: SavedTile[]): void => {
  for (const item of items) {
    tileTypes.set(item.id, item.type);
    stateFor(item.id);
    if (item.children) collectTypes(item.children);
  }
};

const renderLayout = (layout: SavedTile[]): void => {
  if (!grid) return;
  hydrating = true;
  collectTypes(layout);
  grid.removeAll();
  grid.load(layout.map(toWidget));
  refreshCount();
  updateDemo();
  setTimeout(() => {
    hydrating = false;
  }, 250);
};

const readLayout = (): SavedTile[] | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const tiles = parsed.filter((item): item is SavedTile => {
      if (!item || typeof item !== 'object') return false;
      const value = item as SavedTile;
      return typeof value.id === 'string' && isTileType(value.type);
    });
    return tiles.length ? tiles : null;
  } catch {
    return null;
  }
};

const saveLayout = (): void => {
  if (!grid || hydrating) return;
  saving.value = true;
  const data = grid.save(false) as GridStackWidget[];
  const toSaved = (items: GridStackWidget[]): SavedTile[] =>
    items.map((item) => ({
      id: String(item.id ?? ''),
      type: tileTypes.get(String(item.id ?? '')) ?? 'sensor',
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      children: item.subGridOpts?.children ? toSaved(item.subGridOpts.children as GridStackWidget[]) : undefined,
    }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSaved(data)));
  } catch {
    // Preview layout is a convenience; a full localStorage must not break the page.
  }
  window.setTimeout(() => {
    saving.value = false;
  }, 350);
};

const queueSave = (): void => {
  if (hydrating) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveLayout, 300);
};

const addWidget = (type: TileType): void => {
  if (!grid) return;
  const tile = newTile(type);
  grid.addWidget(toWidget(tile));
  pickerOpen.value = false;
  refreshCount();
  updateDemo();
  queueSave();
};

const removeWidget = (id: string): void => {
  const element = gridElement.value?.querySelector<HTMLDivElement>(`[gs-id="${CSS.escape(id)}"]`);
  const node = (element as (HTMLDivElement & { gridstackNode?: GridStackNode }) | null)?.gridstackNode;
  if (!node?.grid) return;
  node.grid.removeWidget(element as HTMLElement);
  refreshCount();
  queueSave();
};

const findItem = (id: string): HTMLElement | null =>
  gridElement.value?.querySelector<HTMLElement>(`[gs-id="${CSS.escape(id)}"]`) ?? null;

const updateLight = (id: string): void => {
  const item = findItem(id);
  if (!item) return;
  const state = stateFor(id);
  item.querySelector('[data-tile-state]')?.classList.toggle('is-on', state.on);
  const label = item.querySelector('[data-bind="lightState"]');
  if (label) label.textContent = state.on ? 'Вкл' : 'Выкл';
  const toggle = item.querySelector<HTMLElement>('[data-action="light-toggle"]');
  toggle?.setAttribute('aria-checked', String(state.on));
  const brightness = item.querySelector('[data-bind="lightBrightness"]');
  if (brightness) brightness.textContent = `${state.brightness}%`;
};

const updateClimate = (id: string): void => {
  const item = findItem(id);
  const target = item?.querySelector('[data-bind="climateTarget"]');
  if (target) target.textContent = String(stateFor(id).target);
};

const updateMedia = (id: string): void => {
  const item = findItem(id);
  const progress = item?.querySelector<HTMLElement>('[data-bind="mediaProgress"]');
  if (progress) progress.style.width = `${stateFor(id).progress}%`;
};

const renderChart = (): void => {
  const max = Math.max(...demo.chart, 1);
  const bars = demo.chart.map((value) => `<span style="height:${Math.round((value / max) * 100)}%"></span>`).join('');
  for (const chart of gridElement.value?.querySelectorAll<HTMLElement>('[data-chart]') ?? []) chart.innerHTML = bars;
};

const updateDemo = (): void => {
  demo.temperature = Number((22 + Math.random() * 4).toFixed(1));
  demo.humidity = Math.round(42 + Math.random() * 12);
  demo.co2 = Math.round(560 + Math.random() * 220);
  demo.power = Number((1.2 + Math.random() * 2.2).toFixed(1));
  demo.chart = [...demo.chart.slice(1), Math.round(35 + Math.random() * 60)];
  demo.cameraTime = new Date().toLocaleTimeString('ru-RU');

  const set = (name: string, value: string): void => {
    for (const element of gridElement.value?.querySelectorAll<HTMLElement>(`[data-bind="${name}"]`) ?? []) element.textContent = value;
  };
  set('temperature', demo.temperature.toFixed(1));
  set('humidity', String(demo.humidity));
  set('co2', String(demo.co2));
  set('power', demo.power.toFixed(1));
  set('cameraTime', demo.cameraTime);
  renderChart();

  for (const [id, type] of tileTypes) {
    if (type !== 'media') continue;
    const state = stateFor(id);
    if (state.playing) {
      state.progress = (state.progress + 0.6) % 100;
      updateMedia(id);
    }
  }
};

const toggleLock = (): void => {
  locked.value = !locked.value;
  grid?.setStatic(locked.value);
};

const resetLayout = (): void => {
  resetOpen.value = false;
  localStorage.removeItem(STORAGE_KEY);
  tileTypes.clear();
  tileStates.clear();
  renderLayout(defaultLayout());
  queueSave();
};

const onClick = (event: Event): void => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
  if (!target) return;
  const item = target.closest<HTMLElement>('.grid-stack-item');
  const id = item?.getAttribute('gs-id') ?? '';
  const action = target.dataset.action;

  if (action === 'remove') {
    removeWidget(id);
    return;
  }

  if (action === 'light-toggle') {
    const state = stateFor(id);
    state.on = !state.on;
    updateLight(id);
    return;
  }

  if (action === 'climate-up' || action === 'climate-down') {
    const state = stateFor(id);
    state.target = Math.min(30, Math.max(16, state.target + (action === 'climate-up' ? 1 : -1)));
    updateClimate(id);
    return;
  }

  if (action === 'media-toggle') {
    const state = stateFor(id);
    state.playing = !state.playing;
    updateMedia(id);
  }
};

const onInput = (event: Event): void => {
  const input = event.target as HTMLInputElement;
  if (input.dataset.action !== 'light-brightness') return;
  const item = input.closest<HTMLElement>('.grid-stack-item');
  const id = item?.getAttribute('gs-id') ?? '';
  const state = stateFor(id);
  state.brightness = Number(input.value);
  const brightness = item?.querySelector('[data-bind="lightBrightness"]');
  if (brightness) brightness.textContent = `${state.brightness}%`;
};

onMounted(() => {
  if (!gridElement.value) return;
  // GridStack renders widget.content as text by default; the preview uses
  // trusted local templates, so render them as HTML.
  GridStack.renderCB = (element, widget) => {
    if (element && widget?.content) element.innerHTML = widget.content;
  };
  grid = GridStack.init(
    {
      column: 12,
      cellHeight: 72,
      margin: 8,
      animate: true,
      minRow: 2,
      acceptWidgets: true,
      draggable: { handle: '.pv-drag' },
      resizable: { handles: 'se,e,s,sw,w' },
    },
    gridElement.value,
  );

  if (!grid) return;
  grid.on('change added removed', () => {
    refreshCount();
    queueSave();
  });
  gridElement.value.addEventListener('click', onClick);
  gridElement.value.addEventListener('input', onInput);

  renderLayout(readLayout() ?? defaultLayout());
  dataTimer = setInterval(updateDemo, 2500);
});

onBeforeUnmount(() => {
  if (dataTimer) clearInterval(dataTimer);
  if (saveTimer) clearTimeout(saveTimer);
  gridElement.value?.removeEventListener('click', onClick);
  gridElement.value?.removeEventListener('input', onInput);
  grid?.destroy(false);
  grid = null;
});
</script>

<style>
.pv-grid {
  min-height: 420px;
}

.pv-grid .grid-stack-item > .grid-stack-item-content {
  overflow: hidden;
  border: 1px solid rgb(226 232 240 / 0.8);
  border-radius: 16px;
  background: rgb(255 255 255 / 0.55);
  box-shadow: 0 18px 40px -34px rgb(15 23 42 / 0.6);
}

.dark .pv-grid .grid-stack-item-content {
  border-color: rgb(255 255 255 / 0.1);
  background: rgb(255 255 255 / 0.03);
}

.pv-tile {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 12px;
  color: rgb(30 41 59);
}

.dark .pv-tile {
  color: rgb(226 232 240);
}

.pv-head,
.pv-group-head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
  cursor: grab;
}

.pv-head:active,
.pv-group-head:active {
  cursor: grabbing;
}

.pv-locked .pv-head,
.pv-locked .pv-group-head {
  cursor: default;
}

.pv-headtext {
  min-width: 0;
  flex: 1;
}

.pv-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
}

.pv-sub {
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  color: rgb(100 116 139);
}

.dark .pv-sub {
  color: rgb(148 163 184);
}

.pv-icon {
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  place-items: center;
  border-radius: 10px;
}

.pv-icon svg,
.pv-remove svg {
  width: 17px;
  height: 17px;
}

.pv-icon-sensor { background: rgb(37 99 235 / 0.12); color: rgb(37 99 235); }
.pv-icon-camera { background: rgb(139 92 246 / 0.14); color: rgb(124 58 237); }
.pv-icon-chart { background: rgb(16 185 129 / 0.14); color: rgb(5 150 105); }
.pv-icon-light { background: rgb(245 158 11 / 0.16); color: rgb(217 119 6); }
.pv-icon-climate { background: rgb(249 115 22 / 0.14); color: rgb(234 88 12); }
.pv-icon-media { background: rgb(59 130 246 / 0.14); color: rgb(37 99 235); }
.pv-icon-group { background: rgb(99 102 241 / 0.14); color: rgb(79 70 229); }

.pv-remove {
  display: grid;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  place-items: center;
  border-radius: 6px;
  color: rgb(100 116 139);
  opacity: 0;
  transition: opacity 150ms ease, background-color 150ms ease;
}

.pv-grid .grid-stack-item:hover > .grid-stack-item-content .pv-remove {
  opacity: 1;
}

.pv-remove:hover {
  background: rgb(244 63 94 / 0.12);
  color: rgb(225 29 72);
}

.pv-locked .pv-remove {
  display: none;
}

.pv-value {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.pv-unit {
  margin-left: 3px;
  font-size: 10px;
  font-weight: 600;
  color: rgb(100 116 139);
}

.pv-sensor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.pv-sensor-grid p {
  margin-top: 2px;
  font-size: 10px;
  color: rgb(100 116 139);
}

.dark .pv-sensor-grid p {
  color: rgb(148 163 184);
}

.pv-chart {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  min-height: 0;
  flex: 1;
  margin-top: 12px;
}

.pv-chart span {
  flex: 1;
  border-radius: 2px 2px 1px 1px;
  background: linear-gradient(180deg, rgb(40 183 240 / 0.9), rgb(37 99 235 / 0.35));
}

.pv-cam {
  position: relative;
  min-height: 0;
  flex: 1;
  margin-top: 10px;
  overflow: hidden;
  border-radius: 10px;
  background:
    radial-gradient(circle at 25% 20%, rgb(40 183 240 / 0.22), transparent 45%),
    linear-gradient(145deg, var(--color-night-main), var(--color-night-light-10) 55%, var(--color-night-main));
}

.pv-cam-grid {
  position: absolute;
  inset: 0;
  opacity: 0.14;
  background-image:
    linear-gradient(rgb(148 163 184 / 0.5) 1px, transparent 1px),
    linear-gradient(90deg, rgb(148 163 184 / 0.5) 1px, transparent 1px);
  background-size: 28px 28px;
}

.pv-cam-scan {
  position: absolute;
  inset-inline: 0;
  height: 28%;
  background: linear-gradient(180deg, transparent, rgb(40 183 240 / 0.14), transparent);
  animation: pv-scan 3.2s linear infinite;
}

@keyframes pv-scan {
  from { top: -30%; }
  to { top: 100%; }
}

.pv-live,
.pv-cam-time,
.pv-cam-label {
  position: absolute;
  z-index: 1;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgb(226 232 240);
}

.pv-live {
  top: 10px;
  left: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 9999px;
  background: rgb(15 23 42 / 0.55);
  padding: 4px 8px;
}

.pv-live span {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: rgb(248 113 113);
  box-shadow: 0 0 0 3px rgb(248 113 113 / 0.2);
}

.pv-cam-time {
  top: 10px;
  right: 10px;
  font-variant-numeric: tabular-nums;
}

.pv-cam-label {
  bottom: 10px;
  left: 10px;
  color: rgb(148 163 184);
}

.pv-light,
.pv-climate,
.pv-media {
  margin-top: 10px;
}

.pv-light-row,
.pv-range-row,
.pv-climate,
.pv-media {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pv-state {
  font-size: 12px;
  font-weight: 600;
  color: rgb(100 116 139);
}

.pv-tile.is-on .pv-state {
  color: rgb(217 119 6);
}

.pv-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 40px;
  height: 22px;
  margin-left: auto;
  padding: 2px;
  border-radius: 9999px;
  background: rgb(148 163 184 / 0.45);
  transition: background-color 160ms ease;
}

.pv-switch span {
  display: block;
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  background: var(--color-gray-light-30);
  transition: transform 160ms ease;
}

.pv-switch[aria-checked='true'] {
  background: rgb(245 158 11);
}

.pv-switch[aria-checked='true'] span {
  transform: translateX(18px);
}

.pv-range-row {
  margin-top: 10px;
  font-size: 10px;
  color: rgb(100 116 139);
}

.pv-range-row input[type='range'] {
  min-width: 0;
  flex: 1;
  accent-color: rgb(245 158 11);
}

.pv-climate {
  justify-content: center;
  flex: 1;
}

.pv-climate-value {
  min-width: 84px;
  text-align: center;
}

.pv-round {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 1px solid rgb(226 232 240 / 0.9);
  border-radius: 9999px;
  font-size: 16px;
  color: rgb(71 85 105);
  transition: background-color 150ms ease;
}

.pv-round:hover {
  background: rgb(37 99 235 / 0.08);
}

.dark .pv-round {
  border-color: rgb(255 255 255 / 0.12);
  color: rgb(203 213 225);
}

.pv-round svg {
  width: 17px;
  height: 17px;
}

.pv-media {
  align-items: center;
}

.pv-cover {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  overflow: hidden;
  border-radius: 10px;
  background: linear-gradient(140deg, rgb(59 130 246), rgb(168 85 247));
}

.pv-cover span {
  width: 14px;
  height: 14px;
  border: 2px solid rgb(255 255 255 / 0.8);
  border-radius: 9999px;
}

.pv-media-body {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 8px;
}

.pv-progress {
  height: 4px;
  flex: 1;
  overflow: hidden;
  border-radius: 9999px;
  background: rgb(148 163 184 / 0.25);
}

.pv-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: rgb(59 130 246);
  transition: width 400ms linear;
}

.pv-grid .grid-stack-item-content:has(> .pv-group) {
  display: flex;
  flex-direction: column;
}

.pv-group {
  height: auto;
  flex: 0 0 auto;
  padding: 10px 10px 0;
}

.pv-group-head {
  flex: 0 0 auto;
}

.pv-group-hint {
  margin: 8px 2px 4px;
  font-size: 10px;
  color: rgb(148 163 184);
}

.pv-grid .grid-stack-item-content:has(> .pv-group + .grid-stack .grid-stack-item) .pv-group-hint {
  display: none;
}

.pv-group + .grid-stack {
  min-height: 0;
  flex: 1;
  padding: 0 4px 4px;
}

.pv-group .grid-stack-item-content {
  border-radius: 12px;
  background: rgb(255 255 255 / 0.35);
}

.dark .pv-group .grid-stack-item-content {
  background: rgb(255 255 255 / 0.04);
}

.pv-picker-sensor { background: rgb(37 99 235 / 0.12); color: rgb(37 99 235); }
.pv-picker-camera { background: rgb(139 92 246 / 0.14); color: rgb(124 58 237); }
.pv-picker-chart { background: rgb(16 185 129 / 0.14); color: rgb(5 150 105); }
.pv-picker-light { background: rgb(245 158 11 / 0.16); color: rgb(217 119 6); }
.pv-picker-climate { background: rgb(249 115 22 / 0.14); color: rgb(234 88 12); }
.pv-picker-media { background: rgb(59 130 246 / 0.14); color: rgb(37 99 235); }
.pv-picker-group { background: rgb(99 102 241 / 0.14); color: rgb(79 70 229); }

.grid-stack-placeholder > .placeholder-content {
  border: 1px dashed rgb(37 99 235 / 0.45);
  border-radius: 16px;
  background: rgb(37 99 235 / 0.06);
}
</style>
