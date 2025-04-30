<template>
  <header class="bg-blue-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700 fixed top-0 left-0 w-full z-10">
    <div class="px-4 py-4 sm:px-6 lg:px-8">
      <div class="container mx-auto flex flex-auto">
        <div class="h-[30px] me-10">
          <router-link to="/">
            <IconLogo class="h-[30px]"></IconLogo>
          </router-link>
        </div>

        <div class="hidden lg:flex">
          <VMainMenu class="flex items-center gap-6 font-bold" />
        </div>

        <div class="flex-auto"></div>

        <div class="hidden lg:flex gap-4">
          <VDropdown left="unset" right="0" top="calc(100%)">
            <template #activator="{ on }">
              <IconEsp @click="on.click"></IconEsp>
            </template>

            <VList v-slot="{ item }" class="py-2 rounded-lg" :list="listMenu" @click="onMenu">
              <IconLogout v-if="item.icon === 'logout'" class="h-4"></IconLogout>

              <IconDark v-if="item.icon === 'dark'"></IconDark>

              <IconLight v-if="item.icon === 'light'"></IconLight>

              <span class="ms-2">{{ item.name }}</span>
            </VList>
          </VDropdown>
        </div>

        <div class="flex items-center justify-center lg:hidden" @click.stop="onDrawer">
          <IconBurger></IconBurger>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, defineEmits, defineProps, inject } from 'vue';

import VMainMenu from '@/components/general/VMainMenu';
import VDropdown from '@/components/general/VDropdown';
import VList from '@/components/general/VList';

import IconLogo from '@/components/icons/IconLogo';
import IconBurger from '@/components/icons/IconBurger';
import IconEsp from '@/components/icons/IconEsp';
import IconLogout from '@/components/icons/IconLogout';
import IconDark from '@/components/icons/IconDark';
import IconLight from '@/components/icons/IconLight';

const props = defineProps({
  state: { type: Boolean, default: false },
  changeTheme: { type: Function, default: () => {} },
});
const emit = defineEmits(['drawer']);
const theme = inject('theme');

const listMenu = computed(() => [
  { name: 'Theme', icon: !theme.value ? 'dark' : 'light' },
  { name: 'Logout', icon: 'logout' },
]);
const onDrawer = e => emit('drawer', e);
const onLogout = async () => await fetch('/', { method: 'get', headers: { Authorization: 'Basic AAAAAAAAAAAAAAAAAAA=' } });
const onMenu = ({ name }) => {
  if (name == 'Logout') onLogout();
  if (name == 'Theme') props.changeTheme();
};
</script>
