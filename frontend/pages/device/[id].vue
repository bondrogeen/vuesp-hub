<template>
  <main class="flex-auto max-w-(--breakpoint-2xl)">
    <iframe class="w-full h-full" :src="getPath" frameborder="0"></iframe>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const getPath = computed(() => `http://${route.params.id}/?theme=dark`);

// onMounted(() => {
//   const iframe = document.querySelector('iframe');
//   if (iframe) {
//     console.log(iframe);

//     // Отправить сообщение
//     // iframe.contentWindow.postMessage(
//     //   { type: 'myEvent', data: 'Hello' },
//     //   '*' // Домен iframe (или '*' для любого)
//     // );

//     setTimeout(() => {
//       iframe.src = `http://${route.params.id}/device/settings/`;
//     }, 3000);
//   }
// });
</script>
