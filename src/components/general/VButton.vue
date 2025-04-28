<template>
  <button
    class="flex justify-center font-medium items-center px-4 transition disabled:opacity-50 disabled:text-gray-400 disabled:bg-transparent disabled:border-gray-400 hover:bg-secondary hover:text-white"
    :class="getClass"
    @click="onClick"
  >
    <slot></slot>
  </button>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  color: { type: String, default: 'primary' },
  size: { type: String, default: 'normal' },
  block: { type: Boolean, default: false },
});

const emit = defineEmits(['click']);
const onClick = e => emit('click', e);

const colors = {
  primary: 'bg-transparent dark:bg-gray-800 text-black dark:text-white border border-primary rounded hover:border-secondary',
};
const sizes = { normal: 'h-[40px]', small: 'h-[32px]' };
const getClass = computed(() => [colors[props.color], sizes[props.size], { 'w-full': props.block }]);
</script>
