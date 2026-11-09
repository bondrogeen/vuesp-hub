<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="[{ name: t('common.home'), path: '/' }, { name: t('alisa.title') }]" class="mb-6" />

    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">{{ t('alisa.title') }}</h1>
        <p class="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{{ t('alisa.subtitle') }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <VButton color="blue" size="sm" @click="accountsOpen = true">
          {{ state?.token ? t('alisa.manageAccounts') : t('alisa.connectAccount') }}
        </VButton>
        <VButton outline color="gray" size="sm" :loading="loadingState" @click="refresh()">{{ t('common.refresh') }}</VButton>
      </div>
    </div>

    <div v-if="error" class="mb-4 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
      {{ error }}
    </div>

    <VDialog v-if="accountsOpen" :title="t('alisa.account')" size="lg" @close="accountsOpen = false">
      <div v-if="!state?.token" class="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div class="flex flex-col items-center gap-3">
          <img v-if="qr" :src="qr.qrImage" :alt="t('alisa.qrTitle')" class="size-56 rounded-md bg-white p-2" />
          <div v-else class="grid size-56 place-items-center rounded-md bg-white/5 px-4 text-center text-xs text-gray-500 dark:text-gray-400">
            {{ t('alisa.qrPlaceholder') }}
          </div>
          <VButton color="blue" size="sm" :loading="qrLoading" @click="startQr">
            {{ qr ? t('alisa.qrRefresh') : t('alisa.qrStart') }}
          </VButton>
        </div>

        <div class="space-y-3">
          <p class="text-sm font-medium">{{ t('alisa.qrTitle') }}</p>
          <ol class="list-decimal space-y-1 pl-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            <li>{{ t('alisa.qrStep1') }}</li>
            <li>{{ t('alisa.qrStep2') }}</li>
            <li>{{ t('alisa.qrStep3') }}</li>
          </ol>
          <p v-if="qr" class="text-xs leading-relaxed text-emerald-600 dark:text-emerald-400">{{ t('alisa.qrWaiting') }}</p>
          <p v-if="qrError" class="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">{{ qrError }}</p>

          <details class="rounded-md border border-gray-200/70 p-3 dark:border-white/10">
            <summary class="cursor-pointer text-xs font-medium text-gray-600 dark:text-gray-300">{{ t('alisa.manualToken') }}</summary>
            <div class="mt-3 flex items-center gap-2">
              <VTextField v-model="manualToken" :label="t('alisa.token')" class="min-w-0 flex-1" hide-message />
              <VButton outline color="gray" size="sm" class="h-9 shrink-0" :loading="currentAction === 'manual-init'" :disabled="!manualToken" @click="manualInit">{{ t('alisa.connect') }}</VButton>
            </div>
          </details>
        </div>
      </div>

      <div v-else class="space-y-4">
        <div class="space-y-2">
          <div
            v-for="account of state.accounts"
            :key="account.id"
            class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200/70 px-3 py-2 dark:border-white/10"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-medium">{{ account.login || (account.id === 'legacy' ? t('alisa.account') : account.id) }}</p>
              <p class="text-[10px] text-gray-500 dark:text-gray-400">
                {{ t('alisa.devicesCount', { count: account.devicesCount }) }}
                <span v-if="account.initError"> · {{ account.initError }}</span>
              </p>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <VButton outline color="gray" size="sm" :loading="currentAction === `connect:${account.id}`" @click="connectAccount(account.id)">{{ t('alisa.connect') }}</VButton>
              <VButton outline color="gray" size="sm" :loading="currentAction === `disconnect:${account.id}`" @click="disconnectAccount(account.id)">{{ t('alisa.disconnect') }}</VButton>
              <VButton outline color="gray" size="sm" :loading="currentAction === `forget:${account.id}`" @click="forgetAccount(account.id)">{{ t('alisa.forget') }}</VButton>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <VButton color="blue" size="sm" :loading="currentAction === 'scan'" @click="scan">{{ t('alisa.scan') }}</VButton>
          <VButton outline color="gray" size="sm" :loading="currentAction === 'connect-all'" @click="connect">{{ t('alisa.connectAll') }}</VButton>
          <VButton outline color="gray" size="sm" :loading="currentAction === 'disconnect-all'" @click="disconnect">{{ t('alisa.disconnectAll') }}</VButton>
          <VButton color="blue" size="sm" :loading="qrLoading" @click="startQr">{{ t('alisa.addAccount') }}</VButton>
        </div>

        <div v-if="qr" class="grid gap-6 border-t border-gray-200/70 pt-4 lg:grid-cols-[200px_minmax(0,1fr)] dark:border-white/10">
          <img :src="qr.qrImage" :alt="t('alisa.qrTitle')" class="size-48 rounded-md bg-white p-2" />
          <div class="space-y-2">
            <p class="text-sm font-medium">{{ t('alisa.addAccountQr') }}</p>
            <p class="text-xs leading-relaxed text-gray-500 dark:text-gray-400">{{ t('alisa.qrWaiting') }}</p>
            <p v-if="qrError" class="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">{{ qrError }}</p>
            <VButton outline color="gray" size="sm" :loading="qrLoading" @click="startQr">{{ t('alisa.qrRefresh') }}</VButton>
          </div>
        </div>

        <div v-if="scanDevices.length" class="border-t border-gray-200/70 pt-4 dark:border-white/10">
          <p class="mb-2 text-sm font-medium">{{ t('alisa.found') }}</p>
          <div class="grid gap-2 sm:grid-cols-2">
            <div v-for="device of scanDevices" :key="device.id" class="rounded-md bg-white/5 p-3 text-sm">
              <p class="font-medium">{{ device.platform }}</p>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ device.ip }}:{{ device.port }}</p>
              <p class="mt-1 break-all font-mono text-[10px] text-gray-400">{{ device.id }}</p>
            </div>
          </div>
        </div>

        <p v-if="state.initError" class="rounded-md border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">{{ state.initError }}</p>
        <p v-if="state.persisted === false" class="rounded-md border border-amber-400/30 bg-amber-400/5 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">{{ t('alisa.notPersisted') }}</p>
      </div>
    </VDialog>

    <CardMain v-if="state?.token" :title="t('alisa.music')" :loading="musicLoading" class="mt-4">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="relative">
          <button
            type="button"
            class="inline-flex h-9 max-w-full items-center gap-2 rounded-md border border-gray-200/70 bg-white/40 px-3 text-sm transition hover:border-primary/40 dark:border-white/10 dark:bg-white/[0.03]"
            :title="t('alisa.chooseSpeaker')"
            @click="targetMenuOpen = !targetMenuOpen"
          >
            <IconVolumeUpLine class="size-4 shrink-0 text-primary" />
            <span class="min-w-0 truncate">{{ targetLabel }}</span>
            <IconArrowDownSLine class="size-4 shrink-0" />
          </button>

          <div v-if="targetMenuOpen" class="fixed inset-0 z-10" @click="targetMenuOpen = false" />
          <TargetMenu
            v-if="targetMenuOpen"
            class="absolute top-11 left-0 z-20"
            :accounts="accountGroups"
            :selected-account="selectedAccount"
            :selected-speaker="selectedSpeaker"
            @select="selectTarget"
          />
        </div>

        <div class="inline-flex overflow-hidden rounded-md border border-gray-200/70 text-xs dark:border-white/10">
          <button
            type="button"
            class="px-3 py-2 font-medium transition"
            :class="playbackSource === 'speaker' ? 'bg-[var(--accent-blue)] text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'"
            @click="setPlaybackSource('speaker')"
          >
            {{ t('alisa.sourceSpeaker') }}
          </button>
          <button
            type="button"
            class="px-3 py-2 font-medium transition"
            :class="playbackSource === 'page' ? 'bg-[var(--accent-blue)] text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'"
            @click="setPlaybackSource('page')"
          >
            {{ t('alisa.sourcePage') }}
          </button>
        </div>
      </div>

      <p v-if="musicError" class="mb-3 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">{{ musicError }}</p>

      <div
        v-if="pageTrack"
        class="mb-4 flex flex-wrap items-center gap-3 rounded-md border p-3 transition-colors"
        :class="pagePlaying ? 'border-emerald-400/30 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02]'"
      >
        <img v-if="pageTrack.coverUrl" :src="pageTrack.coverUrl" alt="" class="size-12 shrink-0 rounded object-cover" loading="lazy" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ pageTrack.title }}</p>
          <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ pageTrack.artists || '—' }}</p>
          <div class="mt-1 flex items-center gap-2">
            <div class="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${pageProgressPercent}%` }" />
            </div>
            <span class="shrink-0 text-[10px] tabular-nums text-gray-500 dark:text-gray-400">
              {{ formatSeconds(pagePosition) }} / {{ formatSeconds(pageDuration || pageTrack.durationMs / 1000) }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <VButton color="blue" size="sm" :loading="pageLoading" @click="togglePagePlay">{{ pagePlaying ? t('alisa.pause') : t('alisa.play') }}</VButton>
          <VButton outline color="gray" size="sm" @click="stopPage">{{ t('alisa.stop') }}</VButton>
        </div>
      </div>
      <p v-if="pageError" class="mb-3 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">{{ pageError }}</p>

      <div
        v-if="selectedDevice && selectedPlayer?.title"
        class="mb-4 flex flex-wrap items-center gap-3 rounded-md border p-3 transition-colors"
        :class="isSelectedPlaying ? 'border-emerald-400/30 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02]'"
      >
        <img v-if="selectedCover" :src="selectedCover" alt="" class="size-12 shrink-0 rounded object-cover" loading="lazy" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ selectedPlayer.title }}</p>
          <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ selectedPlayer.subtitle || '—' }}</p>
          <div v-if="selectedPlayer.duration" class="mt-1 flex items-center gap-2">
            <div class="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${selectedProgressPercent}%` }" />
            </div>
            <span class="shrink-0 text-[10px] tabular-nums text-gray-500 dark:text-gray-400">
              {{ formatSeconds(selectedPlayer.progress ?? 0) }} / {{ formatSeconds(selectedPlayer.duration) }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] text-gray-500 dark:text-gray-400">{{ isSelectedPlaying ? t('alisa.playing') : t('alisa.paused') }}</span>
          <VButton color="blue" size="sm" @click="toggleSelectedPlay">{{ isSelectedPlaying ? t('alisa.pause') : t('alisa.play') }}</VButton>
        </div>
      </div>

      <template v-if="openedPlaylist">
        <button type="button" class="mb-4 inline-flex items-center gap-1.5 text-xs text-gray-500 transition hover:text-white" @click="closePlaylist">
          <IconArrowLeftLine class="size-4 shrink-0" />
          <span>{{ t('alisa.backToPlaylists') }}</span>
        </button>

        <div class="mb-5 flex flex-col gap-4 sm:flex-row">
          <div class="size-40 shrink-0 overflow-hidden rounded-lg bg-white/5">
            <img v-if="openedPlaylist.coverUrl" :src="openedPlaylist.coverUrl" :alt="openedPlaylist.title" class="size-full object-cover" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[11px] tracking-wide text-gray-500 uppercase">{{ t('alisa.playlist') }}</p>
            <h3 class="mt-1 text-2xl font-bold">{{ openedPlaylist.title }}</h3>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ t('alisa.tracksCount', { count: openedPlaylist.trackCount }) }}
              · {{ playbackSource === 'page' ? t('alisa.sourcePage') : selectedSpeakerName || t('alisa.noSpeaker') }}
            </p>
            <div class="relative mt-3 inline-flex items-center">
              <button
                type="button"
                class="grid h-10 w-12 place-items-center rounded-l-md bg-[var(--accent-blue)] text-white transition disabled:opacity-40"
                :disabled="playbackSource === 'speaker' && !selectedSpeaker"
                :title="t('alisa.playPlaylist')"
                @click="playPlaylist(openedPlaylist)"
              >
                <IconPlayLine class="size-5" />
              </button>
              <button
                type="button"
                class="grid h-10 w-8 place-items-center rounded-r-md border-l border-white/20 bg-[var(--accent-blue)] text-white transition hover:brightness-110"
                :title="t('alisa.chooseSpeaker')"
                @click="playMenuOpen = !playMenuOpen"
              >
                <IconArrowDownSLine class="size-4" />
              </button>

              <div v-if="playMenuOpen" class="fixed inset-0 z-10" @click="playMenuOpen = false" />
              <TargetMenu
                v-if="playMenuOpen"
                class="absolute top-11 left-0 z-20"
                :accounts="accountGroups"
                :selected-account="selectedAccount"
                :selected-speaker="selectedSpeaker"
                @select="playPlaylistOn"
              />
            </div>
          </div>
        </div>

        <p v-if="tracksError" class="mb-3 rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">{{ tracksError }}</p>
        <p v-if="tracksLoading" class="py-6 text-center text-sm text-gray-500 dark:text-gray-400">{{ t('alisa.loadingTracks') }}</p>
        <p v-else-if="!tracks.length" class="py-6 text-center text-sm text-gray-500 dark:text-gray-400">{{ t('alisa.noTracks') }}</p>
        <div v-else class="overflow-hidden rounded-md border border-gray-200/70 dark:border-white/10">
          <button
            v-for="(track, index) in tracks"
            :key="track.id"
            type="button"
            class="group flex w-full items-center gap-3 border-b border-gray-200/60 px-3 py-2 text-left transition last:border-0 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/5"
            :disabled="!track.available"
            @click="playTrack(track)"
          >
            <span class="w-6 shrink-0 text-right text-xs tabular-nums text-gray-500">{{ index + 1 }}</span>
            <img v-if="track.coverUrl" :src="track.coverUrl" alt="" class="size-10 shrink-0 rounded object-cover" loading="lazy" />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium">{{ track.title }}</span>
              <span class="block truncate text-xs text-gray-500 dark:text-gray-400">{{ track.artists || '—' }}</span>
            </span>
            <span class="shrink-0 text-xs tabular-nums text-gray-500">{{ formatDuration(track.durationMs) }}</span>
            <span class="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary opacity-0 transition group-hover:opacity-100">
              <IconPlayLine class="size-4" />
            </span>
          </button>
        </div>
      </template>

      <template v-else>
        <template v-if="collectionGroups.length">
          <div v-for="group of collectionGroups" :key="group.source" class="mb-6">
            <p class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">{{ group.source }}</p>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <MusicCard
                v-for="collection of group.items"
                :key="collection.id"
                :playlist="collection"
                @open="openPlaylist(collection)"
                @play="playPlaylist(collection)"
              />
            </div>
          </div>
        </template>

        <p class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">{{ t('alisa.myPlaylists') }}</p>
        <p v-if="!playlists.length && !musicLoading" class="text-sm text-gray-500 dark:text-gray-400">{{ t('alisa.noPlaylists') }}</p>

        <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <MusicCard
            v-for="playlist of playlists"
            :key="playlist.id"
            :playlist="playlist"
            @open="openPlaylist(playlist)"
            @play="playPlaylist(playlist)"
          />
        </div>
      </template>
    </CardMain>

    <CardMain :title="t('alisa.devices')" :loading="currentAction === 'scan'" class="mt-4">
      <p v-if="!devices.length" class="text-sm text-gray-500 dark:text-gray-400">{{ t('alisa.empty') }}</p>

      <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="device of devices" :key="`${device.accountId ?? 'local'}:${device.id}`" class="rounded-[10px] border border-gray-200/70 bg-white/40 p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <h3 class="truncate text-sm font-semibold">{{ platformName(device.platform) }}</h3>
              <p class="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{{ device.ip }}:{{ device.port }}</p>
              <p v-if="device.accountLogin" class="mt-1 truncate text-[10px] text-gray-400">{{ device.accountLogin }}</p>
              <span
                class="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]"
                :class="isPlaying(device) ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'"
              >
                <span class="size-1.5 rounded-full" :class="isPlaying(device) ? 'bg-emerald-500' : 'bg-gray-400'" />
                {{ isPlaying(device) ? t('alisa.playing') : t('alisa.paused') }}
              </span>
            </div>
          </div>

          <div class="mt-3 rounded-md bg-white/5 p-3 text-xs text-gray-600 dark:text-gray-300">
            <div class="flex items-center gap-3">
              <img v-if="coverUrl(device)" :src="coverUrl(device)" alt="" class="size-12 shrink-0 rounded object-cover" loading="lazy" />
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium">{{ playerTitle(device) || t('alisa.nothingPlaying') }}</p>
                <p class="mt-1 truncate text-[10px] text-gray-500 dark:text-gray-400">
                  {{ playerSubtitle(device) || playerState(device) || '—' }}
                </p>
                <p v-if="playerDuration(device)" class="mt-1 text-[10px] tabular-nums text-gray-500 dark:text-gray-400">
                  {{ formatSeconds(playerProgress(device)) }} / {{ formatSeconds(playerDuration(device)) }}
                </p>
                <div v-if="playerDuration(device)" class="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${playerProgressPercent(device)}%` }" />
                </div>
              </div>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap gap-1.5">
            <VButton color="blue" size="sm" :disabled="isPlaying(device)" @click="send(device, { command: 'play' })">{{ t('alisa.play') }}</VButton>
            <VButton outline color="gray" size="sm" :disabled="!isPlaying(device)" @click="send(device, { command: 'stop' })">{{ t('alisa.pause') }}</VButton>
            <VButton outline color="gray" size="sm" :disabled="!playerHasNext(device)" @click="send(device, { command: 'next' })">{{ t('alisa.next') }}</VButton>
            <VButton outline color="gray" size="sm" :disabled="!playerHasPrev(device)" @click="send(device, { command: 'prev' })">{{ t('alisa.prev') }}</VButton>
          </div>

          <div class="mt-3 flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              :value="volume(device)"
              class="w-full accent-[var(--app-accent)]"
              @input="onVolumeInput(device, $event)"
              @change="onVolumeChange(device, $event)"
            />
            <span class="w-9 text-right text-[10px] text-gray-500 dark:text-gray-400">{{ volume(device) }}%</span>
          </div>

          <div class="mt-3 flex items-stretch gap-2">
            <VTextField v-model="tts" :label="t('alisa.tts')" class="min-w-0 flex-1 [&>label]:h-9" hide-message />
            <VButton outline color="gray" size="sm" class="h-9 shrink-0" :disabled="!tts" @click="sendTts(device)">{{ t('alisa.say') }}</VButton>
          </div>
        </article>
      </div>
    </CardMain>

    <audio
      ref="pageAudio"
      class="hidden"
      preload="metadata"
      @loadedmetadata="onPageLoaded"
      @timeupdate="onPageTimeUpdate"
      @play="pagePlaying = true"
      @pause="pagePlaying = false"
      @ended="onPageEnded"
    />

  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { BlockBreadcrumb as VBreadcrumb, CardMain, VButton, VDialog, VTextField } from 'vuesp-components/components';
import IconArrowDownSLine from '~icons/ri/arrow-down-s-line';
import IconArrowLeftLine from '~icons/ri/arrow-left-line';
import IconPlayLine from '~icons/ri/play-line';
import IconVolumeUpLine from '~icons/ri/volume-up-line';

import TargetMenu from '@/components/alisa/TargetMenu.vue';
import MusicCard from '@/components/alisa/MusicCard.vue';
import HeroPlayer from '@/components/alisa/HeroPlayer.vue';
import type { HeroTrack } from '@/components/alisa/HeroPlayer.types.ts';
import { api } from '@/utils/helpers.ts';

interface AlisaDevice {
  id: string;
  ip: string;
  platform: string;
  port: number;
  connected: boolean;
  accountId?: string;
  accountLogin?: string | null;
}

interface AlisaAccountState {
  id: string;
  login: string | null;
  token: boolean;
  devicesCount: number;
  initError: string | null;
  persisted: boolean;
  persistError: string | null;
}

interface AlisaMessage {
  id: string;
  ip: string;
  platform: string;
  port: number;
  connected: boolean;
  type: string;
  data?: {
    state?: {
      aliceState?: string;
      playing?: boolean;
      volume?: number;
      playerState?: {
        id?: string | number;
        title?: string;
        subtitle?: string;
        duration?: number;
        progress?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
        hasPause?: boolean;
        hasPlay?: boolean;
        hasProgressBar?: boolean;
        playlistId?: string;
        playlistType?: string;
        liveStreamText?: string;
        extra?: { coverURI?: string };
      };
    };
  };
}

interface AlisaMusicPlaylist {
  id: string;
  title: string;
  trackCount: number;
  coverUrl: string | null;
}

interface AlisaMusicCollection extends AlisaMusicPlaylist {
  source: string;
}

interface AlisaMusicTrack {
  id: string;
  title: string;
  artists: string;
  durationMs: number;
  coverUrl: string | null;
  available: boolean;
  liked?: boolean;
}

interface AlisaState {
  token: boolean;
  accounts: AlisaAccountState[];
  devices: AlisaDevice[];
  localDevices: AlisaDevice[];
  cloudDevices: unknown[];
  data: Record<string, AlisaMessage>;
  configured: boolean;
  qrEnabled: boolean;
  login: string | null;
  expiresAt: string | null;
  persisted: boolean;
  initError: string | null;
  persistError: string | null;
}

const { t } = useI18n();

interface AlisaPageCache {
  at: number;
  state: AlisaState | null;
  playlists: AlisaMusicPlaylist[];
  collections: AlisaMusicCollection[];
  playbackSource: 'speaker' | 'page';
  selectedAccount: string;
  selectedSpeaker: string;
  openedPlaylist: AlisaMusicPlaylist | null;
  openedPlaylistAccount: string;
  tracks: AlisaMusicTrack[];
}

const ALISA_CACHE_KEY = 'vuesp.alisa.cache.v1';

const readAlisaCache = (): AlisaPageCache | null => {
  try {
    const raw = typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(ALISA_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AlisaPageCache;
  } catch {
    return null;
  }
};

const state = ref<AlisaState | null>(null);
const scanDevices = ref<AlisaDevice[]>([]);
const playlists = ref<AlisaMusicPlaylist[]>([]);
const collections = ref<AlisaMusicCollection[]>([]);
const openedPlaylist = ref<AlisaMusicPlaylist | null>(null);
const openedPlaylistAccount = ref('');
const accountsOpen = ref(false);
const targetMenuOpen = ref(false);
const playMenuOpen = ref(false);
const tracks = ref<AlisaMusicTrack[]>([]);
const tracksLoading = ref(false);
const tracksError = ref('');
const musicLoading = ref(false);
const musicError = ref('');
const selectedAccount = ref('');
const selectedSpeaker = ref('');
const playbackSource = ref<'speaker' | 'page'>('speaker');
const pageAudio = ref<HTMLAudioElement | null>(null);
const pageQueue = ref<AlisaMusicTrack[]>([]);
const pageIndex = ref(-1);
const pagePlaying = ref(false);
const pageLoading = ref(false);
const pageError = ref('');
const pageDuration = ref(0);
const pagePosition = ref(0);
const pageVolume = ref(100);
const waveMode = ref(false);
const waveLoading = ref(false);
const waveBatchId = ref<string | null>(null);
const likedIds = reactive(new Set<string>());
const manualToken = ref('');
const qr = ref<{ id: string; qrImage: string; expiresAt: number } | null>(null);
const qrLoading = ref(false);
const qrError = ref('');
const tts = ref('');
const currentAction = ref('');
const loadingState = ref(false);
const error = ref('');
let timer: ReturnType<typeof setInterval> | null = null;
let qrTimer: ReturnType<typeof setInterval> | null = null;
let autoConnectTried = false;

const writeAlisaCache = (): void => {
  try {
    if (typeof sessionStorage === 'undefined') return;
    const cache: AlisaPageCache = {
      at: Date.now(),
      state: state.value,
      playlists: playlists.value,
      collections: collections.value,
      playbackSource: playbackSource.value,
      selectedAccount: selectedAccount.value,
      selectedSpeaker: selectedSpeaker.value,
      openedPlaylist: openedPlaylist.value,
      openedPlaylistAccount: openedPlaylistAccount.value,
      tracks: tracks.value,
    };
    sessionStorage.setItem(ALISA_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Cache is best-effort; private mode or a full sessionStorage is not fatal.
  }
};

const devices = computed(() => state.value?.devices ?? []);
const accountGroups = computed(() =>
  (state.value?.accounts ?? []).map((account) => ({
    id: account.id,
    name: account.login || (account.id === 'legacy' ? t('alisa.account') : account.id),
    speakers: devices.value
      .filter((device) => device.accountId === account.id)
      .map((device) => ({ id: device.id, name: `${device.platform} · ${device.ip}` })),
  }))
);
const selectedAccountName = computed(() => accountGroups.value.find((group) => group.id === selectedAccount.value)?.name ?? '');
const selectedSpeakerName = computed(() => {
  const device = devices.value.find((item) => item.id === selectedSpeaker.value);
  return device ? `${device.platform} · ${device.ip}` : '';
});
const targetLabel = computed(() => `${selectedAccountName.value || t('alisa.noAccount')} · ${selectedSpeakerName.value || t('alisa.noSpeaker')}`);
const collectionGroups = computed(() => {
  const groups = new Map<string, AlisaMusicCollection[]>();
  for (const collection of collections.value) {
    const list = groups.get(collection.source) ?? [];
    list.push(collection);
    groups.set(collection.source, list);
  }
  return [...groups.entries()].map(([source, items]) => ({ source, items }));
});
const pageTrack = computed(() => pageQueue.value[pageIndex.value] ?? null);
const pageProgressPercent = computed(() => {
  const duration = pageDuration.value || (pageTrack.value?.durationMs ?? 0) / 1000;
  return duration ? Math.min(100, Math.round((pagePosition.value / duration) * 100)) : 0;
});
const heroTrack = computed<HeroTrack | null>(() => {
  if (playbackSource.value === 'page') {
    const track = pageTrack.value;
    if (!track) return null;
    return {
      id: track.id,
      title: track.title,
      artists: track.artists,
      coverUrl: track.coverUrl,
      duration: pageDuration.value || track.durationMs / 1000,
      progress: pagePosition.value,
    };
  }
  const player = selectedPlayer.value;
  if (!selectedDevice.value || !player?.title) return null;
  return {
    id: player.id !== undefined ? String(player.id) : undefined,
    title: player.title,
    artists: player.subtitle || '',
    coverUrl: selectedCover.value || null,
    duration: player.duration ?? 0,
    progress: player.progress ?? 0,
  };
});
const heroPlaying = computed(() => (playbackSource.value === 'page' ? pagePlaying.value : isSelectedPlaying.value));
const heroWave = computed(() => {
  if (playbackSource.value === 'page') return waveMode.value;
  return waveMode.value || selectedPlayer.value?.playlistId === 'user:onyourwave';
});
const heroLiked = computed(() => Boolean(heroTrack.value?.id && likedIds.has(heroTrack.value.id)));
const heroHasPrev = computed(() => {
  if (playbackSource.value === 'page') return pageIndex.value > 0;
  return selectedDevice.value ? playerHasPrev(selectedDevice.value) : false;
});
const heroHasNext = computed(() => {
  if (playbackSource.value === 'page') return pageIndex.value + 1 < pageQueue.value.length || waveMode.value;
  return selectedDevice.value ? playerHasNext(selectedDevice.value) : false;
});

watch(
  () => state.value?.accounts,
  (accounts) => {
    if (!accounts?.length) {
      selectedAccount.value = '';
      return;
    }
    if (!accounts.some((account) => account.id === selectedAccount.value)) selectedAccount.value = accounts[0].id;
  },
  { immediate: true }
);

watch(
  [devices, selectedAccount],
  ([list, account]) => {
    const filtered = list.filter((device) => !account || device.accountId === account);
    if (!filtered.length) {
      selectedSpeaker.value = '';
      return;
    }
    if (!filtered.some((device) => device.id === selectedSpeaker.value)) selectedSpeaker.value = filtered[0].id;
  },
  { immediate: true }
);

const volumeDrafts = reactive<Record<string, number>>({});
const volumeHoldUntil: Record<string, number> = {};
const volumeTimers: Record<string, ReturnType<typeof setTimeout> | undefined> = {};

const platformName = (platform: string): string => {
  const names: Record<string, string> = { yandexmini: 'Яндекс Станция Мини', yandexmicro: 'Яндекс Станция Микро', yandexstation: 'Яндекс Станция' };
  return names[platform] || platform;
};

const messageFor = (device: AlisaDevice): AlisaMessage | undefined => state.value?.data?.[device.id];
const playerState = (device: AlisaDevice): string => messageFor(device)?.data?.state?.aliceState ?? '';
const playerTitle = (device: AlisaDevice): string => messageFor(device)?.data?.state?.playerState?.title ?? '';
const coverUriUrl = (uri?: string): string => (uri ? `https://${uri.replace('%%', '200x200')}` : '');
const coverUrl = (device: AlisaDevice): string => coverUriUrl(messageFor(device)?.data?.state?.playerState?.extra?.coverURI);
const playerSubtitle = (device: AlisaDevice): string => messageFor(device)?.data?.state?.playerState?.subtitle ?? '';
const playerDuration = (device: AlisaDevice): number => Number(messageFor(device)?.data?.state?.playerState?.duration ?? 0);
const playerProgress = (device: AlisaDevice): number => Number(messageFor(device)?.data?.state?.playerState?.progress ?? 0);
const playerHasNext = (device: AlisaDevice): boolean => messageFor(device)?.data?.state?.playerState?.hasNext !== false;
const playerHasPrev = (device: AlisaDevice): boolean => messageFor(device)?.data?.state?.playerState?.hasPrev !== false;
const isPlaying = (device: AlisaDevice): boolean => Boolean(messageFor(device)?.data?.state?.playing);
const playerProgressPercent = (device: AlisaDevice): number => {
  const duration = playerDuration(device);
  return duration ? Math.min(100, Math.round((playerProgress(device) / duration) * 100)) : 0;
};

const formatSeconds = (value: number): string => {
  const total = Math.max(0, Math.round(value));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

const selectedDevice = computed(() => devices.value.find((device) => device.id === selectedSpeaker.value) ?? null);
const selectedPlayer = computed(() => (selectedDevice.value ? messageFor(selectedDevice.value)?.data?.state?.playerState : undefined));
const selectedCover = computed(() => coverUriUrl(selectedPlayer.value?.extra?.coverURI));
const isSelectedPlaying = computed(() => (selectedDevice.value ? isPlaying(selectedDevice.value) : false));
const selectedProgressPercent = computed(() => {
  const player = selectedPlayer.value;
  return player?.duration ? Math.min(100, Math.round(((player.progress ?? 0) / player.duration) * 100)) : 0;
});
const isTrackActive = (track: AlisaMusicTrack): boolean => {
  const player = selectedPlayer.value;
  if (!player) return false;
  if (player.id !== undefined && track.id) return String(player.id) === String(track.id);
  return Boolean(player.title && player.title === track.title);
};

const toggleSelectedPlay = async (): Promise<void> => {
  if (!selectedDevice.value) return;
  await send(selectedDevice.value, { command: isSelectedPlaying.value ? 'stop' : 'play' });
};

const serverVolume = (device: AlisaDevice): number => Math.round((messageFor(device)?.data?.state?.volume ?? 0) * 100);
const volume = (device: AlisaDevice): number => volumeDrafts[device.id] ?? serverVolume(device);

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  error.value = '';
  try {
    return await api.get<T>(path, init);
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
    throw e;
  }
};

const runAction = async <T>(key: string, action: () => Promise<T>): Promise<T> => {
  currentAction.value = key;
  try {
    return await action();
  } finally {
    if (currentAction.value === key) currentAction.value = '';
  }
};

const refresh = async (silent = false): Promise<void> => {
  if (!silent) loadingState.value = true;
  try {
    state.value = await api.get<AlisaState>('/alisa/state');
    // A transient failure while the hub restarts must not leave a stale banner.
    error.value = '';
    // Keep an optimistic volume value until the speaker confirms it. Without
    // this the 3-second poll can overwrite the slider with the old value.
    for (const device of state.value.devices) {
      const draft = volumeDrafts[device.id];
      if (draft === undefined) continue;
      const current = serverVolume(device);
      if (Math.abs(current - draft) <= 1 || Date.now() > (volumeHoldUntil[device.id] ?? 0)) {
        delete volumeDrafts[device.id];
        delete volumeHoldUntil[device.id];
      }
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    if (!silent) loadingState.value = false;
  }
  writeAlisaCache();
};

const scan = (): Promise<void> =>
  runAction('scan', async () => {
    scanDevices.value = await request<AlisaDevice[]>('/alisa/scan');
  });

const loadPlaylists = async (): Promise<void> => {
  if (!state.value?.token || !selectedAccount.value) return;
  musicLoading.value = true;
  musicError.value = '';
  const accountId = encodeURIComponent(selectedAccount.value);
  const [playlistResult, collectionResult] = await Promise.allSettled([
    api.get<AlisaMusicPlaylist[]>(`/alisa/music/playlists?accountId=${accountId}`),
    api.get<AlisaMusicCollection[]>(`/alisa/music/collections?accountId=${accountId}`),
  ]);
  if (playlistResult.status === 'fulfilled') {
    playlists.value = playlistResult.value;
  } else {
    const reason = playlistResult.reason;
    musicError.value = reason instanceof Error ? reason.message : String(reason);
  }
  if (collectionResult.status === 'fulfilled') {
    collections.value = collectionResult.value;
  }
  musicLoading.value = false;
  writeAlisaCache();
};

const selectTarget = async (accountId: string, speakerId: string): Promise<void> => {
  const accountChanged = selectedAccount.value !== accountId;
  selectedAccount.value = accountId;
  selectedSpeaker.value = speakerId;
  targetMenuOpen.value = false;
  playMenuOpen.value = false;
  if (accountChanged) {
    playlists.value = [];
    collections.value = [];
    closePlaylist();
    await loadPlaylists();
  }
  writeAlisaCache();
};

const playAccount = (): string => openedPlaylistAccount.value || selectedAccount.value;

const setPlaybackSource = (source: 'speaker' | 'page'): void => {
  if (playbackSource.value === source) return;
  playbackSource.value = source;
  if (source === 'speaker') stopPage();
  writeAlisaCache();
};

const pageAudioElement = (): HTMLAudioElement | null => pageAudio.value;

const stopPage = (): void => {
  const audio = pageAudioElement();
  if (audio) {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }
  pagePlaying.value = false;
  pagePosition.value = 0;
  pageDuration.value = 0;
  pageQueue.value = [];
  pageIndex.value = -1;
  waveMode.value = false;
  waveBatchId.value = null;
};

const waveFeedback = async (type: string, trackId?: string, totalPlayedSeconds?: number): Promise<void> => {
  if (!waveMode.value || !selectedAccount.value) return;
  try {
    await api.post('/alisa/music/wave/feedback', {
      body: JSON.stringify({
        accountId: selectedAccount.value,
        type,
        batchId: waveBatchId.value ?? undefined,
        trackId,
        totalPlayedSeconds,
      }),
    });
  } catch {
    // Feedback only improves recommendations; playback must not depend on it.
  }
};

const seedLikes = (list: AlisaMusicTrack[]): void => {
  for (const track of list) if (track.liked) likedIds.add(track.id);
};

const playOnPage = async (track: AlisaMusicTrack, queue?: AlisaMusicTrack[]): Promise<void> => {
  pageError.value = '';
  pageLoading.value = true;
  if (queue?.length) {
    pageQueue.value = queue;
    const index = queue.findIndex((item) => item.id === track.id);
    pageIndex.value = index >= 0 ? index : 0;
  } else if (!pageQueue.value.some((item) => item.id === track.id)) {
    pageQueue.value = [track];
    pageIndex.value = 0;
  } else {
    pageIndex.value = pageQueue.value.findIndex((item) => item.id === track.id);
  }

  try {
    const { url } = await api.post<{ url: string }>('/alisa/music/stream-token', {
      body: JSON.stringify({ accountId: playAccount(), trackId: track.id }),
    });
    const audio = pageAudioElement();
    if (!audio) return;
    audio.src = url;
    audio.volume = pageVolume.value / 100;
    audio.currentTime = 0;
    pageDuration.value = 0;
    pagePosition.value = 0;
    await audio.play();
    if (waveMode.value) void waveFeedback('trackStarted', track.id);
  } catch (e) {
    pageError.value = e instanceof Error ? e.message : String(e);
  } finally {
    pageLoading.value = false;
  }
};

const loadWaveBatch = async (queue?: string): Promise<void> => {
  if (!state.value?.token || !selectedAccount.value) return;
  pageLoading.value = true;
  pageError.value = '';
  try {
    const query = new URLSearchParams({ accountId: selectedAccount.value });
    if (queue) query.set('queue', queue);
    const batch = await api.get<{ tracks: AlisaMusicTrack[]; batchId: string | null; lastTrackId: string | null }>(
      `/alisa/music/wave?${query.toString()}`
    );
    waveBatchId.value = batch.batchId;
    seedLikes(batch.tracks);
    if (!batch.tracks.length) {
      pageError.value = t('alisa.waveEmpty');
      return;
    }
    if (queue) {
      pageQueue.value = [...pageQueue.value, ...batch.tracks];
      const next = pageQueue.value[pageIndex.value + 1] ?? batch.tracks[0];
      await playOnPage(next);
    } else {
      pageQueue.value = batch.tracks;
      pageIndex.value = 0;
      await playOnPage(batch.tracks[0], batch.tracks);
    }
  } catch (e) {
    pageError.value = e instanceof Error ? e.message : String(e);
  } finally {
    pageLoading.value = false;
  }
};

const startWave = async (): Promise<void> => {
  musicError.value = '';
  pageError.value = '';
  if (playbackSource.value === 'speaker') {
    if (!selectedSpeaker.value) {
      musicError.value = t('alisa.selectSpeaker');
      return;
    }
    waveMode.value = true;
    waveLoading.value = true;
    try {
      await api.post('/alisa/music/wave/play', {
        body: JSON.stringify({ accountId: selectedAccount.value, deviceId: selectedSpeaker.value }),
      });
      await refresh();
    } catch (e) {
      waveMode.value = false;
      musicError.value = e instanceof Error ? e.message : String(e);
    } finally {
      waveLoading.value = false;
    }
    return;
  }
  waveMode.value = true;
  await loadWaveBatch();
};

const playPlaylistOnPage = async (playlist: AlisaMusicPlaylist): Promise<void> => {
  musicError.value = '';
  waveMode.value = false;
  try {
    const list = openedPlaylist.value?.id === playlist.id && tracks.value.length
      ? tracks.value
      : await api.get<AlisaMusicTrack[]>(
          `/alisa/music/playlists/${encodeURIComponent(playlist.id)}/tracks?accountId=${encodeURIComponent(openedPlaylistAccount.value || selectedAccount.value)}`
        );
    if (!list.length) {
      musicError.value = t('alisa.noTracks');
      return;
    }
    await playOnPage(list[0], list);
  } catch (e) {
    musicError.value = e instanceof Error ? e.message : String(e);
  }
};

const playPageIndex = async (index: number): Promise<void> => {
  if (index < 0 || index >= pageQueue.value.length) return;
  await playOnPage(pageQueue.value[index]);
};

const playNextPage = async (): Promise<void> => {
  const next = pageIndex.value + 1;
  if (next < pageQueue.value.length) {
    await playOnPage(pageQueue.value[next]);
    return;
  }
  if (waveMode.value) await loadWaveBatch(pageQueue.value.at(-1)?.id);
  else pagePlaying.value = false;
};

const togglePagePlay = async (): Promise<void> => {
  const audio = pageAudioElement();
  if (!audio || !pageTrack.value) return;
  if (audio.paused) {
    if (audio.src) await audio.play();
    else await playOnPage(pageTrack.value);
  } else {
    audio.pause();
  }
};

const onPageLoaded = (): void => {
  pageDuration.value = pageAudioElement()?.duration ?? 0;
};

const onPageTimeUpdate = (): void => {
  pagePosition.value = pageAudioElement()?.currentTime ?? 0;
};

const onPageEnded = (): void => {
  if (waveMode.value) void waveFeedback('trackFinished', pageQueue.value[pageIndex.value]?.id, (pageQueue.value[pageIndex.value]?.durationMs ?? 0) / 1000);
  void playNextPage();
};

const setPageVolume = (value: number): void => {
  pageVolume.value = value;
  const audio = pageAudioElement();
  if (audio) audio.volume = value / 100;
};

const toggleLike = async (): Promise<void> => {
  const track = heroTrack.value;
  if (!track?.id) return;
  const liked = !likedIds.has(track.id);
  if (liked) likedIds.add(track.id);
  else likedIds.delete(track.id);
  try {
    await api.post('/alisa/music/like', {
      body: JSON.stringify({ accountId: playAccount(), trackId: track.id, liked }),
    });
  } catch (e) {
    if (liked) likedIds.delete(track.id);
    else likedIds.add(track.id);
    musicError.value = e instanceof Error ? e.message : String(e);
  }
};

const heroToggle = async (): Promise<void> => {
  if (playbackSource.value === 'page') {
    await togglePagePlay();
    return;
  }
  await toggleSelectedPlay();
};

const heroPrev = async (): Promise<void> => {
  if (playbackSource.value === 'page') {
    await playPageIndex(pageIndex.value - 1);
    return;
  }
  if (selectedDevice.value) await send(selectedDevice.value, { command: 'prev' });
};

const heroNext = async (): Promise<void> => {
  if (playbackSource.value === 'page') {
    if (waveMode.value) void waveFeedback('skip', pageQueue.value[pageIndex.value]?.id);
    await playNextPage();
    return;
  }
  if (selectedDevice.value) await send(selectedDevice.value, { command: 'next' });
};

const playPlaylist = async (playlist: AlisaMusicPlaylist): Promise<void> => {
  if (playbackSource.value === 'page') {
    await playPlaylistOnPage(playlist);
    return;
  }
  if (!selectedSpeaker.value) {
    musicError.value = t('alisa.selectSpeaker');
    return;
  }
  musicError.value = '';
  try {
    await api.post('/alisa/music/play', {
      body: JSON.stringify({ accountId: playAccount(), deviceId: selectedSpeaker.value, playlistId: playlist.id }),
    });
  } catch (e) {
    musicError.value = e instanceof Error ? e.message : String(e);
  }
};

const playPlaylistOn = async (accountId: string, speakerId: string): Promise<void> => {
  selectedAccount.value = accountId;
  selectedSpeaker.value = speakerId;
  playMenuOpen.value = false;
  if (openedPlaylist.value) await playPlaylist(openedPlaylist.value);
  writeAlisaCache();
};

const formatDuration = (ms: number): string => {
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

const closePlaylist = (): void => {
  openedPlaylist.value = null;
  openedPlaylistAccount.value = '';
  playMenuOpen.value = false;
  tracks.value = [];
  tracksError.value = '';
  writeAlisaCache();
};

const openPlaylist = async (playlist: AlisaMusicPlaylist): Promise<void> => {
  openedPlaylist.value = playlist;
  openedPlaylistAccount.value = selectedAccount.value;
  tracks.value = [];
  tracksError.value = '';
  tracksLoading.value = true;
  try {
    tracks.value = await api.get<AlisaMusicTrack[]>(
      `/alisa/music/playlists/${encodeURIComponent(playlist.id)}/tracks?accountId=${encodeURIComponent(selectedAccount.value)}`
    );
  } catch (e) {
    tracksError.value = e instanceof Error ? e.message : String(e);
  } finally {
    tracksLoading.value = false;
    writeAlisaCache();
  }
};

const playTrack = async (track: AlisaMusicTrack): Promise<void> => {
  if (playbackSource.value === 'page') {
    await playOnPage(track, tracks.value.length ? tracks.value : undefined);
    return;
  }
  if (!selectedSpeaker.value) {
    tracksError.value = t('alisa.selectSpeaker');
    return;
  }
  tracksError.value = '';
  try {
    await api.post('/alisa/music/track', {
      body: JSON.stringify({ accountId: playAccount(), deviceId: selectedSpeaker.value, trackId: track.id }),
    });
  } catch (e) {
    tracksError.value = e instanceof Error ? e.message : String(e);
  }
  writeAlisaCache();
};

const connect = (): Promise<void> =>
  runAction('connect-all', async () => {
    state.value = await request<AlisaState>('/alisa/connection', { method: 'POST', body: '{}' });
    writeAlisaCache();
  });

const disconnect = (): Promise<void> =>
  runAction('disconnect-all', async () => {
    state.value = await request<AlisaState>('/alisa/disconnect', { method: 'POST', body: '{}' });
    writeAlisaCache();
  });

const connectAccount = (accountId: string): Promise<void> =>
  runAction(`connect:${accountId}`, async () => {
    state.value = await request<AlisaState>('/alisa/connection', { method: 'POST', body: JSON.stringify({ accountId }) });
    writeAlisaCache();
  });

const disconnectAccount = (accountId: string): Promise<void> =>
  runAction(`disconnect:${accountId}`, async () => {
    state.value = await request<AlisaState>('/alisa/disconnect', { method: 'POST', body: JSON.stringify({ accountId }) });
    writeAlisaCache();
  });

const forgetAccount = (accountId: string): Promise<void> =>
  runAction(`forget:${accountId}`, async () => {
    state.value = await request<AlisaState>(`/alisa/accounts/${encodeURIComponent(accountId)}`, { method: 'DELETE' });
    if (selectedAccount.value === accountId) {
      selectedAccount.value = state.value.accounts[0]?.id ?? '';
      playlists.value = [];
    }
    writeAlisaCache();
  });

const stopQrPolling = (): void => {
  if (qrTimer) clearInterval(qrTimer);
  qrTimer = null;
};

const startQr = async (): Promise<void> => {
  stopQrPolling();
  qrLoading.value = true;
  qrError.value = '';
  try {
    qr.value = await request<{ id: string; qrImage: string; expiresAt: number }>('/alisa/qr/start', { method: 'POST', body: '{}' });
    qrTimer = setInterval(() => void pollQr(), 3000);
  } catch (e) {
    qrError.value = e instanceof Error ? e.message : String(e);
    qr.value = null;
  } finally {
    qrLoading.value = false;
  }
};

const pollQr = async (): Promise<void> => {
  if (!qr.value) return;
  try {
    const result = await api.post<{ status: 'pending' | 'ok'; state: AlisaState }>('/alisa/qr/poll', {
      body: JSON.stringify({ id: qr.value.id }),
    });
    if (result.status === 'ok') {
      stopQrPolling();
      qr.value = null;
      state.value = result.state;
      await connect();
      await nextTick();
      void loadPlaylists();
    }
  } catch (e) {
    stopQrPolling();
    qr.value = null;
    qrError.value = e instanceof Error ? e.message : String(e);
  }
};

const manualInit = (): Promise<void> =>
  runAction('manual-init', async () => {
    if (!manualToken.value) return;
    state.value = await request<AlisaState>('/alisa/init', { method: 'POST', body: JSON.stringify({ token: manualToken.value }) });
    manualToken.value = '';
    await connect();
    await nextTick();
    void loadPlaylists();
  });

const sendCommand = async (device: AlisaDevice, payload: unknown): Promise<void> => {
  await request('/alisa/send', { method: 'POST', body: JSON.stringify({ id: device.id, payload }) });
};

const send = async (device: AlisaDevice, payload: unknown): Promise<void> => {
  await sendCommand(device, payload);
  await refresh();
};

const pushVolume = (device: AlisaDevice, value: number): void => {
  void sendCommand(device, { command: 'setVolume', volume: value / 100 }).catch(() => {
    // The error banner is already set by request().
  });
};

const onVolumeInput = (device: AlisaDevice, event: Event): void => {
  const value = Number((event.target as HTMLInputElement).value);
  volumeDrafts[device.id] = value;
  volumeHoldUntil[device.id] = Date.now() + 2500;
  if (volumeTimers[device.id]) clearTimeout(volumeTimers[device.id]);
  volumeTimers[device.id] = setTimeout(() => pushVolume(device, value), 150);
};

const onVolumeChange = (device: AlisaDevice, event: Event): void => {
  const value = Number((event.target as HTMLInputElement).value);
  volumeDrafts[device.id] = value;
  volumeHoldUntil[device.id] = Date.now() + 2500;
  if (volumeTimers[device.id]) clearTimeout(volumeTimers[device.id]);
  pushVolume(device, value);
};

const sendTts = async (device: AlisaDevice): Promise<void> => {
  if (!tts.value) return;
  await send(device, {
    command: 'serverAction',
    serverActionEventPayload: {
      type: 'server_action',
      name: 'update_form',
      payload: {
        form_update: {
          name: 'personal_assistant.scenarios.repeat_after_me',
          slots: [{ type: 'string', name: 'request', value: `<speaker>${tts.value}` }],
        },
        resubmit: true,
      },
    },
  });
  tts.value = '';
};

onMounted(async () => {
  const cached = readAlisaCache();
  if (cached) {
    state.value = cached.state;
    playlists.value = cached.playlists;
    collections.value = cached.collections ?? [];
    playbackSource.value = cached.playbackSource ?? 'speaker';
    selectedAccount.value = cached.selectedAccount;
    selectedSpeaker.value = cached.selectedSpeaker;
    openedPlaylist.value = cached.openedPlaylist;
    openedPlaylistAccount.value = cached.openedPlaylistAccount ?? cached.selectedAccount;
    tracks.value = cached.tracks;
  }

  await refresh(Boolean(cached));
  await nextTick();
  if (state.value?.token) void loadPlaylists();
  if (state.value?.token && !state.value.devices.length && !autoConnectTried) {
    autoConnectTried = true;
    try {
      await connect();
    } catch {
      // The error banner is already set by request().
    }
  }
  timer = setInterval(() => void refresh(true), 3000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  stopQrPolling();
  stopPage();
  for (const timeout of Object.values(volumeTimers)) {
    if (timeout) clearTimeout(timeout);
  }
  writeAlisaCache();
});
</script>
