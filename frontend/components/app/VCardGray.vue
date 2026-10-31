<template>
  <section class="relative rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6" :class="{ 'overflow-hidden': loading }">
    <div v-if="loading" class="absolute inset-0 z-10 bg-gray-50/50 dark:bg-gray-900/50" aria-hidden="true"></div>
    <header class="mb-6 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ title }}</h2>
      <slot name="header" />
    </header>
    <div class="max-w-full" :inert="disabled" :aria-disabled="disabled || undefined">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: 'Title',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});
</script>
