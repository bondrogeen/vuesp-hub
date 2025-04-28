<template>
  <div class="p-4">
    <h5 class="mb-2">Update</h5>

    <div class="mb-4 flex items-center">
      <div class="md:flex flex-auto gap-4">
        <h6 class="text-gray-400">Firmware:</h6>

        <VTextFieldFile v-slot="{ files }" accept=".bin" @change="onUpdateFirmware">
          <span>{{ getFileNames(files) }}</span>
        </VTextFieldFile>
      </div>
      <v-button class="min-w-[100px]" size="small" :disabled="isDisabledFirmware" @click="onSureFlash('firmware')">Update</v-button>
    </div>

    <div class="flex items-center gap-4 mb-4">
      <div class="md:flex flex-auto gap-4">
        <h6 class="text-gray-400">LittleFS:</h6>

        <VTextFieldFile v-slot="{ files }" accept=".bin" @change="onUpdateLittleFS">
          <span>{{ getFileNames(files) }}</span>
        </VTextFieldFile>
      </div>

      <v-button class="min-w-[100px]" size="small" :disabled="isDisabledLittleFS" @click="onSureFlash('LittleFS')">Update</v-button>
    </div>

    <h5 class="mb-2">Reboot</h5>

    <div class="flex items-center mb-4">
      <div class="flex-auto text-gray-400">Reboot device</div>

      <v-button class="min-w-[100px]" size="small" @click="emit('reboot')">Reboot</v-button>
    </div>

    <h5 class="mb-2">Reset</h5>

    <div class="flex items-center mb-4">
      <div class="flex-auto text-gray-400">Reset configuration</div>

      <v-button class="min-w-[100px]" size="small" @click="emit('reset')">Reset</v-button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, defineEmits, inject, nextTick } from 'vue';

import VTextFieldFile from '@/components/general/VTextFieldFile';

const emit = defineEmits(['done', 'reboot', 'reset']);
const dialog = inject('dialog');

const selectFile = ref({ LittleFS: null, firmware: null });
const onUpdateFirmware = e => (selectFile.value.firmware = e);
const onUpdateLittleFS = e => (selectFile.value.LittleFS = e);
const isDisabledFirmware = computed(() => Boolean(!selectFile.value?.firmware));
const isDisabledLittleFS = computed(() => Boolean(!selectFile.value?.LittleFS));

const getFileNames = files => (files.length ? files.map(i => `${i.name} (${i.size}) Byte`).join('') : 'Select a file...');
const getName = name => (selectFile.value?.[name]?.info?.files || []).map(i => `File: ${i.name} <br/> Size: ${i.size} B`).join('');

const onFlash = async name => {
  if (!selectFile.value?.[name]) return;
  const { files } = selectFile.value[name];
  const date = new FormData();
  for (let i = 0; i < files.length; i++) {
    const file = files.item(i);
    date.append(`file[${i}]`, file, `${name}.bin`);
  }
  if (!files.length) return;
  const res = await (await fetch('/update', { method: 'POST', body: date })).json();
  if (res?.state) dialog({ value: true, title: 'Done', message: 'Reboot...' });
};

const updateFirmware = () => nextTick(() => onFlash('firmware'));
const updateLittleFS = () => nextTick(() => onFlash('LittleFS'));

const onSureFlash = name =>
  dialog({
    value: true,
    message: `Are you sure you want to update the ${name}? <br/> <p class="mt-2" >${getName(name)}</p>`,
    callback: name === 'firmware' ? updateFirmware : updateLittleFS,
  });
</script>
