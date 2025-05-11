<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="[{ name: 'Device', path: '/' }, { name: 'List' }]" />

    <VCardGray title="All">
      <template #header>
        <div class="flex flex-col gap-3 sm:flex-row">
          <VButton type="" @click="onAdd">
            <IconPlus></IconPlus>
          </VButton>
        </div>
      </template>
      <table class="min-w-full">
        <thead class="border-y border-gray-100 py-3 dark:border-gray-800">
          <tr>
            <th class="py-3 font-normal whitespace-nowrap">
              <div class="flex items-center">
                <p class="text-theme-sm text-gray-500 dark:text-gray-400">Name</p>
              </div>
            </th>
            <th class="py-3 font-normal whitespace-nowrap">
              <div class="flex items-center">
                <p class="text-theme-sm text-gray-500 dark:text-gray-400">IP</p>
              </div>
            </th>
            <th class="py-3 font-normal whitespace-nowrap">
              <div class="flex items-center">
                <p class="text-theme-sm text-gray-500 dark:text-gray-400">Status</p>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="{ name, id, ip, surname } of items" :key="id">
            <td class="py-3 whitespace-nowrap">
              <div class="col-span-3 flex items-center">
                <div class="flex items-center gap-3">
                  <div class="h-8 w-8">
                    <img src="@/assets/images/product-01.jpg" alt="brand" />
                  </div>

                  <div>
                    <span class="text-theme-sm block font-medium text-gray-700 dark:text-gray-400">{{ name }}</span>
                  </div>
                </div>
              </div>
            </td>
            <td class="py-3 whitespace-nowrap">
              <div class="flex items-center">
                <p class="text-theme-sm text-gray-700 dark:text-gray-400">{{ ip }}</p>
              </div>
            </td>
            <td class="py-3 whitespace-nowrap">
              <div class="flex items-center">
                <p class="text-theme-sm text-gray-700 dark:text-gray-400">{{ surname }}</p>
              </div>
            </td>

            <td class="py-3 whitespace-nowrap">
              <div class="flex items-center justify-center">
                <VDropdown right="0" left="unset" top="0">
                  <template #activator="{ on }">
                    <VButton type="" @click="on.click">
                      <IconDots class="rotate-90"></IconDots>
                    </VButton>
                  </template>

                  <VList :list="listMenu" @click="onMenu"></VList>
                </VDropdown>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </VCardGray>

    <AppDialog title="SCAN" size="sm" :value="showDialog" @close="onClose">
      <template #footer>
        <VButton color="blue" @click="onAdd()">Save</VButton>
      </template>
    </AppDialog>
  </main>
</template>

<script setup lang="ts">
import type { Ref } from 'vue';
import { onMounted, ref } from 'vue';

import { api } from '@/utils/helpers.ts';

import AppDialog from '@/components/app/AppDialog.vue';

interface TypeDevice {
  id: number;
  name: string;
  ip: string;
}
const items: Ref<TypeDevice[]> = ref([]);

const listMenu = [
  { name: 'View', icon: 'IconDots' },
  { name: 'Delete', icon: 'IconDots' },
];

const onMenu = (e: any) => {
  console.log(e);
};

const showDialog = ref(false);

const onAdd = () => {
  showDialog.value = true;
};
const onClose = () => {
  showDialog.value = false;
};

onMounted(async () => {
  // let user = {
  //   name: 'John',
  //   surname: 'Smith',
  // };

  // let response = await fetch('/api/v1/device/', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json;charset=utf-8',
  //   },
  //   body: JSON.stringify(user),
  // });

  // let result = await response.json();
  try {
    // let response = await api.delete('/device/4/');

    items.value = await api.get('/device/');
    // items.value = await api.get('/device/2/');
  } catch (error) {
    console.log(error);
  }
});
</script>
