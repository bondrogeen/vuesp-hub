<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="[{ name: 'Home', path: '/' }, { name: 'List' }]" class="mb-6" />

    <VCardGray title="Devices" :loading="isLoading">
      <template #header>
        <div class="flex gap-3">
          <VButton type="icon" title="Find device" @click="onScan">
            <IconSearch class="h-5 w-5"></IconSearch>
          </VButton>

          <VButton type="icon" :disabled="!isChange" @click="rebootService">
            <IconUpdate class="h-5 w-5"></IconUpdate>
          </VButton>
        </div>
      </template>
      {{ devices }}
      <VTable :headers="headers" :items="items">
        <template #status="{ item }">
          <div class="w-1 h-5 rounded-full" :class="getStatus(item, devices)"></div>
        </template>

        <template #ip="{ item }">
          <router-link :to="`/device/${item.ip}`" @click.stop="">{{ item.ip }}</router-link>
        </template>

        <template #action="{ item }">
          <div class="flex-auto flex justify-end">
            <v-dropdown left="unset" right="0" top="0">
              <template #activator="{ on }">
                <v-button type="icon" color="gray" class="flex" @click.stop="on.click()">
                  <icon-dots />
                </v-button>
              </template>

              <v-list :list="getListMenu(item)" @click="onMenu($event, item)" />
            </v-dropdown>
          </div>
        </template>
      </VTable>
    </VCardGray>

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

import DialogAddDevice from '@/components/device/DialogAddDevice.vue';

import { useWebSocketStore } from '@/stores/WebSocketStore';

const webSocketStore = useWebSocketStore();

const { devices } = storeToRefs(webSocketStore);

interface TypeDevice {
  id: number;
  deviceId: number;
  name: string;
  ip: string;
  firmware: number[];
  isNew?: boolean;
}

interface TypeMenu {
  name: string;
  icon: string;
  type: number;
}

const enum EnumMenu {
  REMOVE = 1,
  VIEW = 2,
  ADD = 3,
}

const headers = [
  { key: 'status', name: '', className: 'w-8' },
  { key: 'name', name: 'Name', className: '' },
  { key: 'ip', name: 'IP', className: '' },
  { key: 'deviceId', name: 'ID', className: '' },
  { key: 'action', name: '', className: '' },
];

const isChange = ref(false);
const isLoading = ref(false);

const device: Ref<TypeDevice> = ref({
  id: 0,
  deviceId: 0,
  name: '',
  ip: '',
  firmware: [],
});

const items: Ref<TypeDevice[]> = ref([]);

const getListMenu = ({ isNew }) => {
  const menu = [];
  if (isNew) {
    menu.push({ name: 'Add', type: EnumMenu.ADD });
  } else {
    menu.push({ name: 'Delete', type: EnumMenu.REMOVE }, { name: 'View', type: EnumMenu.VIEW });
  }
  return menu;
};

const showDialog = ref(false);

const getStatus = ({ deviceId, isNew }, devices) => {
  if (isNew) {
    return 'bg-gray-500';
  }
  if (!devices?.[deviceId]) return 'bg-red-500';
  
  const delta = devices?.[deviceId]?.PING?.delta;
  if (delta > 5000) {
    return 'bg-red-500';
  } else {
    return 'bg-green-500';
  }
};

const addDevice = (item: TypeDevice) => {
  device.value = item;
  showDialog.value = true;
};

const onClose = () => {
  showDialog.value = false;
};

const onScan = async () => {
  isLoading.value = true;
  const res = await api.get('/device/scan/');
  const devices = items.value.map((i) => i.deviceId);
  const newDevice = res.filter((i: TypeDevice) => !devices.includes(i.deviceId)).map((i: TypeDevice) => ({ ...i, isNew: true }));
  items.value = [...newDevice, ...items.value];
  isLoading.value = false;
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
    isChange.value = true;
    items.value = items.value.map((i: TypeDevice) => (device.deviceId === i.deviceId ? { ...i, isNew: false } : i));
    await api.post('/device/', { body: JSON.stringify(device) });
    await getAllDevices();
    onClose();
  } catch (error) {
    console.error(error);
  }
};

const getAllDevices = async () => {
  try {
    const res = await api.get('/device/');

    items.value = items.value.filter((i) => i.isNew);
    items.value = [...items.value, ...res];
  } catch (error) {
    console.error(error);
  }
};

const onMenu = (e: TypeMenu, device: TypeDevice) => {
  if (e.type === EnumMenu.ADD) {
    addDevice(device);
  }
  if (e.type === EnumMenu.REMOVE) {
    onRemoveDevice(device);
    isChange.value = true;
  }
};

const rebootService = async () => {
  isChange.value = false;
  await webSocketStore.stopService();
  await webSocketStore.startService();
};

onMounted(async () => {
  await getAllDevices();

  webSocketStore.sendDeviceAll({ comm: 'INFO' });
});
</script>
