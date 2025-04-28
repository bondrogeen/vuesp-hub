<template>
  <transition name="slide">
    <div v-if="value" class="z-20 fixed top-0 h-[100dvh] w-full left-0 flex flex-col" @wheel.stop>
      <div class="absolute h-full w-full top-0 left-0 bg-gray-900 opacity-40" @click="onClose"></div>

      <div class="flex-auto flex align-center p-4">
        <div class="m-auto w-full bg-white dark:bg-gray-800 shadow-lg flex flex-col rounded-lg z-30" :class="getClass">
          <div class="flex justify-between px-4 py-2 border-b">
            <h4>
              <slot name="header">{{ title }}</slot>
            </h4>

            <button class="transition text-gray-400 hover:text-black">
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
              <v-button size="small" @click="onButton">{{ button }}</v-button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';

import IconClose from '@/components/icons/IconClose';

const props = defineProps({
  value: { type: Boolean, default: false },
  title: { type: String, default: 'Attention !' },
  message: { type: String, default: '' },
  content: { type: Object, default: () => ({}) },
  callback: { type: Function, default: null },
  button: { type: String, default: 'OK' },
  size: { type: String, default: 'sm' },
});

const emit = defineEmits(['close']);

const sizes = { sm: 'max-w-[330px]', md: 'max-w-[600px]', lg: 'max-w-[960px]' };
const getClass = computed(() => [`${sizes?.[props.size]}`]);

const onClose = e => emit('close', e);
const onButton = () => {
  if (props.callback) props.callback();
  onClose();
};
</script>
