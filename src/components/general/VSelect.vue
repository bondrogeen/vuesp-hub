<template>
  <VDropdown class="relative w-full" v-bind="$attrs">
    <template #activator="{ on, show }">
      <VTextField :key="value" :model-value="value" :title="value" readonly active hide-message :label="label" @click="on.click" @on-icon="on.click">
        <template #icon>
          <IconSelect class="transition duration-500 ease-in-out" :class="getClass(show)"></IconSelect>
        </template>
      </VTextField>
    </template>

    <VList v-slot="{ item }" :list="list" @click="onChange">
      <slot :item="item">{{ item.name }}</slot>
    </VList>
  </VDropdown>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

import IconSelect from '@/components/icons/IconSelect';
import VTextField from '@/components/general/VTextField';
import VDropdown from '@/components/general/VDropdown';
import VList from '@/components/general/VList';

defineProps({
  value: { type: String, default: '' },
  modelValue: { type: [String, Number], default: '' },
  valueName: { type: String, default: 'name' },
  label: { type: String, default: '' },
  list: { type: Array, default: () => [] },
});

const emit = defineEmits(['change']);

const onChange = e => emit('change', e);
const getClass = show => ({ 'rotate-180': show });
</script>
