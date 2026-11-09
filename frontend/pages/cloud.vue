<template>
	<main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
		<VBreadcrumb :items="[{ name: t('common.home'), path: '/' }, { name: t('cloud.title') }]" class="mb-6" />

		<div class="mb-6">
			<h1 class="text-2xl font-semibold text-gray-900 dark:text-white">{{ t('cloud.title') }}</h1>
			<p class="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{{ t('cloud.subtitle') }}</p>
		</div>

		<p v-if="error" class="mb-4 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">{{ error }}</p>

		<CardMain :title="t('cloud.title')" :loading="loading">
			<div v-if="!status" class="text-sm text-gray-500 dark:text-gray-400">{{ t('cloud.loadError') }}</div>

			<div v-else-if="status.state === 'connected'" class="space-y-5">
				<div class="flex flex-wrap items-center gap-3">
					<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
						<span class="size-1.5 rounded-full bg-emerald-500" />
						{{ t('cloud.online') }}
					</span>
					<span class="text-sm font-medium text-gray-900 dark:text-white">{{ status.name || t('cloud.hub') }}</span>
				</div>

				<dl class="grid gap-3 text-sm sm:grid-cols-2">
					<div class="rounded-md bg-white/50 px-3 py-2 dark:bg-white/[0.03]">
						<dt class="text-[10px] uppercase tracking-wide text-gray-400">{{ t('cloud.hub') }}</dt>
						<dd class="mt-1 truncate font-medium">{{ status.hubId || '—' }}</dd>
					</div>
					<div class="rounded-md bg-white/50 px-3 py-2 dark:bg-white/[0.03]">
						<dt class="text-[10px] uppercase tracking-wide text-gray-400">{{ t('cloud.server') }}</dt>
						<dd class="mt-1 truncate font-medium">{{ status.url || '—' }}</dd>
					</div>
					<div class="rounded-md bg-white/50 px-3 py-2 dark:bg-white/[0.03]">
						<dt class="text-[10px] uppercase tracking-wide text-gray-400">{{ t('cloud.lastHeartbeat') }}</dt>
						<dd class="mt-1 font-medium">{{ formatDate(status.lastHeartbeat) }}</dd>
					</div>
				</dl>

				<div class="rounded-md border border-gray-200/70 bg-white/40 p-4 dark:border-white/10 dark:bg-white/[0.03]">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0">
							<p class="text-sm font-medium text-gray-900 dark:text-white">{{ t('cloud.tilesTitle') }}</p>
							<p class="mt-1 max-w-2xl text-xs leading-relaxed text-gray-500 dark:text-gray-400">{{ t('cloud.tilesHint') }}</p>
						</div>
						<div class="flex items-center gap-2">
							<span class="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
								{{ t('cloud.tilesSelected', { count: selectedCount, max: maxTiles }) }}
							</span>
							<VButton outline color="gray" size="sm" :loading="tilesLoading" @click="loadTiles">
								{{ t('cloud.tilesRefresh') }}
							</VButton>
						</div>
					</div>

					<div v-if="tilesLoading" class="mt-4 text-xs text-gray-500 dark:text-gray-400">{{ t('cloud.tilesLoading') }}</div>
					<div v-else-if="tilesError" class="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">{{ tilesError }}</div>
					<template v-else-if="tiles">
						<p v-if="!tiles.devices.length" class="mt-4 text-xs text-gray-500 dark:text-gray-400">{{ t('cloud.tilesEmpty') }}</p>
						<div v-else class="mt-4 space-y-4">
							<section v-for="device of tiles.devices" :key="device.deviceId">
								<div class="mb-2 flex flex-wrap items-center gap-2">
									<span class="text-xs font-semibold text-gray-900 dark:text-white">{{ device.name }}</span>
									<span class="text-[10px] text-gray-400">{{ device.ip }}</span>
									<span v-if="!device.online" class="rounded bg-gray-500/10 px-1.5 py-0.5 text-[10px] text-gray-400">{{ t('cloud.offline') }}</span>
								</div>
								<div v-if="device.tiles.length" class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
									<label
										v-for="tile of device.tiles"
										:key="tile.key"
										class="flex cursor-pointer items-start gap-2 rounded-md border border-transparent bg-white/[0.03] px-2.5 py-2 text-xs transition hover:border-primary/25"
										:class="selected.has(tile.key) ? 'border-primary/30 bg-primary/[0.06]' : ''"
									>
										<input
											type="checkbox"
											class="mt-0.5 accent-primary"
											:checked="selected.has(tile.key)"
											:disabled="!selected.has(tile.key) && selectedCount >= maxTiles"
											@change="toggleTile(tile)"
										/>
										<span class="min-w-0">
											<span class="block truncate font-medium text-gray-900 dark:text-white">{{ tile.name }}</span>
											<span class="block truncate text-[10px] text-gray-500 dark:text-gray-400">{{ displayValue(tile) }}</span>
										</span>
									</label>
								</div>
								<p v-else class="text-[11px] text-gray-500 dark:text-gray-400">{{ t('cloud.tilesDeviceEmpty') }}</p>
							</section>
						</div>

						<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
							<p class="text-[11px] text-gray-500 dark:text-gray-400">{{ t('cloud.tilesLimit', { max: maxTiles }) }}</p>
							<div class="flex items-center gap-2">
								<span v-if="tilesSaved" class="text-[11px] text-emerald-500">{{ t('cloud.tilesSaved') }}</span>
								<VButton color="blue" size="sm" :loading="savingTiles" @click="saveTiles">{{ t('cloud.tilesSave') }}</VButton>
							</div>
						</div>
					</template>
				</div>

				<p class="text-xs text-gray-500 dark:text-gray-400">{{ t('cloud.connectedHint') }}</p>

				<VButton color="red" size="sm" :loading="action === 'disconnect'" @click="disconnect">{{ t('cloud.disconnect') }}</VButton>
			</div>

			<div v-else-if="status.state === 'pairing'" class="space-y-5">
				<div>
					<p class="text-sm font-medium text-gray-900 dark:text-white">{{ t('cloud.pairTitle') }}</p>
					<p class="mt-1 max-w-2xl text-xs leading-relaxed text-gray-500 dark:text-gray-400">{{ t('cloud.pairHint') }}</p>
				</div>

				<div class="rounded-md border border-primary/25 bg-primary/5 px-4 py-6 text-center">
					<p class="text-[10px] uppercase tracking-[0.2em] text-gray-400">{{ t('cloud.code') }}</p>
					<p class="mt-2 font-mono text-4xl font-black tracking-[0.18em] text-primary">{{ status.code || '—' }}</p>
					<p class="mt-3 text-xs text-gray-500 dark:text-gray-400">{{ remaining }}</p>
				</div>

				<p v-if="status.lastError" class="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">{{ status.lastError }}</p>

				<div class="flex flex-wrap gap-2">
					<VButton outline color="gray" size="sm" :loading="action === 'disconnect'" @click="disconnect">{{ t('cloud.cancel') }}</VButton>
				</div>
			</div>

			<div v-else class="space-y-5">
				<div>
					<p class="text-sm font-medium text-gray-900 dark:text-white">{{ t('cloud.disconnected') }}</p>
					<p class="mt-1 max-w-2xl text-xs leading-relaxed text-gray-500 dark:text-gray-400">{{ t('cloud.disconnectedHint') }}</p>
				</div>

				<p v-if="status.lastError" class="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">
					{{ t('cloud.error') }}: {{ status.lastError }}
				</p>

				<VButton color="blue" size="sm" :loading="action === 'pair'" @click="startPairing">
					{{ status.lastError ? t('cloud.retry') : t('cloud.connect') }}
				</VButton>
			</div>
		</CardMain>
	</main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { BlockBreadcrumb as VBreadcrumb, CardMain, VButton } from 'vuesp-components/components';

import type { CloudTilesResult, PublicDashboardTile } from '../../shared/dashboardTiles.ts';
import { api } from '@/utils/helpers.ts';

interface CloudStatus {
	state: 'disconnected' | 'pairing' | 'connected' | 'error';
	connected: boolean;
	pairing: boolean;
	hubId: string | null;
	name: string | null;
	url: string | null;
	code?: string;
	expiresAt?: string;
	lastError?: string;
	lastHeartbeat?: string;
}

const { t } = useI18n();
const status = ref<CloudStatus | null>(null);
const loading = ref(true);
const action = ref('');
const error = ref('');
const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | undefined;
let clock: ReturnType<typeof setInterval> | undefined;

const formatDate = (value?: string): string => (value ? new Date(value).toLocaleString('ru-RU') : '—');

const tiles = ref<CloudTilesResult | null>(null);
const selected = ref<Set<string>>(new Set());
const tilesLoading = ref(false);
const tilesError = ref('');
const savingTiles = ref(false);
const tilesSaved = ref(false);

const maxTiles = computed(() => tiles.value?.max ?? 20);
const selectedCount = computed(() => selected.value.size);

const displayValue = (tile: PublicDashboardTile): string => {
	const value = tile.valueTo ?? tile.value;
	if (value === undefined || value === null || value === '') return '—';
	return String(value);
};

const loadTiles = async (): Promise<void> => {
	if (status.value?.state !== 'connected') return;

	tilesLoading.value = true;
	tilesError.value = '';
	try {
		const result = await api.get<CloudTilesResult>('/cloud/tiles');
		tiles.value = result;
		selected.value = new Set(result.selected);
		tilesSaved.value = false;
	} catch (caught) {
		tilesError.value = caught instanceof Error ? caught.message : t('cloud.tilesLoadError');
	} finally {
		tilesLoading.value = false;
	}
};

const toggleTile = (tile: PublicDashboardTile): void => {
	if (!tiles.value) return;

	const next = new Set(selected.value);
	if (next.has(tile.key)) {
		next.delete(tile.key);
	} else if (next.size >= tiles.value.max) {
		return;
	} else {
		next.add(tile.key);
	}

	selected.value = next;
	tilesSaved.value = false;
};

const saveTiles = async (): Promise<void> => {
	if (!tiles.value || savingTiles.value) return;

	savingTiles.value = true;
	tilesError.value = '';
	tilesSaved.value = false;
	try {
		await api.put('/cloud/tiles', { body: JSON.stringify({ tiles: [...selected.value] }) });
		tilesSaved.value = true;
	} catch (caught) {
		tilesError.value = caught instanceof Error ? caught.message : t('cloud.tilesError');
	} finally {
		savingTiles.value = false;
	}
};

watch(
	() => status.value?.state,
	state => {
		if (state === 'connected') {
			if (!tiles.value) void loadTiles();
			return;
		}
		tiles.value = null;
		selected.value = new Set();
		tilesSaved.value = false;
	}
);

const remaining = computed(() => {
	const expiresAt = status.value?.expiresAt;
	if (!expiresAt) return '';
	const ms = new Date(expiresAt).getTime() - now.value;
	if (ms <= 0) return t('cloud.expired');
	const total = Math.ceil(ms / 1000);
	const minutes = Math.floor(total / 60);
	const seconds = total % 60;
	return t('cloud.expires', { time: `${minutes}:${String(seconds).padStart(2, '0')}` });
});

const load = async (silent = false): Promise<void> => {
	if (!silent) loading.value = true;
	error.value = '';
	try {
		status.value = await api.get<CloudStatus>('/cloud');
	} catch (caught) {
		error.value = caught instanceof Error ? caught.message : t('cloud.loadError');
	} finally {
		loading.value = false;
	}
};

const startPairing = async (): Promise<void> => {
	action.value = 'pair';
	error.value = '';
	try {
		status.value = await api.post<CloudStatus>('/cloud/pair');
	} catch (caught) {
		error.value = caught instanceof Error ? caught.message : t('cloud.pairError');
	} finally {
		action.value = '';
	}
};

const disconnect = async (): Promise<void> => {
	action.value = 'disconnect';
	error.value = '';
	try {
		status.value = await api.post<CloudStatus>('/cloud/disconnect');
	} catch (caught) {
		error.value = caught instanceof Error ? caught.message : t('cloud.disconnectError');
	} finally {
		action.value = '';
	}
};

onMounted(() => {
	void load();
	timer = setInterval(() => void load(true), 3000);
	clock = setInterval(() => {
		now.value = Date.now();
	}, 1000);
});

onUnmounted(() => {
	if (timer) clearInterval(timer);
	if (clock) clearInterval(clock);
});
</script>
