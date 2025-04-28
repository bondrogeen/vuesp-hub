<template>
  <ul>
    <li v-for="{ name, path } of routers" :key="name" class="first-letter:uppercase hover:text-primary transition text-3xl lg:text-base">
      <router-link :to="path" @click="onRoute">{{ name }}</router-link>
    </li>
  </ul>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { computed, defineEmits } from 'vue';
const emit = defineEmits(['route']);

const router = useRouter();
const routers = computed(() => (router?.options?.routes || []).filter(i => i.path !== '/' && !i.path.includes(':')));
const onRoute = e => emit('route', e);
</script>
