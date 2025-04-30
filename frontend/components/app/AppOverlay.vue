<template>
  <div class="fixed h-full w-full top-0 left-0 z-20">
    <div class="absolute h-full w-full top-0 left-0 bg-gray-900 opacity-40"></div>
    
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <slot></slot>
    </div>
  </div>
</template>
