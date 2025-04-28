<template>
  <div v-if="isActive">
    <slot></slot>
  </div>
</template>

<script setup>
import { defineProps, inject, computed } from 'vue';

const props = defineProps({
  type: { type: String, default: 'VTab', requared: true },
  label: { type: String, default: '' },
  icon: { type: String, default: '' },
});

const selected = inject('selected');
const isActive = computed(() => props.label === selected.value?.label);
</script>
