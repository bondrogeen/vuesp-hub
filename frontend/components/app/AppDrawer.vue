<template>
  <div
    class="left-0 top-0 h-full overflow-hidden shadow z-[101] w-full md:w-[360px] lg:-translate-x-full transition-all"
    :class="[value ? 'translate-x-0' : '-translate-x-full', { 'fixed h-[100dvh]': position }]"
  >
    <div class="overflow-auto min-w-[360px] absolute h-full w-full border-r border-gray-300 dark:border-gray-700">
      <div class="bg-blue-50 dark:bg-gray-800 flex justify-between p-4 ">
        <button @click="changeTheme()">
          <IconDark v-if="!theme" />
          
          <IconLight v-else />
        </button>

        <div @click="onClose">
          <router-link to="/">
            <IconLogo class="h-[30px]"></IconLogo>
          </router-link>
        </div>

        <button @click="onClose">
          <IconClose></IconClose>
        </button>
      </div>

      <div class="h-[calc(100dvh-62px)] px-4 bg-white dark:bg-gray-900">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, inject } from 'vue';

import IconLogo from '@/components/icons/IconLogo';
import IconClose from '@/components/icons/IconClose';
import IconDark from '@/components/icons/IconDark';
import IconLight from '@/components/icons/IconLight';

const props = defineProps({
  value: { type: Boolean, default: false },
  position: { type: Boolean, default: true },
  changeTheme: { type: Function, default: () => {} },
});

const emit = defineEmits(['close']);
const theme = inject('theme');
const onClose = e => {
  if (props.value) {
    emit('close', e);
  }
};
</script>
