<template>
  <component :is="layout">
    <router-view />
  </component>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed, onBeforeUnmount, onMounted, watch, type Component } from 'vue';
import { useAppStore } from '@/stores/AppStore';
import { useWebSocketStore } from '@/stores/WebSocketStore';

import LayoutEmpty from '@/layouts/LayoutEmpty.vue';
import LayoutMain from '@/layouts/LayoutMain.vue';

const route = useRoute();

const layouts: Record<string, Component> = { LayoutEmpty, LayoutMain };

const layout = computed(() => layouts[String(route.meta.layout)] ?? LayoutEmpty);

const appStore = useAppStore();
const webSocketStore = useWebSocketStore();

watch(() => webSocketStore.connectionError, message => {
  if (message) appStore.setNotification({ message });
});

onMounted(() => {
  appStore.init();
  webSocketStore.connect();
});

onBeforeUnmount(() => webSocketStore.disconnect());
</script>

<style lang="scss"></style>
