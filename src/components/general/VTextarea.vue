<template>
  <div class="w-full relative dark:bg-gray-800">
    <label class="relative w-full min-h-[40px] border flex items-center rounded transition" :class="getClassSlot">
      <span class="absolute left-4 transition-all rounded duration-300 -translate-y-1/2 text-gray-600 dark:text-gray-400" :class="getClassLabel">
        {{ label }}
      </span>

      <textarea
        v-bind="$attrs"
        :value="modelValue"
        :disabled="disabled"
        :type="type"
        rows="2"
        wrap
        class="h-full w-full px-4 py-2 outline-none flex-auto bg-transparent"
        @focus="onFocus"
        @blur="onBlur"
        @input="onInput"
        @click="onClick"
        @keypress.enter="onEnter"
      />

      <button v-if="$slots.icon" :disabled="disabled" style="flex: 0 0 50px" class="h-full flex items-center justify-center text-gray-400 border-l border-primary" @click="onIcon">
        <slot name="icon"></slot>
      </button>
    </label>

    <div v-if="!hideMessage && message" class="text-red-500 h-[24px] px-2 text-small">
      <slot name="message">
        {{ message }}
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  modelValue: { type: [String, Number], default: null },
  label: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: 'text' },
  active: { type: Boolean, default: false },
  hideMessage: { type: Boolean, default: false },
  rules: { type: Array, default: () => [] },
  message: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue', 'click', 'on-icon', 'enter', 'blur']);

const isFocus = ref(false);

const getClassSlot = computed(() => [
  props.message ? 'border-red-500 hover:border-red-400' : '',
  props.disabled ? 'border-gray-400 opacity-50 hover:border-gray-400' : 'border-primary hover:border-secondary',
]);

const isValue = value => value || value === 0;

const after = 'after:absolute after:h-1 after:w-full after:left-0 after:translate-y-[6px] after:-z-10 after:dark:bg-gray-800 after:bg-white';

const getClassLabel = computed(() => [after, isFocus.value || isValue(props.modelValue) || props.active ? 'top-0 left-3 text-small' : 'top-1/2']);

const onInput = ({ target }) => {
  emit('update:modelValue', target.value);
};

const onBlur = e => {
  isFocus.value = false;
  emit('blur', e);
};
const onEnter = e => emit('enter', e);

const onFocus = () => (isFocus.value = true);
const onClick = e => emit('click', e);
const onIcon = e => {
  if (props.disabled) return;
  emit('on-icon', e);
};
</script>
