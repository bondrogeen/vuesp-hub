<template>
  <VDropdown v-bind="$attrs">
    <template #activator="{ show, on }">
      <VTextField :value="show ? search : currentUser" :placeholder="show ? 'Поиск' : placeholder" @click="on.click" @input="onInput" @focus="search = ''">
        <template #icon>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1L5 5L9 1" stroke="#ABB5BE" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </template>
      </VTextField>
    </template>

    <div>
      <VList v-slot="{ item }" :list="getList" @click="$emit('change', $event)">
        <slot :item="item">{{ item[valueName] }}</slot>
      </VList>
    </div>
    
    <div v-if="isEmpty" class="p-4 py-2">Not found</div>
  </VDropdown>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';

import VTextField from '@/components/general/VTextField';
import VDropdown from '@/components/general/VDropdown';
import VList from '@/components/general/VList';

const props = defineProps({
  value: { type: String, default: '' },
  valueName: { type: String, default: 'name' },
  placeholder: { type: String, default: '' },
  list: { type: Array, default: () => [] },
});

defineEmits(['change']);
const search = ref('');

const currentUser = computed(() => props.value);
const getList = computed(() => {
  const list = props?.list || [];
  return list.filter(i => (search.value ? i[props.valueName].toLowerCase().includes(search.value.toLowerCase()) : true));
});
const placeholder = computed(() => props.placeholder);
const isEmpty = computed(() => Boolean(!getList?.value?.length));

const onInput = e => (search.value = e.target.value);
</script>
