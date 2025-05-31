<template>
  <aside
    :class="sidebarToggle ? 'translate-x-0 lg:w-[90px]' : '-translate-x-full'"
    class="sidebar fixed top-0 left-0 z-9 flex h-screen w-[290px] flex-col overflow-y-auto border-r border-gray-200 px-5 transition-all duration-300 lg:static lg:translate-x-0 dark:border-gray-800 bg-blue-50 dark:bg-gray-900 -translate-x-full"
    @mouseenter="onHover(true)"
    @mouseleave="onHover(false)"
  >
    <div :class="sidebarToggle ? 'justify-center' : 'justify-between'" class="sidebar-header flex items-center gap-2 pt-6 pb-6 justify-between">
      <router-link to="/">
        <IconLogoMini v-if="sidebarToggle" class="h-[30px]" />

        <IconLogo v-else class="h-[30px]" />
      </router-link>
    </div>

    <div class="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
      <nav>
        <div v-for="{ title, items } of menu" :key="title">
          <h3 class="mb-4 text-xs leading-[20px] text-gray-400 uppercase">
            <span class="menu-group-title" :class="sidebarToggle ? 'lg:hidden' : ''">{{ title }}</span>

            <IconDots :class="sidebarToggle ? 'lg:block hidden' : 'hidden'" class="menu-group-icon mx-auto fill-current hidden" />
          </h3>

          <ul class="mb-6 flex flex-col gap-4">
            <li v-for="{ name, path, icon, children } of items" :key="name">
              <component
                :is="!children ? 'router-link' : 'span'"
                :to="path"
                class="flex gap-2 items-center px-3 py-2 rounded-lg"
                :class="isActive(path) ? 'bg-blue-500/10' : 'hover:bg-gray-500/10'"
                @click.prevent="onSelect(name)"
              >
                <component :is="getComponent(icon)" class="flex-[0_0_24px]" />

                <span class="flex-1 first-letter:uppercase" :class="sidebarToggle ? 'lg:hidden' : ''">{{ name }}</span>

                <IconChevron v-if="children" :class="[sidebarToggle ? 'lg:hidden' : '']" />
              </component>

              <div v-if="children" class="translate transform overflow-hidden" :class="selected === name ? 'block' : 'hidden'">
                <ul :class="sidebarToggle ? 'lg:hidden' : 'flex'" class="mt-2 flex flex-col gap-1 pl-9">
                  <li v-for="item of children" :key="item.name">
                    <router-link :to="item.path" class="block px-2 py-2 rounded-lg first-letter:uppercase" :class="isActive(item.path) ? 'bg-blue-500/10' : 'hover:bg-gray-500/10'">
                      {{ item.name }}
                    </router-link>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
        </div>
      </nav>

      <div class="flex-auto"></div>

      <div :class="sidebarToggle ? 'lg:hidden' : ''" class="mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.03]">
        <h3 class="mb-2 font-semibold text-gray-900 dark:text-white">Vuesp-app Dashboard</h3>

        <p class="text-theme-sm mb-4 text-gray-500 dark:text-gray-400">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Architecto, iusto nihil!</p>

        <a href="#" target="_blank" rel="nofollow" class="bg-blue-100/50 text-theme-sm hover:bg-blue-100 flex items-center justify-center rounded-lg p-3 font-medium">Purchase Plan</a>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { MenuType, MenuItemType, MenuChildType } from '@/types.js';

interface Props {
  sidebarToggle?: boolean;
  menu?: MenuType[];
}

const { sidebarToggle = false, menu = [] } = defineProps<Props>();

const emit = defineEmits<{
  (e: 'sidebar', value: boolean): void;
}>();

const components = {
  IconDashboard: 'IconDashboard',
  IconDevice: 'IconDevice',
  IconVideo: 'IconVideo',
  IconList: 'IconList',
};

const route = useRoute();

const getComponent = (name: string = 'IconDashboard') => components[name];

const onSelect = (name: string) => (selected.value = selected.value === name ? '' : name);

const isActive = (path: string) => route.fullPath.includes(path);

const selected = ref('');

const onHover = (value: boolean) => {
  if (sidebarToggle) {
    emit('sidebar', value);
  }
};

onMounted(() => {
  menu.forEach(({ items }) => {
    items.forEach((item: MenuItemType) => {
      const el = (item?.children || []).find((i: MenuChildType) => route.fullPath.includes(i.path));
      if (el) selected.value = item.name;
    });
  });
});
</script>
