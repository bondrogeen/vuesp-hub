<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="[{ name: 'Home', path: '/' }, { name: 'List' }]" class="mb-6" />
{{ getPath }}
    <iframe class="w-full h-[calc(100%-30px)]" :src="getPath" frameborder="0"></iframe>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

console.log(route.params.path);

const getPath = computed(() => `http://${route.params.path}`);

onMounted(() => {
  const iframe = document.querySelector('iframe');
  if (iframe) {
    console.log(iframe);

    // Отправить сообщение
    // iframe.contentWindow.postMessage(
    //   { type: 'myEvent', data: 'Hello' },
    //   '*' // Домен iframe (или '*' для любого)
    // );

    setTimeout(() => {
      iframe.src = `http://${route.params.path}`;
    }, 3000);
  }
});
</script>
