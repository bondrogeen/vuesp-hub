<template>
	<article
		ref="root"
		class="glass-panel group relative select-none overflow-hidden transition"
		:class="[
			dragging ? 'opacity-40' : '',
			dragOver ? 'ring-2 ring-[var(--accent-blue)]' : '',
		]"
		@dragover.prevent="emit('dragover', camera)"
		@dragleave="emit('dragleave', camera)"
		@drop.prevent="emit('drop', camera)"
	>
		<div
			ref="player"
			class="relative aspect-video touch-manipulation bg-[#030712] [&:fullscreen]:aspect-auto [&:fullscreen]:h-screen [&:fullscreen]:w-screen"
			:title="t('video.doubleClickHint')"
			@click="onCardClick"
			@dblclick="onCardDoubleClick"
		>
			<video
				ref="video"
				class="size-full object-contain"
				muted
				playsinline
				autoplay
			/>

			<div
				class="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3 transition-opacity duration-200 max-sm:opacity-100"
				:class="detailsClass"
				@click.stop
				@dblclick.stop
			>
				<div class="flex items-center gap-2">
					<button
						type="button"
						draggable="true"
						class="grid size-7 cursor-grab place-items-center rounded-md bg-black/40 text-white/60 backdrop-blur transition hover:bg-black/60 hover:text-white active:cursor-grabbing"
						:aria-label="t('video.drag')"
						:title="t('video.drag')"
						@dragstart="onDragStart"
						@dragend="emit('dragend')"
					>
						<svg class="size-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<circle cx="9" cy="6" r="1.6" />
							<circle cx="15" cy="6" r="1.6" />
							<circle cx="9" cy="12" r="1.6" />
							<circle cx="15" cy="12" r="1.6" />
							<circle cx="9" cy="18" r="1.6" />
							<circle cx="15" cy="18" r="1.6" />
						</svg>
					</button>

					<span class="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-white/80 backdrop-blur">
						<span class="size-1.5 rounded-full" :class="statusDot" />
						{{ statusLabel }}
					</span>
				</div>

				<span v-if="state.viewers > 0" class="inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-[10px] text-white/70 backdrop-blur">
					<svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
						<path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
						<circle cx="12" cy="12" r="2.6" />
					</svg>
					{{ state.viewers }}
				</span>
			</div>

			<div v-if="state.status !== 'live'" class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#030712]/55 p-4 text-center">
				<VLoader v-if="state.status === 'starting'" />

				<button
					v-else-if="state.status === 'idle' || state.status === 'error'"
					type="button"
					class="grid size-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:scale-105 hover:bg-white/20"
					:aria-label="state.status === 'error' ? t('video.retry') : t('video.watch')"
					@click.stop="play"
				>
					<svg class="ml-0.5 size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M8 5v14l11-7z" />
					</svg>
				</button>

				<p v-if="state.status === 'error'" class="max-w-xs text-xs leading-relaxed text-rose-300">{{ state.message }}</p>
			</div>

			<div
				class="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-3 pt-10 transition-opacity duration-200 max-sm:opacity-100"
				:class="detailsClass"
				@click.stop
				@dblclick.stop
			>
				<div class="flex items-end justify-between gap-3">
					<h3 class="min-w-0 truncate text-sm font-semibold text-white">{{ camera.name }}</h3>

					<div class="flex items-center gap-1" @dblclick.stop>
						<button
							v-if="state.status === 'live' || state.status === 'starting'"
							type="button"
							class="grid size-7 place-items-center rounded-md bg-black/40 text-white/70 backdrop-blur transition hover:bg-black/60 hover:text-white"
							:aria-label="t('video.stop')"
							:title="t('video.stop')"
							@click.stop="stop"
						>
							<svg class="size-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<rect x="7" y="7" width="10" height="10" rx="1.2" />
							</svg>
						</button>

						<button
							v-if="state.status === 'live'"
							type="button"
							class="grid size-7 place-items-center rounded-md bg-black/40 text-white/70 backdrop-blur transition hover:bg-black/60 hover:text-white"
							:aria-label="isFullscreen ? t('video.exitFullscreen') : t('video.fullscreen')"
							:title="isFullscreen ? t('video.exitFullscreen') : t('video.fullscreen')"
							@click.stop="toggleFullscreen"
						>
							<svg v-if="!isFullscreen" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
							</svg>
							<svg v-else class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
							</svg>
						</button>

						<button
							type="button"
							class="grid size-7 place-items-center rounded-md bg-black/40 text-white/70 backdrop-blur transition hover:bg-black/60 hover:text-white"
							:aria-label="t('video.edit')"
							:title="t('video.edit')"
							@click.stop="emit('edit', camera)"
						>
							<svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
								<path stroke-linecap="round" d="m13.5 6.5 4 4" />
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>
	</article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { VLoader } from 'vuesp-components/components';

import { useCameraStream } from '@/composables/useCameraStream';
import type { CameraRecord } from '@/types/camera';

const props = withDefaults(defineProps<{
	camera: CameraRecord;
	autostart?: boolean;
	dragging?: boolean;
	dragOver?: boolean;
}>(), {
	autostart: true,
	dragging: false,
	dragOver: false,
});

const emit = defineEmits<{
	edit: [camera: CameraRecord];
	dragstart: [camera: CameraRecord];
	dragover: [camera: CameraRecord];
	dragleave: [camera: CameraRecord];
	drop: [camera: CameraRecord];
	dragend: [];
}>();

const { t } = useI18n();
const root = useTemplateRef<HTMLElement>('root');
const player = useTemplateRef<HTMLDivElement>('player');
const video = useTemplateRef<HTMLVideoElement>('video');
const { state, connect, disconnect } = useCameraStream(video);

let observer: IntersectionObserver | undefined;
let clickTimer: ReturnType<typeof setTimeout> | null = null;
const userStopped = ref(false);
const isFullscreen = ref(false);
const detailsOpen = ref(false);

const detailsClass = computed(() => (detailsOpen.value ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'));

const statusLabel = computed(() => ({
	idle: t('video.idle'),
	starting: t('video.starting'),
	live: t('video.live'),
	error: t('video.error'),
})[state.value.status]);

const statusDot = computed(() => ({
	idle: 'bg-white/35',
	starting: 'bg-amber-300',
	live: 'bg-emerald-400',
	error: 'bg-rose-400',
})[state.value.status]);

const play = () => {
	userStopped.value = false;
	connect(props.camera.id);
};

const stop = () => {
	userStopped.value = true;
	disconnect();
};

const onCardClick = () => {
	if (clickTimer) {
		clearTimeout(clickTimer);
		clickTimer = null;
		return;
	}

	clickTimer = setTimeout(() => {
		detailsOpen.value = !detailsOpen.value;
		clickTimer = null;
	}, 220);
};

const onDragStart = (event: DragEvent) => {
	event.dataTransfer?.setData('text/plain', props.camera.id);
	if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
	if (root.value && event.dataTransfer) event.dataTransfer.setDragImage(root.value, 24, 24);
	emit('dragstart', props.camera);
};

const onFullscreenChange = () => {
	isFullscreen.value = document.fullscreenElement === player.value;
};

const toggleFullscreen = async () => {
	const element = player.value;
	if (!element) return;

	try {
		if (document.fullscreenElement) await document.exitFullscreen();
		else await element.requestFullscreen();
	} catch {
		// Fullscreen can be blocked by browser policy; keep playback running.
	}
};

const onCardDoubleClick = () => {
	if (clickTimer) {
		clearTimeout(clickTimer);
		clickTimer = null;
	}
	void toggleFullscreen();
};

onMounted(() => {
	document.addEventListener('fullscreenchange', onFullscreenChange);

	if (props.autostart === false) return;

	observer = new IntersectionObserver((entries) => {
		if (!entries.some(entry => entry.isIntersecting) || userStopped.value) return;
		observer?.disconnect();
		observer = undefined;
		connect(props.camera.id);
	}, { rootMargin: '240px' });

	if (root.value) observer.observe(root.value);
});

onBeforeUnmount(() => {
	if (clickTimer) clearTimeout(clickTimer);
	document.removeEventListener('fullscreenchange', onFullscreenChange);
	observer?.disconnect();
	observer = undefined;
});
</script>
