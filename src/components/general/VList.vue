<template>
  <ul class="bg-white dark:bg-gray-800">
    <li
      v-for="(item, i) of list"
      :key="'list_' + i"
      class="whitespace-nowrap cursor-pointer flex items-center min-h-[40px] py-1 px-4 border-b last:border-b-0 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
      @click="onClick(item)"
    >
      <slot :item="item">{{ item.name }}</slot>
    </li>
  </ul>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
defineProps({
  list: { type: Array, default: () => [] },
});

const emit = defineEmits(['click']);
const onClick = e => emit('click', e);
</script>
