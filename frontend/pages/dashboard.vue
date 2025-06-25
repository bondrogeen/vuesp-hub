<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <div class="grid grid-cols-1 gap-4">
      {{ devices }}
      <VCardGray v-for="item of list" :key="item.id" :title="item.name" disabled>
        <div class="grid grid-cols-[repeat(auto-fill,_minmax(120px,_1fr))] gap-4">
          <div v-for="(item, i) of item.list" :key="item.id" :class="i === 2 ? '' : ''">
            <component :is="getComponent(item)" v-bind="item" :value="getState(item.id)" @setState="setStateValue" @edit="onDialog(item)"></component>
          </div>
        </div>
      </VCardGray>
    </div>
  </main>
</template>
<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';

import type { TypeVuespData, TypePropertyString } from '@/legacy-data/types.ts';
import type { Ref } from 'vue';

import { functionToString } from '@/legacy-data/utils.ts';
import { VuespData } from '@/legacy-data/VuespData';
import { pathListDef, pathList } from '@/utils/const.ts';

import { useWebSocketStore } from '@/stores/WebSocketStore.js';

const webSocketStore = useWebSocketStore();
const { menus, list, main, devices } = storeToRefs(webSocketStore);

const dialogItem = ref(false);
const dialogObject = ref(false);
const isNew = ref(false);

const item: Ref<TypePropertyString> = ref({ id: '', name: '', keyValue: '' });

interface TypeList {
  id: number;
  name: string;
}

const data: Ref<TypeVuespData | null> = ref(null);

const getList = computed(() => data.value?.getList?.());

const setState = (id: string, value: any, options?: any) => {
  data.value?.set(id, value);
  const { device } = data.value?.getData();
  onSend('DEVICE', { ...device, ...options });
};

const getState = (id: string) => {
  return data.value?.get(id);
};

const onSend = (key: string, data?: any) => {
  webSocketStore.onSend(key, data);
};

// watch(
//   () => main.value,
//   (main) => {
//     data.value?.setData(main);
//   }
// );

onMounted(async () => {
  // data.value = new VuespData(list.value);
  // webSocketStore.onSend('DEVICE');
});

const getComponent = ({ type = 'info' }) => `card-${type}`;

const setStateValue = ({ id, value }: TypeProperty) => {
  console.log(id, value);
  
  // setState(id, value);
};

const onDialog = (data: TypeProperty) => {
  item.value = functionToString({ ...data });
  dialogItem.value = true;
  isNew.value = false;
};
</script>
