<script setup lang="ts">
import { VCard } from 'vuesp-components/components';
</script>

<template>
  <VCard variant="glass" padding="lg" class="relative min-h-60 overflow-hidden">
    <slot />
  </VCard>
</template>
