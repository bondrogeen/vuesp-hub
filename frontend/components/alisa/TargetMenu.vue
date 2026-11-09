<template>
  <div class="w-80 max-w-[calc(100vw-2rem)] rounded-md border border-gray-200/70 bg-white p-1 shadow-xl dark:border-white/10 dark:bg-[#0b1538]">
    <p class="px-3 py-2 text-[10px] tracking-wide text-gray-500 uppercase">{{ t('alisa.playOn') }}</p>

    <div v-for="account of accounts" :key="account.id">
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm transition hover:bg-black/5 dark:hover:bg-white/5"
        @click="toggle(account.id)"
      >
        <IconUserLine class="size-4 shrink-0 text-primary" />
        <span class="min-w-0 flex-1 truncate font-medium">{{ account.name }}</span>
        <span class="shrink-0 text-[10px] text-gray-500">{{ account.speakers.length }}</span>
        <IconArrowDownSLine class="size-4 shrink-0 transition-transform" :class="expanded[account.id] ? 'rotate-180' : ''" />
      </button>

      <div v-if="expanded[account.id]" class="mb-1 ml-4 border-l border-gray-200/70 pl-2 dark:border-white/10">
        <button
          v-for="speaker of account.speakers"
          :key="speaker.id"
          type="button"
          class="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm transition hover:bg-black/5 dark:hover:bg-white/5"
          :class="speaker.id === selectedSpeaker ? 'text-primary' : ''"
          @click="select(account.id, speaker.id)"
        >
          <IconVolumeUpLine class="size-4 shrink-0" />
          <span class="min-w-0 flex-1 truncate">{{ speaker.name }}</span>
          <IconCheckLine v-if="speaker.id === selectedSpeaker" class="size-4 shrink-0" />
        </button>
        <p v-if="!account.speakers.length" class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
          {{ t('alisa.noAccountSpeakers') }}
        </p>
      </div>
    </div>

    <p v-if="!accounts.length" class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">{{ t('alisa.noAccounts') }}</p>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import IconArrowDownSLine from '~icons/ri/arrow-down-s-line';
import IconCheckLine from '~icons/ri/check-line';
import IconUserLine from '~icons/ri/user-line';
import IconVolumeUpLine from '~icons/ri/volume-up-line';

import type { TargetMenuEmits, TargetMenuProps } from './TargetMenu.types.ts';

const props = defineProps<TargetMenuProps>();
const emit = defineEmits<TargetMenuEmits>();
const { t } = useI18n();

const expanded = reactive<Record<string, boolean>>({});

const syncExpanded = (): void => {
  const known = new Set(props.accounts.map((account) => account.id));
  for (const id of Object.keys(expanded)) {
    if (!known.has(id)) delete expanded[id];
  }
  for (const account of props.accounts) {
    if (expanded[account.id] === undefined) expanded[account.id] = account.id === props.selectedAccount;
  }
};

watch(() => props.accounts, syncExpanded, { immediate: true, deep: true });
watch(
  () => props.selectedAccount,
  (accountId) => {
    if (accountId) expanded[accountId] = true;
  }
);

const toggle = (accountId: string): void => {
  expanded[accountId] = !expanded[accountId];
};

const select = (accountId: string, speakerId: string): void => {
  emit('select', accountId, speakerId);
};
</script>
