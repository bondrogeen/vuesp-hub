<template>
  <li>
    <div
      class="group relative flex items-center rounded-md transition-colors"
      :class="[
        active
          ? 'bg-gradient-to-r from-primary/15 via-primary/5 to-transparent text-primary before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary'
          : 'text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/5',
        compact ? 'lg:justify-center lg:px-2' : '',
      ]"
    >
      <router-link
        v-if="item.path"
        :to="item.path"
        class="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2"
        :class="compact ? 'lg:justify-center lg:px-0' : ''"
        :title="compact ? item.name : undefined"
        @click="emit('select')"
      >
        <component :is="iconComponent" class="size-5 shrink-0 opacity-70" />
        <span v-if="!compact" class="min-w-0 flex-1 truncate text-sm">{{ item.name }}</span>
      </router-link>

      <button
        v-else
        type="button"
        class="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left"
        :class="compact ? 'lg:justify-center lg:px-0' : ''"
        :title="compact ? item.name : undefined"
        @click="toggle"
      >
        <component :is="iconComponent" class="size-5 shrink-0 opacity-70" />
        <span v-if="!compact" class="min-w-0 flex-1 truncate text-sm">{{ item.name }}</span>
      </button>

      <button
        v-if="hasChildren && !compact"
        type="button"
        class="mr-1 grid size-7 shrink-0 place-items-center rounded text-gray-400 transition hover:text-primary"
        :aria-expanded="open"
        :aria-label="item.name"
        @click.prevent.stop="toggle"
      >
        <IconChevron class="size-4 transition-transform" :class="open ? 'rotate-90' : ''" />
      </button>
    </div>

    <div v-if="hasChildren && !compact" class="nav-collapse" :class="{ open }" :inert="!open">
      <div>
        <ul class="mt-1 ml-3 space-y-1 border-l border-gray-200/70 pb-1 pl-2 dark:border-white/10">
          <HubNavItem
            v-for="child of item.children"
            :key="`${child.name}:${child.path ?? ''}`"
            :item="child"
            :level="level + 1"
            :active-path="activePath"
            :compact="compact"
            @select="emit('select')"
          />
        </ul>
      </div>
    </div>
  </li>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Component } from 'vue';

import type { MenuChildType, MenuItemType } from '@/types';
import legacyIcons from '@/components/app/legacyIcons.ts';

defineOptions({ name: 'HubNavItem' });

const IconChevron = legacyIcons.IconChevron;

const props = defineProps<{
  item: MenuItemType | MenuChildType;
  level: number;
  activePath: string;
  compact: boolean;
}>();

const emit = defineEmits<{ select: [] }>();

const iconComponent = computed<Component>(() => {
  const icons = legacyIcons as Record<string, Component>;
  return icons[props.item.icon ?? 'IconDevice'] ?? icons.IconDevice;
});

const hasChildren = computed(() => Boolean(props.item.children?.length));
const open = ref(false);

const itemContainsPath = (item: MenuItemType | MenuChildType, path: string): boolean => {
  if (!item.path) return false;
  if (item.path === '/') return path === '/';
  if (path === item.path || path.startsWith(item.path)) return true;
  return Boolean(item.children?.some(child => itemContainsPath(child, path)));
};

const active = computed(() => {
  const path = props.item.path;
  if (!path) return false;
  if (path === '/') return props.activePath === '/';
  return props.activePath === path || props.activePath.startsWith(path);
});

const branchActive = computed(() => Boolean(props.item.children?.some(child => itemContainsPath(child, props.activePath))));

const toggle = (): void => {
  if (hasChildren.value) open.value = !open.value;
};

watch(
  [active, branchActive],
  ([isActive, isBranchActive]) => {
    if ((isActive || isBranchActive) && hasChildren.value) open.value = true;
  },
  { immediate: true }
);
</script>
