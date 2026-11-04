<template>
  <div>
    <VBreadcrumb :items="[{ name: t('common.home'), path: '/' }, { name: t('common.video') }]" />

    <div class="grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-3">
      <CardVideo>
        <video ref="videoElement" controls autoplay muted width="800"></video>
      </CardVideo>
      <CardVideo />
      <CardVideo />
      <CardVideo />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { BlockBreadcrumb as VBreadcrumb } from 'vuesp-components/components';
import { io } from 'socket.io-client';

import CardVideo from '@/components/cards/CardVideo.vue';
import { getToken } from '@/utils/auth.ts';

const { t } = useI18n();
const videoElement = useTemplateRef<HTMLVideoElement>('videoElement');

let socket: ReturnType<typeof io> | null = null;
let sourceBuffer: SourceBuffer | null = null;

const initMediaSource = (): void => {
  const video = videoElement.value;
  const mediaSource = new MediaSource();

  mediaSource.addEventListener('sourceopen', () => {
    sourceBuffer = mediaSource.addSourceBuffer('video/mp2t; codecs="avc1.42E01E, mp4a.40.2"');
  });

  if (video) video.src = URL.createObjectURL(mediaSource);
};

const init = (): void => {
  socket = io({ transports: ['websocket'], path: '/ws/stream/', auth: { token: getToken() } });

  socket.on('stream', (data: ArrayBuffer) => {
    if (sourceBuffer && !sourceBuffer.updating) {
      sourceBuffer.appendBuffer(new Uint8Array(data));
    }
  });
};

onMounted(() => {
  initMediaSource();
  init();
});

onBeforeUnmount(() => {
  socket?.disconnect();
  socket = null;
  sourceBuffer = null;
});
</script>
