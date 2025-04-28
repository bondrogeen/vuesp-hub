<template>
  <label class="flex items-center cursor-pointer">
    <input type="file" class="hidden" v-bind="$attrs" @change="onChange" />
    
    <slot v-bind="selectFiles"></slot>
  </label>
</template>

<script setup>
import { ref, defineEmits } from 'vue';

const emit = defineEmits(['change']);
const selectFiles = ref({ files: [], totalSize: 0 });

const onChange = async e => {
  const files = e.target.files;
  const info = { files: [] };
  info.totalSize = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files.item(i);
    info.totalSize += file.size;
    info.files.push({ name: file.name, size: file.size });
  }
  if (!files.length) return;
  selectFiles.value = info;
  emit('change', { files, info });
};
</script>
