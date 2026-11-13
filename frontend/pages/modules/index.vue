<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb
      :items="[{ name: t('common.home'), path: '/' }, { name: t('modules.title') }]"
      class="mb-6"
    />

    <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold text-gray-dark-40 dark:text-white">
          {{ t('modules.title') }}
        </h1>
        <p class="mt-2 max-w-2xl text-sm text-gray-dark-25 dark:text-gray-main">
          {{ t('modules.subtitle') }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <VButton
          v-if="isAdmin()"
          outline
          color="gray"
          size="sm"
          @click="openCatalog()"
        >
          {{ t('modules.catalog') }}
        </VButton>
        <VButton
          v-if="isAdmin()"
          color="blue"
          size="sm"
          @click="installOpen = true"
        >
          {{ t('modules.install') }}
        </VButton>
        <VButton
          type="icon"
          color="gray"
          :loading="loading"
          :aria-label="t('common.refresh')"
          :title="t('common.refresh')"
          @click="load()"
        >
          <IconRefreshLine class="size-5" />
        </VButton>
      </div>
    </div>

    <div
      v-if="error"
      class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300"
    >
      <span>{{ error }}</span>
      <VButton outline color="gray" size="sm" @click="load()">
        {{ t('common.refresh') }}
      </VButton>
    </div>

    <p v-if="loading && !modules.length" class="text-sm text-gray-dark-25 dark:text-gray-main">
      {{ t('common.refreshing') }}
    </p>

    <p v-else-if="!modules.length" class="rounded-md border border-dashed border-gray-light-10/70 px-4 py-10 text-center text-sm text-gray-dark-25 dark:border-white/15 dark:text-gray-main">
      {{ t('modules.empty') }}
    </p>

    <div v-else class="space-y-8">
      <section
        v-for="section of sections"
        :key="section.key"
        class="space-y-3"
      >
        <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-dark-25 dark:text-gray-main">
          {{ section.title }}
        </h2>

        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="item of section.items"
            :key="item.id"
            class="flex flex-col gap-4 rounded-lg border border-gray-light-10/70 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="truncate text-base font-semibold text-gray-dark-40 dark:text-white">
                  {{ item.name }}
                </h2>
                <p class="mt-1 text-xs text-gray-dark-25 dark:text-gray-main">
                  {{ item.id }} · v{{ item.version }}
                </p>
              </div>
              <span
                class="shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide"
                :class="item.running
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-gray-dark-25/15 text-gray-dark-25 dark:text-gray-main'"
              >
                {{ item.running ? t('modules.running') : t('modules.stopped') }}
              </span>
            </div>

            <p v-if="item.description" class="text-xs leading-relaxed text-gray-dark-25 dark:text-gray-light-10">
              {{ item.description }}
            </p>

            <div class="text-xs text-gray-dark-25 dark:text-gray-main">
              <span class="font-medium text-gray-dark-25 dark:text-gray-light-10">{{ t('modules.permissions') }}:</span>
              {{ item.permissions.length ? item.permissions.join(', ') : t('modules.noPermissions') }}
            </div>

            <div class="mt-auto flex flex-wrap items-center gap-2">
              <VButton
                v-if="item.web"
                color="blue"
                size="sm"
                :to="withTrailingSlash(item.web.route)"
              >
                {{ t('modules.open') }}
              </VButton>
              <VButton
                v-if="isAdmin()"
                outline
                color="gray"
                size="sm"
                :loading="actionId === `${item.id}:toggle`"
                @click="toggle(item)"
              >
                {{ item.running ? t('modules.stop') : t('modules.start') }}
              </VButton>
              <VButton
                outline
                color="gray"
                size="sm"
                @click="openLogs(item)"
              >
                {{ t('modules.logs') }}
              </VButton>
              <VButton
                v-if="isAdmin()"
                outline
                color="gray"
                size="sm"
                :loading="actionId === `${item.id}:remove`"
                @click="remove(item)"
              >
                {{ t('modules.remove') }}
              </VButton>
            </div>
          </article>
        </div>
      </section>
    </div>

    <VDialog
      v-if="installOpen"
      :title="t('modules.installTitle')"
      size="md"
      @close="installOpen = false"
    >
      <div class="space-y-4">
        <input
          ref="fileInput"
          type="file"
          accept=".vmod,application/gzip,application/octet-stream"
          class="hidden"
          @change="onFileChange"
        />

        <div class="rounded-md border border-dashed border-gray-light-10/70 p-4 dark:border-white/15">
          <p class="text-sm font-medium text-gray-dark-40 dark:text-white">
            {{ t('modules.uploadTitle') }}
          </p>
          <p class="mt-1 text-xs leading-relaxed text-gray-dark-25 dark:text-gray-main">
            {{ t('modules.uploadHint') }}
          </p>
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <VButton color="blue" size="sm" @click="fileInput?.click()">
              {{ t('modules.chooseFile') }}
            </VButton>
            <span class="min-w-0 truncate text-xs text-gray-dark-25 dark:text-gray-main">
              {{ selectedFile?.name ?? t('modules.noFile') }}
            </span>
          </div>
        </div>

        <details class="rounded-md border border-gray-light-10/70 p-4 dark:border-white/10">
          <summary class="cursor-pointer text-xs font-medium text-gray-dark-25 dark:text-gray-light-10">
            {{ t('modules.installByPath') }}
          </summary>
          <VTextField
            v-model="installPath"
            :label="t('modules.installPath')"
            :message="t('modules.installHint')"
            class="mt-3"
          />
        </details>

        <div class="flex justify-end gap-2">
          <VButton outline color="gray" size="sm" @click="installOpen = false">
            {{ t('common.cancel') }}
          </VButton>
          <VButton
            color="blue"
            size="sm"
            :loading="installing"
            :disabled="!selectedFile && !installPath.trim()"
            @click="install()"
          >
            {{ t('modules.installAction') }}
          </VButton>
        </div>
      </div>
    </VDialog>

    <VDialog
      v-if="catalogOpen"
      :title="t('modules.catalogTitle')"
      size="lg"
      @close="catalogOpen = false"
    >
      <div class="space-y-4">
        <p class="text-xs leading-relaxed text-gray-dark-25 dark:text-gray-main">
          {{ t('modules.catalogHint') }}
        </p>

        <p v-if="catalogLoading" class="text-sm text-gray-dark-25 dark:text-gray-main">
          {{ t('common.refreshing') }}
        </p>
        <p v-else-if="catalogError" class="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">
          {{ catalogError }}
        </p>
        <p v-else-if="!catalog.length" class="text-sm text-gray-dark-25 dark:text-gray-main">
          {{ t('modules.catalogEmpty') }}
        </p>

        <div v-else class="space-y-2">
          <article
            v-for="item of catalog"
            :key="item.id"
            class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-gray-light-10/70 p-3 dark:border-white/10"
          >
            <div class="min-w-0">
              <h3 class="text-sm font-semibold text-gray-dark-40 dark:text-white">
                {{ item.name }}
              </h3>
              <p class="mt-1 text-xs text-gray-dark-25 dark:text-gray-main">
                {{ item.id }} · v{{ item.version }}
                <span v-if="item.group"> · {{ item.group.name }}</span>
                <span v-if="item.size"> · {{ formatSize(item.size) }}</span>
              </p>
              <p v-if="item.description" class="mt-1 text-xs text-gray-dark-25 dark:text-gray-light-10">
                {{ item.description }}
              </p>
            </div>

            <VButton
              v-if="!item.installed"
              color="blue"
              size="sm"
              :disabled="item.compatible === false"
              :loading="catalogInstalling === item.id"
              @click="installCatalog(item)"
            >
              {{ item.compatible === false ? t('modules.catalogIncompatible') : t('modules.installAction') }}
            </VButton>
            <span
              v-else
              class="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400"
            >
              {{ t('modules.installed') }}
            </span>
          </article>
        </div>
      </div>
    </VDialog>

    <VDialog
      v-if="removeTarget"
      :title="t('modules.removeTitle')"
      size="sm"
      @close="removeTarget = null"
    >
      <p class="text-sm leading-relaxed text-gray-dark-25 dark:text-gray-light-10">
        {{ t('modules.removeConfirm', { name: removeTarget.name }) }}
      </p>
      <div class="mt-4 flex flex-wrap justify-end gap-2">
        <VButton outline color="gray" size="sm" @click="removeTarget = null">
          {{ t('common.cancel') }}
        </VButton>
        <VButton
          color="rose"
          size="sm"
          :loading="actionId === `${removeTarget.id}:remove`"
          @click="confirmRemove"
        >
          {{ t('modules.remove') }}
        </VButton>
      </div>
    </VDialog>

    <VDialog
      v-if="logsOpen"
      :title="`${t('modules.logs')} · ${logsId}`"
      size="lg"
      @close="logsOpen = false"
    >
      <div v-if="!logs.length" class="text-sm text-gray-dark-25 dark:text-gray-main">
        {{ t('modules.logsEmpty') }}
      </div>
      <ul v-else class="space-y-1 font-mono text-xs">
        <li
          v-for="(entry, index) of logs"
          :key="`${entry.at}:${index}`"
          class="flex gap-2"
          :class="entry.level === 'error' ? 'text-red-600 dark:text-red-400' : entry.level === 'warn' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-dark-25 dark:text-gray-light-10'"
        >
          <span class="shrink-0 text-gray-main">{{ entry.at.slice(11, 19) }}</span>
          <span class="min-w-0 break-words">{{ entry.message }}</span>
        </li>
      </ul>
    </VDialog>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { BlockBreadcrumb as VBreadcrumb, VButton, VDialog, VTextField } from 'vuesp-components/components';
import IconRefreshLine from '~icons/ri/refresh-line';

import { api } from '@/utils/helpers.ts';
import { isAdmin } from '@/utils/auth.ts';
import { withTrailingSlash } from '@/utils/path.ts';
import type { CatalogModule, ModuleLogEntry, ModuleSummary } from '@/types';

const { t } = useI18n();

interface ModuleSection {
  key: string;
  title: string;
  order: number;
  items: ModuleSummary[];
}

const modules = ref<ModuleSummary[]>([]);
const loading = ref(false);
const error = ref('');
const actionId = ref('');

const installOpen = ref(false);
const installing = ref(false);
const installPath = ref('');
const fileInput = ref<HTMLInputElement>();
const selectedFile = ref<File | null>(null);

const logsOpen = ref(false);
const logsId = ref('');
const logs = ref<ModuleLogEntry[]>([]);

const removeTarget = ref<ModuleSummary | null>(null);

const catalogOpen = ref(false);
const catalogLoading = ref(false);
const catalogError = ref('');
const catalog = ref<CatalogModule[]>([]);
const catalogInstalling = ref('');

const sections = computed<ModuleSection[]>(() => {
  const grouped = new Map<string, ModuleSection>();

  for (const item of modules.value) {
    const group = item.group;
    const key = group?.id ?? '__ungrouped';
    let section = grouped.get(key);
    if (!section) {
      section = {
        key,
        title: group?.name ?? t('modules.otherGroup'),
        order: group?.order ?? 1000,
        items: [],
      };
      grouped.set(key, section);
    }
    section.items.push(item);
  }

  return [...grouped.values()].sort((left, right) => left.order - right.order || left.title.localeCompare(right.title));
});

const load = async (): Promise<void> => {
  loading.value = true;
  error.value = '';
  try {
    modules.value = await api.get<ModuleSummary[]>('/modules');
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('modules.loadError');
  } finally {
    loading.value = false;
  }
};

const notifyModulesChanged = (): void => {
  window.dispatchEvent(new Event('vuesp:modules-changed'));
};

const onFileChange = (event: Event): void => {
  const input = event.target as HTMLInputElement;
  selectedFile.value = input.files?.[0] ?? null;
};

const install = async (): Promise<void> => {
  installing.value = true;
  error.value = '';
  try {
    if (selectedFile.value) {
      await api.post('/modules/install-upload', {
        body: selectedFile.value,
        headers: { 'Content-Type': 'application/octet-stream' },
      });
    } else {
      await api.post('/modules/install', {
        body: JSON.stringify({ path: installPath.value.trim() }),
      });
    }

    installOpen.value = false;
    installPath.value = '';
    selectedFile.value = null;
    if (fileInput.value) fileInput.value.value = '';
    await load();
    notifyModulesChanged();
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('modules.actionError');
  } finally {
    installing.value = false;
  }
};

const toggle = async (item: ModuleSummary): Promise<void> => {
  actionId.value = `${item.id}:toggle`;
  error.value = '';
  try {
    await api.post(`/modules/${encodeURIComponent(item.id)}/${item.running ? 'stop' : 'start'}`);
    await load();
    notifyModulesChanged();
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('modules.actionError');
  } finally {
    actionId.value = '';
  }
};

const remove = (item: ModuleSummary): void => {
  removeTarget.value = item;
};

const confirmRemove = async (): Promise<void> => {
  const item = removeTarget.value;
  if (!item) return;

  actionId.value = `${item.id}:remove`;
  error.value = '';
  try {
    await api.delete(`/modules/${encodeURIComponent(item.id)}`);
    removeTarget.value = null;
    await load();
    notifyModulesChanged();
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('modules.actionError');
  } finally {
    actionId.value = '';
  }
};

const formatSize = (bytes: number): string =>
  bytes < 1024 * 1024
    ? t('modules.sizeKb', { size: Math.max(1, Math.round(bytes / 1024)) })
    : t('modules.sizeMb', { size: (bytes / 1024 / 1024).toFixed(1) });

const loadCatalog = async (): Promise<void> => {
  catalogLoading.value = true;
  catalogError.value = '';
  try {
    catalog.value = await api.get<CatalogModule[]>('/modules/catalog');
  } catch (cause) {
    catalogError.value = cause instanceof Error ? cause.message : t('modules.catalogUnavailable');
  } finally {
    catalogLoading.value = false;
  }
};

const openCatalog = (): void => {
  catalogOpen.value = true;
  void loadCatalog();
};

const installCatalog = async (item: CatalogModule): Promise<void> => {
  catalogInstalling.value = item.id;
  catalogError.value = '';
  try {
    await api.post('/modules/catalog/install', {
      body: JSON.stringify({ id: item.id }),
    });
    await load();
    await loadCatalog();
    notifyModulesChanged();
  } catch (cause) {
    catalogError.value = cause instanceof Error ? cause.message : t('modules.actionError');
  } finally {
    catalogInstalling.value = '';
  }
};

const openLogs = async (item: ModuleSummary): Promise<void> => {
  logsId.value = item.id;
  logs.value = [];
  logsOpen.value = true;
  try {
    logs.value = await api.get<ModuleLogEntry[]>(`/modules/${encodeURIComponent(item.id)}/logs`);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('modules.actionError');
  }
};

onMounted(() => void load());
</script>
