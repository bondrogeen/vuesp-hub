<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <!-- <VBreadcrumb :items="[{ name: 'Device', path: '/' }, { name: 'List' }]" /> -->

    <VCardGray title="Devices">
      <template #header>
        <div class="flex flex-col gap-3 sm:flex-row">
          <VButton type="icon" @click="onScan">
            <IconSearch></IconSearch>
          </VButton>
          <VButton type="icon" @click="rebootService">
            <IconUpdate></IconUpdate>
          </VButton>
        </div>
      </template>

      <VTable :headers="headers" :items="items" @click="addDevice">
        <template #header="{ item }">
          {{ item.name }}
        </template>

        <template #status="{ item }">
          <div class="w-1 h-5 rounded-full" :class="getStatus(item, devices)"></div>
        </template>

        <template #ip="{ item }">
          <a :href="`http://${item.ip}`" target="_blank" @click.stop="">{{ item.ip }}</a>
        </template>

        <template #action="{ item }">
          <div class="flex-auto flex justify-end">
            <v-dropdown left="unset" right="0" top="0">
              <template #activator="{ on }">
                <v-button type="icon" color="gray" class="flex" @click.stop="on.click()">
                  <icon-dots />
                </v-button>
              </template>

              <v-list :list="listMenu" @click="onMenu($event, item)" />
            </v-dropdown>
          </div>
        </template>
      </VTable>
    </VCardGray>
    {{ devices }}
    {{ connection }}
    <AppDialog v-if="showDialog" title="Add device" size="sm" @close="onClose">
      <DialogAddDevice :device="device" :scan="onScan" @add="onAddDevice" />
    </AppDialog>
  </main>
</template>

<script setup lang="ts">
import type { Ref } from 'vue';
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';

import { api } from '@/utils/helpers.ts';

import AppDialog from '@/components/app/AppDialog.vue';

import DialogAddDevice from '@/components/device/DialogAddDevice.vue';

import { useWebSocketStore } from '@/stores/WebSocketStore';

const webSocketStore = useWebSocketStore();

const { connection, devices } = storeToRefs(webSocketStore);

interface TypeDevice {
  id: number;
  name: string;
  ip: string;
}

interface TypeMenu {
  name: string;
  icon: string;
  type: number;
}

const enum EnumMenu {
  REMOVE = 1,
  VIEW = 2,
}

const headers = [
  { key: 'status', name: 'Status', className: 'w-15' },
  { key: 'name', name: 'Name', className: 'w-40' },
  { key: 'ip', name: 'IP', className: 'w-40' },
  { key: 'deviceId', name: 'ID', className: 'w-40' },
  // { key: 'password', name: 'Password', className: 'w-40' },
  { key: 'action', name: '', className: 'w-40' },
];

const device: Ref<TypeDevice> = ref({
  id: 0,
  name: '',
  ip: '',
});

const items: Ref<TypeDevice[]> = ref([]);

const listMenu = [
  { name: 'Delete', type: EnumMenu.REMOVE },
  { name: 'View', type: EnumMenu.VIEW },
];

const showDialog = ref(false);

const getStatus = ({ deviceId }, devices) => {
  if (!devices?.[deviceId]) {
    return 'bg-gray-500';
  }
  if (devices?.[deviceId]?.PING?.delta > 5000) {
    return 'bg-red-500';
  } else {
    return 'bg-green-500';
  }
};

const addDevice = ({ item }) => {
  // const { name, ip } = item;
  device.value = item;
  showDialog.value = true;
};

const onClose = () => {
  showDialog.value = false;
};

const onScan = async () => {
  const res = await api.get('/device/scan/');
  const devices = items.value.map((i) => i.ip);
  items.value = res.filter((i: string) => !devices.includes(i));
};

const onRemoveDevice = async ({ id }: TypeDevice) => {
  try {
    let res = await api.delete(`/device/${id}/`);
    items.value = items.value.filter((i) => i.id !== id);
    return res;
  } catch (error) {
    console.error(error);
  }
};

const onAddDevice = async (device: TypeDevice) => {
  try {
    await api.post('/device/', { body: JSON.stringify(device) });
    await getAllDevices();
    onClose();
  } catch (error) {
    console.error(error);
  }
};

const getAllDevices = async () => {
  try {
    items.value = await api.get('/device/');
  } catch (error) {
    console.error(error);
  }
};

const onMenu = (e: TypeMenu, device: TypeDevice) => {
  if (e.type === EnumMenu.REMOVE) {
    onRemoveDevice(device);
  }
};

const rebootService = async () => {
  await webSocketStore.stopService();
  await webSocketStore.startService();
};

onMounted(async () => {
  await getAllDevices();

  webSocketStore.sendDevice({ ip: '192.0.2.132', comm: 'INFO' });
});
</script>
