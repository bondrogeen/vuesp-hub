<template>
  <footer class="py-4 px-4 bg-blue-50 dark:bg-gray-800">
    <div class="flex items-center justify-between container mx-auto">
      <div class="md:flex items-center flex-wrap gap-4 text-body">
        <div>© 2021 - {{ new Date().getFullYear() }} <span class="font-bold">Vuesp</span></div>

        <div>
          Firmware:
          <span class="text-gray-400">(ver.{{ getFirmware }})</span>
        </div>

        <div>
          ID:
          <span class="text-gray-400">{{ id.toString(16) }}</span>
        </div>
      </div>

      <div>
        <a class="hover:text-primary transition" href="https://github.com/bondrogeen/vuesp" target="_blank">GitHub</a>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed, defineProps } from 'vue';
const props = defineProps({
  firmware: { type: Array, default: () => [] },
  id: { type: Number, default: 0 },
});

const getFirmware = computed(() => props.firmware.join('.'));
</script>
