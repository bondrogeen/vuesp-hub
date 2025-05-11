<template>
  <transition name="slide">
    <div v-if="value" class="z-20 fixed top-0 h-[100dvh] w-full left-0 flex flex-col" @wheel.stop>
      <div class="absolute h-full w-full top-0 left-0 bg-gray-900/70" @click="onClose"></div>

      <div class="flex-auto flex align-center p-4">
        <div class="m-auto w-full bg-white dark:bg-gray-800 shadow-lg flex flex-col rounded-lg z-30" :class="getClass">
          <div class="flex justify-between px-4 py-2 border-b dark:border-gray-700 border-gray-200">
            <h4>
              <slot name="header">{{ title }}</slot>
            </h4>

            <button class="transition dark:text-gray-600 dark:hover:text-gray-400 text-gray-300 hover:text-gray-600">
              <IconClose class="h-5 w-5" @click="onClose"></IconClose>
            </button>
          </div>

          <div class="px-4 py-2 flex-auto scroll-none">
            <slot>
              <div v-html="message"></div>
            </slot>
          </div>

          <div v-if="$slots.footer || callback" class="px-4 py-2 flex justify-end">
            <slot name="footer">
              <VButton color="blue" size="small" @click="onButton">{{ button }}</VButton>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue';

interface Props {
  value?: boolean;
  title?: string;
  message?: string;
  callback?: () => void;
  button?: string;
  size?: string;
}

const { value = false, title = 'Attention !', message = '', callback, button = 'OK', size = 'sm' } = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close', value: Event): void;
}>();

const sizes: { [index: string]: string } = { sm: 'max-w-[330px]', md: 'max-w-[600px]', lg: 'max-w-[960px]' };

const getClass = computed(() => [`${sizes?.[size] || ''}`]);

const onClose = (e: Event) => emit('close', e);

const onButton = (e: Event) => {
  if (callback) callback();
  onClose(e);
};
</script>
