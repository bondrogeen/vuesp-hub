<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation" @click.self="close">
      <div class="absolute inset-0 bg-black/60" aria-hidden="true"></div>
      <section
        class="relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-900"
        :class="sizeClass"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <header class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <slot name="header">
            <h2 class="font-semibold">{{ title }}</h2>
          </slot>
          <button type="button" class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close dialog" @click="close">
            &times;
          </button>
        </header>
        <div class="flex-auto overflow-y-auto px-4 py-3">
          <slot>{{ message }}</slot>
        </div>
        <footer v-if="$slots.footer || callback" class="flex justify-end border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <slot name="footer">
            <button type="button" class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" @click="confirm">
              {{ button }}
            </button>
          </slot>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  value: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'Attention!',
  },
  message: {
    type: String,
    default: '',
  },
  callback: {
    type: Function,
    default: undefined,
  },
  button: {
    type: String,
    default: 'OK',
  },
  size: {
    type: String,
    default: 'sm',
  },
});

const emit = defineEmits(['close']);
const sizeClass = computed(() => ({
  'max-w-[330px]': props.size === 'sm',
  'max-w-[600px]': props.size === 'md',
  'max-w-[960px]': props.size === 'lg',
}));

const close = () => emit('close');
const confirm = () => {
  props.callback?.();
  close();
};
</script>
