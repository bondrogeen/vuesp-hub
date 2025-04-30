<template>
  <div v-outside="outside" class="relative">
    <div class="flex items-center cursor-pointer">
      <slot name="activator" :on="{ click: onClick }" :show="isShown"></slot>
    </div>
    
    <transition name="slide">
      <div v-if="isShown" class="z-10 min-w-full absolute overflow-auto shadow-lg" :style="getStyle" @click="onClick">
        <slot :show="onShow" :hide="hide" :is-shown="isShown"></slot>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';

const props = defineProps({
  top: { type: String, default: 'calc(100% + 5px)' },
  left: { type: String, default: '0' },
  right: { type: String, default: '' },
  hideOnClick: { type: Boolean, default: true },
  height: { type: String, default: '200px' },
});

const emit = defineEmits(['click', 'show', 'close']);

const isShown = ref(false);
const getStyle = computed(() => ({ top: props.top, left: props.left, right: props.right, 'max-height': props.height }));

const outside = () => {
  if (isShown.value) hide();
};
const onClick = () => {
  if (!isShown.value) onShow();
  else if (props.hideOnClick) hide();
  emit('click', isShown.value);
};
const onShow = e => {
  isShown.value = true;
  emit('show', e);
};
const hide = e => {
  isShown.value = false;
  emit('close', e);
};
</script>
