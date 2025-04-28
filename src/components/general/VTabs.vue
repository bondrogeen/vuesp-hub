<template>
  <div>
    <ul class="sticky top-[63px] w-full flex border-b dark:border-gray-700 border-gray-200 no-scrollbar overflow-y-hidden overflow-x-auto bg-white z-10">
      <li
        v-for="item of tabs"
        :key="item.label"
        class="relative before:transition-all after:transition-all before:bg-primary after:bg-primary before:right-1/2 after:left-1/2 before:h-1 before:absolute before:bottom-0 after:h-1 after:absolute after:bottom-0"
        :class="[isActive(item.label) ? 'before:w-1/2 after:w-1/2 ' : 'before:w-0 after:w-0']"
      >
        <button class="p-4 font-bold" @click="onSelect(item)">{{ item.label }}</button>
      </li>
    </ul>

    <div>
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router';
import { ref, defineProps, defineEmits, useSlots, provide, onMounted } from 'vue';

defineProps({
  value: { type: Boolean, default: false },
});
const emit = defineEmits(['change']);

const slots = useSlots();
const router = useRouter();
const route = useRoute();

const selectedIndex = ref({});
const tabs = ref([]);

provide('selected', selectedIndex);

const isActive = label => selectedIndex.value?.label === label;

const onSelect = i => {
  selectedIndex.value = i;
  emit('change', i);
  router.push({ hash: `#${i.label}` });
};

onMounted(() => {
  const hash = route?.hash || '';
  if (slots.default) {
    setTimeout(() => {
      tabs.value = slots
        .default()
        .filter(child => child.type.__name === 'VTab')
        .map(i => i.props);

      selectedIndex.value = tabs.value.find(i => hash.includes(i.label)) || tabs.value?.[0] || {};
    }, 300);
  }
});
</script>
