<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="[{ name: 'Device', path: '/' }, { name: 'List' }]" class="mb-6" />

    <iframe class="w-full h-[calc(100%-30px)] opacity-0" :class="{ ' opacity-100': show }" :src="getPath" frameborder="0"></iframe>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

import { sendFrameMessage } from '@/utils/helpers.ts';

const route = useRoute();

const show = ref(false);

const getPath = computed(() => `http://${route.params.path}`);

watch(
  () => route.params.path,
  () => {
    console.log('23232323');
    const url: string = route.params?.path || '';
    const [device, ...all] = url.split('/');
    const path = all.join('/');
    console.log(path);

    show.value = false;
    setTimeout(() => {
      sendFrameMessage({ type: 'route', data: { path } });
    }, 800);
    setTimeout(() => {
      show.value = true;
    }, 1000);
  }
);

onMounted(() => {
  console.log('onMounted');
  const iframe = document.querySelector('iframe');
  if (iframe) {
    console.log(iframe);

    // Отправить сообщение
    // iframe.contentWindow.postMessage(
    //   { type: 'myEvent', data: 'Hello' },
    //   '*' // Домен iframe (или '*' для любого)
    // );

    // setTimeout(() => {
    //   iframe.src = `http://${route.params.path}`;
    // }, 3000);
  }
  setTimeout(() => {
    show.value = true;
  }, 2000);
});
</script>
