import type { TypeVuespData, TypePropertyString } from '@/legacy-data/types.ts';
import type { Ref } from 'vue';

import { onMounted, ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { loadModule, saveModule } from '@/utils/fs.ts';
import { VuespData } from '@/legacy-data/VuespData';
import { pathListDef, pathList } from '@/utils/const.ts';

import { useWebSocketStore } from '@/stores/WebSocketStore.ts';

export const useModule = () => {
  const webSocketStore = useWebSocketStore();
  const { main } = storeToRefs(webSocketStore);

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

  const onEditItem = (item: TypePropertyString) => {
    if (!item.id) return;
    data.value?.editItem(item.id, { ...item });
  };

  const onRemoveItem = (item: TypePropertyString) => {
    if (!item.id) return;
    data.value?.removeItem(item.id);
  };

  const onRestore = async () => {
    const module = await loadModule(pathListDef);
    data.value = new VuespData(module.default);
    onSend('DEVICE');
  };

  const onSaveModule = async () => {
    const content = data?.value?.saveList();
    if (content) {
      await saveModule(pathList, content);
    }
  };

  const onSaveDef = () => {
    const device = main.value.device;
    onSend('DEVICE', { ...device, command: 4 });
  };

  const onSend = (key: string, data?: any) => {
    webSocketStore.onSend(key, data);
  };

  watch(
    () => main.value,
    (main) => {
      data.value?.setData(main);
    }
  );

  const initModule = async (path: string) => {
    try {
      let module: { default: any };
      module = await loadModule(path);
      return module;
    } catch (error) {
      console.warn(error);
      return;
    }
  };

  onMounted(async () => {
    let module: { default: any } | undefined;

    module = await initModule(`/fs?file=${pathList}`);
    if (!module) {
      module = await initModule(pathListDef);
    }
    data.value = new VuespData(module?.default);
    webSocketStore.onSend('DEVICE');
  });

  return { main, data, getList, getState, setState, onSaveModule, onRemoveItem, onEditItem, onRestore, onSaveDef, onSend };
};
