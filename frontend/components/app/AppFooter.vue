<template>
  <footer class="py-4 px-4 bg-blue-50 dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700">
    <div class="flex items-center justify-between container mx-auto">
      <div class="md:flex items-center flex-wrap gap-4 text-body">
        <div class="">
          <span class="text-gray-400 me-4">© 2021 - {{ new Date().getFullYear() }}</span>
          <span class="font-bold">Vuesp-app</span>
        </div>
      </div>

      <div>
        <a class="hover:text-primary transition" href="https://github.com/bondrogeen/vuesp-app" target="_blank">GitHub</a>
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
