<template>
  <div >
    <div class="p-4 flex items-center border-b border-gray-200 dark:border-gray-600">
      <div class="flex gap-2 items-center font-bold flex-auto">
        <div
          v-for="(value, i) of path"
          :key="value"
          class="flex items-center gap-2 cursor-pointer text-gray-600 last:cursor-default last:text-gray-900 dark:text-gray-200 dark:last:text-white"
          @click="onPrev(i)"
        >
          <div>{{ value }}</div>

          <IconNext v-if="isLast(path, i)" class="h-4 w-4"></IconNext>
        </div>
      </div>

      <div>
        <VTextFieldFile @change="onUpload"></VTextFieldFile>

        <VDropdown right="0" left="unset" top="0">
          <template #activator="{ on }">
            <IconMenu @click="on.click"></IconMenu>
          </template>

          <VList :list="mainMenu" @click="onEventServise"></VList>
        </VDropdown>
      </div>
    </div>

    <div class="relative min-h-[260px]">
      <VLoader v-if="isLoading" class="absolute top-1/2 left-1/2 text-primary" />

      <VList v-slot="{ item: { name, size, isDir, isFile } }" :list="sortFiles">
        <div class="flex items-center flex-auto" @click="onNext(isDir, name)">
          <div class="mr-4">
            <IconFolder v-if="isDir"></IconFolder>
            <IconFile v-else></IconFile>
          </div>

          <div>
            <div class="text-body">{{ isDir ? `${name}` : name }}</div>

            <div v-if="isFile" class="text-xsmall text-gray-400">{{ toByte(size) }} ({{ size }})</div>
          </div>
        </div>

        <VDropdown right="0" left="unset" top="0">
          <template #activator="{ on }">
            <button @click="on.click">
              <IconMenu></IconMenu>
            </button>
          </template>

          <VList :list="getListMenu(isDir)" @click="onEventList(name, $event)" />
        </VDropdown>
      </VList>
    </div>
  </div>
</template>

<script setup>
import { defineProps, watchEffect, defineEmits, ref, onMounted, computed, inject, nextTick } from 'vue';
import { toByte, debounce } from '@/utils/func/';

import VTextFieldFile from '@/components/general/VTextFieldFile';
import VDropdown from '@/components/general/VDropdown';
import VLoader from '@/components/general/VLoader';
import VList from '@/components/general/VList';

import IconNext from '@/components/icons/IconNext';
import IconMenu from '@/components/icons/IconMenu';
import IconFolder from '@/components/icons/IconFolder';
import IconFile from '@/components/icons/IconFile';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  files: { type: Array, default: () => [] },
  info: { type: Object, default: () => ({}) },
  progress: { type: Object, default: () => ({}) },
  url: { type: String, default: '/fs' },
});

const emit = defineEmits(['update:modelValue', 'send']);
const dialog = inject('dialog');

const mainMenu = [
  { id: 2, name: 'Upload' },
  { id: 3, name: 'Reload' },
  { id: 4, name: 'Format' },
];
const listMenu = [
  { id: 1, name: 'Download' },
  { id: 2, name: 'Remove' },
];

const filesTemp = ref([]);
const isLoading = ref(false);

const path = computed({
  set: value => emit('update:modelValue', value),
  get: () => props.modelValue,
});

const getListMenu = isDir => listMenu.filter(i => (isDir ? i.id !== 1 : true));
const sortFiles = computed(() => JSON.parse(JSON.stringify(filesTemp.value)).sort((a, b) => (a.isFile > b.isFile ? 1 : -1)));
const getFullPath = computed(() => `${path.value.join('/').replace('root', '')}/`);
const fileName = name => `${getFullPath.value}${name}`;

const onUpdate = () => {
  isLoading.value = true;
  emit('send', { comm: 'FILES', data: { name: getFullPath.value } });
  emit('send', { comm: 'INFO' });
};

const onPrev = index => {
  if (path.value.length > index + 1) {
    path.value = path.value.filter((_, i) => i < index + 1);
    nextTick(() => onUpdate());
  }
};

const onNext = (isDir, value) => {
  if (isDir && path) {
    path.value.push(value);
    onUpdate();
  }
};

const onEventServise = ({ id }) => {
  if (id === 2) document.querySelector('input[type="file"]').click();
  if (id === 3) onUpdate();
  if (id === 4) onSureFormat();
};

const onEventList = (name, { id }) => {
  if (id === 1) onDownload(name);
  if (id === 2) onSureDelete(name);
};

const onFormat = async () => {
  const res = await (await fetch(`${props.url}?format=true`, { method: 'POST' })).json();
  if (res?.state) onUpdate();
};

const onSureFormat = () => dialog({ value: true, message: 'All files will be deleted. Are you sure?', callback: onFormat });

const onUpload = async ({ files, info }) => {
  const totalSize = info?.totalSize || 0;
  const date = new FormData();
  for (let i = 0; i < files.length; i++) {
    const file = files.item(i);
    const fileName = `${getFullPath.value}${file.name}`;
    date.append(`file[${i}]`, file, fileName);
  }
  const { totalBytes, usedBytes } = props.info;
  if (totalSize < totalBytes - usedBytes) {
    const res = await (await fetch(props.url, { method: 'POST', body: date })).json();
    if (res?.state) onUpdate();
  } else {
    dialog({ value: true, message: 'No free space' });
  }
};

const onDelete = async name => {
  const res = await (await fetch(`${props.url}?file=${fileName(name)}`, { method: 'DELETE' })).json();
  if (res?.state) onUpdate();
  else dialog({ value: true, message: 'Directory is not empty' });
};

const onSureDelete = name => {
  if (fileName(name).includes('www')) {
    dialog({ value: true, message: 'The file belongs to the "www" directory. <br/> Are you sure you want to delete it?', callback: onDelete.bind(this, name) });
  } else {
    onDelete(name);
  }
};

const onDownload = name => {
  const link = document.createElement('a');
  link.setAttribute('download', name);
  link.href = `${props.url}?file=${fileName(name)}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const isLast = (path, i) => path.length > i + 1;

const onLoad = debounce(() => {
  filesTemp.value = props.files;
  isLoading.value = false;
}, 300);

watchEffect(() => {
  onLoad(props.files);
});

onMounted(() => {
  if (!props.files.length) onUpdate();
});
</script>
