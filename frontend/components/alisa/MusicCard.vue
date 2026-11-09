<template>
  <div
    role="button"
    tabindex="0"
    class="group cursor-pointer overflow-hidden rounded-[10px] border border-gray-200/70 bg-white/40 text-left transition hover:border-primary/40 dark:border-white/10 dark:bg-white/[0.03]"
    @click="emit('open')"
    @keydown.enter="emit('open')"
  >
    <div class="relative aspect-square bg-white/5">
      <img
        v-if="playlist.coverUrl"
        :src="playlist.coverUrl"
        :alt="playlist.title"
        class="size-full object-cover transition duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <span v-else class="grid size-full place-items-center text-gray-400">
        <IconMusicLine class="size-10" />
      </span>
      <button
        type="button"
        class="absolute right-2 bottom-2 grid size-9 place-items-center rounded-full bg-[var(--accent-blue)] text-white opacity-0 shadow transition group-hover:opacity-100"
        :title="t('alisa.playPlaylist')"
        @click.stop="emit('play')"
      >
        <IconPlayLine class="size-4" />
      </button>
    </div>
    <div class="p-3">
      <p class="truncate text-sm font-medium">{{ playlist.title }}</p>
      <p class="mt-1 text-[10px] text-gray-500 dark:text-gray-400">{{ t('alisa.tracksCount', { count: playlist.trackCount }) }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import IconMusicLine from '~icons/ri/music-line';
import IconPlayLine from '~icons/ri/play-line';

import type { MusicCardPlaylist } from './MusicCard.types.ts';

defineProps<{ playlist: MusicCardPlaylist }>();
const emit = defineEmits<{ open: []; play: [] }>();
const { t } = useI18n();
</script>
