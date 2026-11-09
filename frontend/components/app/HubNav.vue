<template>
  <nav class="flex flex-col">
    <div v-for="(group, index) of groups" :key="group.key ?? group.title" :class="compact && index ? 'mt-2 border-t border-gray-200/60 pt-2 dark:border-white/10' : ''">
      <button
        v-if="!compact"
        type="button"
        class="mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
        :aria-expanded="!isCollapsed(group)"
        @click="toggleGroup(group)"
      >
        <span>{{ group.title }}</span>
        <IconChevron class="size-3.5 transition-transform" :class="isCollapsed(group) ? '' : 'rotate-90'" />
      </button>

      <div
        class="nav-collapse"
        :class="{ open: compact || !isCollapsed(group) }"
        :inert="!compact && isCollapsed(group)"
      >
        <div>
          <ul class="space-y-1 pb-1">
            <HubNavItem
              v-for="item of group.items"
              :key="`${item.name}:${item.path ?? ''}`"
              :item="item"
              :level="0"
              :active-path="fullPath"
              :compact="compact"
              @select="onSelect"
            />
          </ul>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';

import type { MenuChildType, MenuItemType, MenuType } from '@/types';
import legacyIcons from '@/components/app/legacyIcons.ts';
import HubNavItem from './HubNavItem.vue';

const props = defineProps<{
  groups: MenuType[];
  isSidebar: boolean;
  fullPath: string;
}>();

const emit = defineEmits<{ sidebar: [value: boolean] }>();

const IconChevron = legacyIcons.IconChevron;
const STORAGE_KEY = 'vuesp.hub.nav.groups';

const isDesktop = ref(false);
const collapsed = reactive<Record<string, boolean>>({});

const groupKey = (group: MenuType): string => group.key ?? group.title;

const compact = computed(() => props.isSidebar && isDesktop.value);

const isCollapsed = (group: MenuType): boolean => Boolean(collapsed[groupKey(group)]);

const itemContainsPath = (item: MenuItemType | MenuChildType, path: string): boolean => {
  if (!item.path) return false;
  if (item.path === '/') return path === '/';
  if (path === item.path || path.startsWith(item.path)) return true;
  return Boolean(item.children?.some(child => itemContainsPath(child, path)));
};

const syncActive = (): void => {
  for (const group of props.groups) {
    if (group.items.some(item => itemContainsPath(item, props.fullPath))) {
      collapsed[groupKey(group)] = false;
    }
  }
};

const persist = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
  } catch {
    // Best-effort preference; private mode must not break navigation.
  }
};

const toggleGroup = (group: MenuType): void => {
  const key = groupKey(group);
  collapsed[key] = !collapsed[key];
  persist();
};

const updateViewport = (): void => {
  if (typeof window === 'undefined') return;
  isDesktop.value = window.matchMedia('(min-width: 1024px)').matches;
};

const onSelect = (): void => {
  if (!isDesktop.value) emit('sidebar', false);
};

const loadCollapsed = (): void => {
  const defaults: Record<string, boolean> = { services: true, settings: true };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    Object.assign(collapsed, raw ? { ...defaults, ...(JSON.parse(raw) as Record<string, boolean>) } : defaults);
  } catch {
    Object.assign(collapsed, defaults);
  }
  syncActive();
};

watch(() => props.fullPath, syncActive);
watch(() => props.groups, syncActive, { deep: true });

onMounted(() => {
  updateViewport();
  loadCollapsed();
  window.addEventListener('resize', updateViewport, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('resize', updateViewport);
});
</script>
