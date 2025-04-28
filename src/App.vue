<template>
  <div class="h-[100dvh] min-h-full flex flex-col">
    <main class="px-4 py-6 sm:px-6 lg:px-8 flex-auto">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
</script>

<style lang="scss"></style>
