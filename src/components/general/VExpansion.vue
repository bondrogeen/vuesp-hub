<template>
  <div ref="root" class="border-b dark:border-gray-700 border-gray-200">
    <div class="cursor-pointer min-h-[60px] px-4 flex items-center justify-between" @click="onActive">
      <h4>{{ label }}</h4>
      
      <div class="transition text-gray-400" :class="{ 'rotate-180': isActive }">
        <IconSelect></IconSelect>
      </div>
    </div>

    <div class="v-expansion__content max-h-0 overflow-hidden transition-all duration-300">
      <div class="p-4">
        <slot></slot>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, defineProps, onMounted } from 'vue';

import IconSelect from '@/components/icons/IconSelect';

const props = defineProps({
  label: { type: String, default: '' },
  value: { type: Boolean, default: false },
});

const root = ref(null);
const isActive = ref(props.value);

const onChange = () => {
  const content = root.value.querySelector('.v-expansion__content');
  content.style.maxHeight = isActive.value ? `${content.scrollHeight}px` : '0';
};

const onActive = () => {
  isActive.value = !isActive.value;
  onChange();
};

onMounted(() => {
  onChange();
});
</script>
