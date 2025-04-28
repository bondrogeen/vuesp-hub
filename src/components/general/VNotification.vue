<template>
  <div class="w-full min-w-[260px] max-w-xs p-4 bg-white rounded-lg shadow-lg dark:bg-gray-800" role="alert">
    <div class="flex items-center gap-4 text-body">
      <div class="flex-auto">
        {{ text }}
      </div>

      <span v-if="isProgressDone" class="text-green-600">Done</span>

      <button class="transition text-gray-400 self-start hover:text-gray-600" @click="emit('close', item)">
        <IconClose class="h-4 w-4"></IconClose>
      </button>
    </div>
    
    <div v-if="isProgress" class="w-full bg-gray-200 rounded-full dark:bg-gray-700 mt-2">
      <div class="bg-blue-600 text-small font-medium text-blue-100 text-center leading-none rounded-full" :style="`width: ${getPercent}%`">{{ getPercent }}%</div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, onMounted, computed } from 'vue';

import IconClose from '@/components/icons/IconClose';

const props = defineProps({
  text: { type: String, default: '' },
  empty: { type: Number, default: 0 },
  id: { type: Number, default: 0 },
  length: { type: Number, default: 0 },
  size: { type: Number, default: 0 },
  status: { type: Number, default: 0 },
  timeout: { type: Number, default: 0 },
  progress: { type: Object, default: () => ({}) },
  notifications: { type: Array, default: () => [] },
});

const emit = defineEmits(['close']);

const getPercent = computed(() => (props.status ? Math.ceil((props.size * 100) / props.length) : 100));
const isProgress = computed(() => Boolean(props.length));
const isProgressDone = computed(() => Boolean(isProgress.value && getPercent.value === 100 && !props.status));

onMounted(() => {
  const timeout = props.timeout;
  if (timeout) {
    setTimeout(() => {
      emit('close', { ...props });
    }, timeout * 1000);
  }
});
</script>
