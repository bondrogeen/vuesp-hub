<template>
  <div class="h-full flex flex-col">
    <div class="flex-1 mt-6">
      <VMainMenu class="flex items-center flex-col gap-6" @route="onClose" />
    </div>

    <div class="flex items-center flex-col mb-6">
      <div v-for="(item, key) in data" :key="key">
        {{ key }}:
        
        <span class="text-gray-400 text-body">{{ item }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineEmits, defineProps } from 'vue';

import VMainMenu from '@/components/general/VMainMenu';
const props = defineProps({
  state: { type: Boolean, default: false },
  info: { type: Object, default: () => {} },
});
const emit = defineEmits(['close']);

const data = computed(() => ({
  Frimware: (props.info?.firmware || []).join('.'),
  'Chip ID': (props.info?.id || '').toString(16),
  'Total Bytes': props.info?.totalBytes || '',
  'Used Bytes': props.info?.usedBytes || '',
}));
const onClose = value => emit('close', value);
</script>
