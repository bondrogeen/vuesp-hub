<template>
  <label class="inline-flex items-center cursor-pointer relative">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      class="peer h-5 w-5 transition-all appearance-none rounded border border-slate-300 checked:bg-primary checked:border-primary"
      @change="onChange"
    />

    <span class="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-[10px] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" stroke-width="1">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
      </svg>
    </span>
    
    <span class="text-body ms-2">
      <slot></slot>
    </span>
  </label>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  modelValue: { type: [Boolean, Number], default: false },
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);
const onChange = ({ target }) => emit('update:modelValue', target.checked);
</script>
