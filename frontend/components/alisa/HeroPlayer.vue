<template>
  <section class="relative isolate overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020] p-5 text-white shadow-xl sm:p-7">
    <div
      v-if="track.coverUrl"
      class="pointer-events-none absolute inset-0 -z-20 scale-125 bg-cover bg-center opacity-50 blur-3xl"
      :style="{ backgroundImage: `url('${track.coverUrl}')` }"
    />
    <div class="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-indigo-900/70 via-[#0b1020]/85 to-[#0b1020]" />

    <div class="relative flex flex-col gap-5 sm:flex-row sm:items-end">
      <div class="relative mx-auto shrink-0 sm:mx-0">
        <div class="absolute -inset-3 rounded-2xl bg-white/10 blur-2xl" />
        <img
          v-if="track.coverUrl"
          :src="track.coverUrl"
          :alt="track.title"
          class="relative size-36 rounded-xl object-cover shadow-2xl sm:size-48"
        />
        <div v-else class="relative grid size-36 place-items-center rounded-xl bg-white/10 shadow-2xl sm:size-48">
          <IconMusicLine class="size-12 text-white/40" />
        </div>
      </div>

      <div class="min-w-0 flex-1 text-center sm:text-left">
        <p class="text-[10px] font-semibold tracking-[0.25em] uppercase" :class="wave ? 'text-amber-300' : 'text-white/50'">
          {{ wave ? t('alisa.myWave') : t('alisa.nowPlaying') }}
        </p>
        <h2 class="mt-2 line-clamp-2 text-2xl leading-tight font-bold sm:text-4xl">{{ track.title }}</h2>
        <p class="mt-2 truncate text-sm text-white/60 sm:text-base">{{ track.artists || '—' }}</p>

        <div class="mt-4">
          <div class="h-1 overflow-hidden rounded-full bg-white/15">
            <div class="h-full rounded-full bg-white/90 transition-all" :style="{ width: `${progressPercent}%` }" />
          </div>
          <div class="mt-1 flex items-center justify-between text-[10px] tabular-nums text-white/45">
            <span>{{ formatTime(track.progress) }}</span>
            <span>{{ formatTime(track.duration) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="relative mt-5 flex flex-wrap items-center gap-3">
      <button
        type="button"
        class="grid size-9 place-items-center rounded-full border border-white/15 text-white/70 transition hover:border-white/40 hover:text-white"
        :class="liked ? 'border-rose-400/50 text-rose-400' : ''"
        :title="liked ? t('alisa.unlike') : t('alisa.like')"
        @click="emit('like')"
      >
        <IconHeartFill v-if="liked" class="size-4" />
        <IconHeartLine v-else class="size-4" />
      </button>

      <div class="ml-auto flex items-center gap-3 sm:ml-0 sm:flex-1 sm:justify-center">
        <button
          type="button"
          class="grid size-9 place-items-center text-white/70 transition hover:text-white disabled:opacity-30"
          :disabled="hasPrev === false"
          :title="t('alisa.prev')"
          @click="emit('prev')"
        >
          <IconSkipBackLine class="size-5" />
        </button>
        <button
          type="button"
          class="grid size-14 place-items-center rounded-full bg-white text-black shadow-lg transition hover:scale-105 disabled:opacity-50"
          :disabled="loading"
          :title="playing ? t('alisa.pause') : t('alisa.play')"
          @click="emit('toggle')"
        >
          <IconPauseLine v-if="playing" class="size-6" />
          <IconPlayLine v-else class="size-6 translate-x-0.5" />
        </button>
        <button
          type="button"
          class="grid size-9 place-items-center text-white/70 transition hover:text-white disabled:opacity-30"
          :disabled="hasNext === false"
          :title="t('alisa.next')"
          @click="emit('next')"
        >
          <IconSkipForwardLine class="size-5" />
        </button>
      </div>

      <div v-if="source === 'page'" class="flex items-center gap-2 text-white/60">
        <IconVolumeUpLine class="size-4 shrink-0" />
        <input
          type="range"
          min="0"
          max="100"
          :value="volume ?? 100"
          class="h-1 w-24 cursor-pointer accent-white"
          @input="emit('volume', Number(($event.target as HTMLInputElement).value))"
        />
      </div>

      <span class="rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/45">
        {{ source === 'page' ? t('alisa.sourcePage') : t('alisa.sourceSpeaker') }}
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import IconHeartFill from '~icons/ri/heart-fill';
import IconHeartLine from '~icons/ri/heart-line';
import IconMusicLine from '~icons/ri/music-line';
import IconPauseLine from '~icons/ri/pause-line';
import IconPlayLine from '~icons/ri/play-line';
import IconSkipBackLine from '~icons/ri/skip-back-line';
import IconSkipForwardLine from '~icons/ri/skip-forward-line';
import IconVolumeUpLine from '~icons/ri/volume-up-line';

import type { HeroPlayerEmits, HeroPlayerProps } from './HeroPlayer.types.ts';

const props = defineProps<HeroPlayerProps>();
const emit = defineEmits<HeroPlayerEmits>();
const { t } = useI18n();

const progressPercent = computed(() => {
  if (!props.track.duration) return 0;
  return Math.min(100, Math.max(0, Math.round((props.track.progress / props.track.duration) * 100)));
});

const formatTime = (value: number): string => {
  const total = Math.max(0, Math.round(value || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};
</script>
