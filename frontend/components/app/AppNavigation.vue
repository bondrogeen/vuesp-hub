<template>
  <div class="fixed bottom-0 left-0 z-10 w-full h-16 bg-white border-t border-gray-200 dark:bg-gray-700 dark:border-gray-600">
    <div class="grid h-full grid-cols-3 mx-auto font-bold">
      <router-link to="/" class="transition flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary">
        <IconHome class="w-5 h-5 mb-2" />

        <span>Home</span>
      </router-link>

      <router-link to="/service" class="transition flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary">
        <IconSetting class="w-5 h-5 mb-2" />

        <span>Settings</span>
      </router-link>
      <router-link to="/profile" class="transition flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary">
        <IconProfile class="w-5 h-5 mb-2" />

        <span>Profile</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import IconProfile from '@/components/icons/IconProfile';
import IconHome from '@/components/icons/IconHome';
import IconSetting from '@/components/icons/IconSetting';
</script>
