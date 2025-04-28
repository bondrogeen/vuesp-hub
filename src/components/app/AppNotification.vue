<template>
  <div>
    <TransitionGroup name="list" tag="ul" class="flex flex-col gap-2">
      <VNotification v-for="item of notifications" :key="item.id" v-bind="item" @close="emit('close', item)"></VNotification>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

import VNotification from '@/components/general/VNotification';

defineProps({
  notifications: { type: Array, default: () => [] },
});

const emit = defineEmits(['close']);
</script>
