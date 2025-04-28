<template>
  <VCard class="grid grid-cols-2 lg:grid-cols-1 gap-8 lg:max-w-[360px]">
    <div class="flex justify-center">
      <div class="relative size-40">
        <svg class="size-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" class="stroke-current text-gray-200 dark:text-neutral-700" stroke-width="4"></circle>
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            class="stroke-current text-blue-500 hover:text-secondary transition"
            stroke-width="4"
            stroke-dasharray="100"
            :stroke-dashoffset="100 - percent"
            stroke-linecap="round"
          ></circle>
        </svg>

        <div class="absolute top-1/2 start-1/2 transform -translate-y-1/2 -translate-x-1/2">
          <span class="text-center text-2xl font-bold text-blue-600 dark:text-blue-500">{{ percent }}%</span>
        </div>
      </div>
    </div>

    <div class="text-body flex flex-col justify-center gap-2">
      <div v-for="(item, key) in date" :key="key" class="grid grid-cols-2">
        <div class="text-gray-400">{{ key }}:</div>
        <div class="font-bold">{{ item }}</div>
      </div>
    </div>
  </VCard>
</template>

<script setup>
import { ref, computed, defineProps, onMounted } from 'vue';
import { toByte, secToTime } from '@/utils/func/';

import VCard from '@/components/general/VCard';

const props = defineProps({
  id: { type: Number, default: 0 },
  firmware: { type: Array, default: () => [] },
  totalBytes: { type: Number, default: 0 },
  usedBytes: { type: Number, default: 0 },
  uptime: { type: Number, default: 0 },
});

const time = ref(props.uptime);

const getFirmware = computed(() => props.firmware.join('.'));

const date = computed(() => ({
  Used: toByte(props.usedBytes),
  Available: toByte(props.totalBytes - props.usedBytes),
  Total: toByte(props.totalBytes),
  Uptime: secToTime(time.value),
  ID: props.id.toString(16),
  Firmware: getFirmware.value,
}));

const percent = computed(() => Math.round((props.usedBytes * 100) / props.totalBytes));

const timeUp = () => {
  time.value++;
  setTimeout(timeUp, 1000);
};

onMounted(() => {
  timeUp();
});
</script>
