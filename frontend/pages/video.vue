<template>
  <div>
    <VBreadcrumb :items="[{ name: 'Home', path: '/' }, { name: 'Video' }]" />

    <div class="grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-3">
      <CardVideo>
        <video id="videoElement" controls autoplay muted width="800"></video>
      </CardVideo>
      <CardVideo />
      <CardVideo />
      <CardVideo />
    </div>
  </div>
</template>

<script setup lang="ts">
import { io } from 'socket.io-client';
import { onMounted, onUnmounted } from 'vue';

import CardVideo from '@/components/cards/CardVideo.vue';

let socket = null;
let clientsCount = 0;
clientsCount++;
console.log(23232);

let mediaSource;
let sourceBuffer;

function initMediaSource() {
  const video = document.getElementById('videoElement');
  console.log(video);

  mediaSource = new MediaSource();

  mediaSource.addEventListener('sourceopen', () => {
    sourceBuffer = mediaSource.addSourceBuffer('video/mp2t; codecs="avc1.42E01E, mp4a.40.2"');
  });
  video.src = URL.createObjectURL(mediaSource);
}

const init = () => {
  socket = io({ transports: ['websocket'], path: '/ws/stream/' });

  socket.on('connect', () => {
    console.log('connect');
  });

  socket.on('stream', (data) => {
    if (!sourceBuffer.updating) {
      console.log(data);
      const uint8Array = new Uint8Array(data);
      sourceBuffer.appendBuffer(uint8Array);
    }
  });
};

onMounted(() => {
  initMediaSource();
  init();
});

onUnmounted(() => {
  socket.disconnect();
});
</script>
