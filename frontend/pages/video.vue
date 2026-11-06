<template>
	<main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
		<VBreadcrumb :items="[{ name: t('common.home'), path: '/' }, { name: t('video.title') }]" class="mb-6" />

		<div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
			<div>
				<h1 class="text-2xl font-semibold text-gray-900 dark:text-white">{{ t('video.title') }}</h1>
				<p class="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">{{ t('video.subtitle') }}</p>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<VButton color="blue" @click="openAdd">
					{{ t('video.add') }}
				</VButton>
			</div>
		</div>

		<p v-if="error" role="alert" class="mb-5 rounded-md border border-red-400/50 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200">
			{{ error }}
		</p>

		<div v-if="isLoading && !cameras.length" class="flex justify-center py-20">
			<VLoader />
		</div>

		<div v-else-if="!cameras.length" class="glass-panel flex flex-col items-center justify-center px-6 py-16 text-center">
			<div class="grid size-12 place-items-center rounded-md bg-[var(--accent-blue)]/10 text-xl">📷</div>
			<h2 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{{ t('video.emptyTitle') }}</h2>
			<p class="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">{{ t('video.emptyText') }}</p>
			<VButton color="blue" class="mt-5" @click="openAdd">{{ t('video.add') }}</VButton>
		</div>

		<div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
			<CameraCard
				v-for="camera in cameras"
				:key="camera.id"
				:camera="camera"
				:dragging="draggingId === camera.id"
				:drag-over="dragOverId === camera.id"
				@edit="openEdit"
				@dragstart="onDragStart"
				@dragover="onDragOver"
				@dragleave="onDragLeave"
				@drop="onDrop"
				@dragend="onDragEnd"
			/>
		</div>

		<Teleport to="body">
			<div v-if="isFormOpen" class="fixed inset-0 z-30 flex items-center justify-center p-4">
				<div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeForm" />

				<div class="glass-popover relative z-10 max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-[10px] p-5">
					<div class="mb-4 flex items-center justify-between gap-3">
						<h2 class="text-base font-bold uppercase tracking-wide text-gray-900 dark:text-white">
							{{ editingId ? t('video.editTitle') : t('video.addTitle') }}
						</h2>
						<button
							type="button"
							class="grid size-8 place-items-center rounded-md text-gray-400 transition hover:bg-white/10 hover:text-white"
							aria-label="Close"
							@click="closeForm"
						>
							✕
						</button>
					</div>

					<p v-if="editingHost" class="mb-3 text-xs text-gray-500 dark:text-gray-400">
						{{ t('video.host') }}:
						<span class="font-mono text-gray-700 dark:text-gray-300">{{ editingHost }}</span>
					</p>

					<form class="flex flex-col gap-2" @submit.prevent="submitForm">
						<VTextField v-model="form.name" :label="t('video.name')" autocomplete="off" />
						<VTextField v-model="form.url" :label="t('video.url')" autocomplete="off" />
						<p class="text-xs leading-relaxed text-gray-500 dark:text-gray-400">{{ t('video.urlHint') }}</p>

						<div class="glass-inset rounded-md p-3">
							<p class="mb-2 text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{{ t('video.examples') }}</p>
							<button
								v-for="example of examples"
								:key="example.label"
								type="button"
								class="flex w-full items-center gap-2 rounded px-1 py-1 text-left transition hover:bg-white/40 dark:hover:bg-white/5"
								@click="form.url = example.url"
							>
								<span class="shrink-0 text-[10px] text-gray-400">{{ example.label }}</span>
								<span class="truncate font-mono text-[11px] text-[var(--accent-blue)]">{{ example.url }}</span>
							</button>
						</div>

						<div class="mt-2">
							<VCheckbox v-model="form.transcode">{{ t('video.transcode') }}</VCheckbox>
							<p class="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{{ t('video.transcodeHint') }}</p>
						</div>

						<p v-if="isLoadingDetail" class="text-xs text-gray-500 dark:text-gray-400">{{ t('common.refreshing') }}</p>

						<p v-if="formError" class="rounded-md border border-red-400/50 bg-red-50/80 px-3 py-2 text-xs text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200">
							{{ formError }}
						</p>

						<div class="mt-3 flex flex-wrap items-center justify-end gap-2">
							<VButton v-if="editingId" color="rose" class="mr-auto" @click="requestRemoveFromEdit">
								{{ t('video.remove') }}
							</VButton>
							<VButton color="gray" class="dark:text-white/80" @click="closeForm">{{ t('video.cancel') }}</VButton>
							<VButton color="blue" :disabled="isSaving || isLoadingDetail || !form.url.trim()" @click="submitForm">
								{{ isSaving ? t('video.saving') : editingId ? t('video.saveChanges') : t('video.save') }}
							</VButton>
						</div>
					</form>
				</div>
			</div>
		</Teleport>

		<AppDialog
			v-if="removeTarget"
			:title="t('video.removeTitle')"
			:message="t('video.removeText', { name: removeTarget.name })"
			:button="t('video.remove')"
			color="rose"
			:callback="confirmRemove"
			@close="removeTarget = null"
		/>
	</main>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { BlockBreadcrumb as VBreadcrumb, VButton, VCheckbox, VLoader, VTextField } from 'vuesp-components/components';

import AppDialog from '@/components/app/AppDialog.vue';
import CameraCard from '@/components/cameras/CameraCard.vue';
import { api } from '@/utils/helpers.ts';
import type { CameraDetail, CameraRecord } from '@/types/camera';

const { t } = useI18n();

const examples = [
	{ label: 'Hikvision', url: 'rtsp://user:password@192.168.1.10:554/Streaming/Channels/101' },
	{ label: 'Dahua', url: 'rtsp://user:password@192.168.1.10:554/cam/realmonitor?channel=1&subtype=0' },
];

const cameras = ref<CameraRecord[]>([]);
const isLoading = ref(false);
const error = ref('');
const isFormOpen = ref(false);
const isSaving = ref(false);
const isLoadingDetail = ref(false);
const formError = ref('');
const editingId = ref<string | null>(null);
const editingHost = ref('');
const removeTarget = ref<CameraRecord | null>(null);
const draggingId = ref('');
const dragOverId = ref('');

const form = reactive({
	name: '',
	url: '',
	transcode: true,
});

const messageOf = (value: unknown, fallback: string): string => (value instanceof Error ? value.message : fallback);

const load = async (): Promise<void> => {
	isLoading.value = true;
	error.value = '';
	try {
		cameras.value = await api.get<CameraRecord[]>('/cameras');
	} catch (loadError) {
		error.value = messageOf(loadError, t('video.loadError'));
	} finally {
		isLoading.value = false;
	}
};

const resetForm = (): void => {
	form.name = '';
	form.url = '';
	form.transcode = true;
	formError.value = '';
};

const openAdd = (): void => {
	editingId.value = null;
	editingHost.value = '';
	resetForm();
	isFormOpen.value = true;
};

const openEdit = async (camera: CameraRecord): Promise<void> => {
	editingId.value = camera.id;
	editingHost.value = camera.host;
	resetForm();
	form.name = camera.name;
	form.transcode = camera.transcode;
	isFormOpen.value = true;
	isLoadingDetail.value = true;

	try {
		const detail = await api.get<CameraDetail>(`/cameras/${encodeURIComponent(camera.id)}`);
		form.name = detail.name;
		form.url = detail.url;
		form.transcode = detail.transcode;
		editingHost.value = detail.host;
	} catch (detailError) {
		formError.value = messageOf(detailError, t('video.loadError'));
	} finally {
		isLoadingDetail.value = false;
	}
};

const closeForm = (): void => {
	if (isSaving.value) return;
	isFormOpen.value = false;
};

const submitForm = async (): Promise<void> => {
	if (isSaving.value || isLoadingDetail.value || !form.url.trim()) return;

	isSaving.value = true;
	formError.value = '';
	try {
		const body = JSON.stringify({
			name: form.name.trim() || undefined,
			url: form.url.trim(),
			transcode: form.transcode,
		});

		if (editingId.value) {
			await api.patch(`/cameras/${encodeURIComponent(editingId.value)}`, { body });
		} else {
			await api.post('/cameras', { body });
		}

		isFormOpen.value = false;
		resetForm();
		await load();
	} catch (saveError) {
		formError.value = messageOf(saveError, t('video.addError'));
	} finally {
		isSaving.value = false;
	}
};

const requestRemoveFromEdit = (): void => {
	const target = cameras.value.find(camera => camera.id === editingId.value);
	if (!target) return;
	isFormOpen.value = false;
	removeTarget.value = target;
};

const confirmRemove = (): void => {
	const target = removeTarget.value;
	if (!target) return;

	void (async () => {
		try {
			await api.delete(`/cameras/${encodeURIComponent(target.id)}`);
			await load();
		} catch (removeError) {
			error.value = messageOf(removeError, t('video.removeError'));
		} finally {
			removeTarget.value = null;
		}
	})();
};

const saveOrder = async (): Promise<void> => {
	try {
		await api.put('/cameras/order', {
			body: JSON.stringify({ ids: cameras.value.map(camera => camera.id) }),
		});
	} catch (orderError) {
		error.value = messageOf(orderError, t('video.loadError'));
		await load();
	}
};

const onDragStart = (camera: CameraRecord): void => {
	draggingId.value = camera.id;
};

const onDragOver = (camera: CameraRecord): void => {
	if (draggingId.value && draggingId.value !== camera.id) dragOverId.value = camera.id;
};

const onDragLeave = (camera: CameraRecord): void => {
	if (dragOverId.value === camera.id) dragOverId.value = '';
};

const onDragEnd = (): void => {
	draggingId.value = '';
	dragOverId.value = '';
};

const onDrop = (target: CameraRecord): void => {
	const from = cameras.value.findIndex(camera => camera.id === draggingId.value);
	const to = cameras.value.findIndex(camera => camera.id === target.id);

	draggingId.value = '';
	dragOverId.value = '';

	if (from < 0 || to < 0 || from === to) return;

	const next = [...cameras.value];
	const [moved] = next.splice(from, 1);
	next.splice(to, 0, moved);
	cameras.value = next;
	void saveOrder();
};

onMounted(load);
</script>
