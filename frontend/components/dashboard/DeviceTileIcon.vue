<script setup lang="ts">
import type { Component } from 'vue';
import { computed } from 'vue';

import IconBattery from '~icons/ri/battery-line';
import IconBlaze from '~icons/ri/blaze-fill';
import IconBulb from '~icons/ri/lightbulb-line';
import IconCamera from '~icons/ri/camera-line';
import IconChart from '~icons/ri/line-chart-line';
import IconDashboard from '~icons/ri/dashboard-line';
import IconDatabase from '~icons/ri/database-line';
import IconDoor from '~icons/ri/door-line';
import IconFlashlight from '~icons/ri/flashlight-line';
import IconLock from '~icons/ri/lock-line';
import IconMapPin from '~icons/ri/map-pin-line';
import IconNotification from '~icons/ri/notification-line';
import IconOutlet from '~icons/ri/outlet-line';
import IconPlant from '~icons/ri/plant-line';
import IconPlug from '~icons/ri/plug-line';
import IconRam from '~icons/ri/ram-line';
import IconShutDown from '~icons/ri/shut-down-line';
import IconSnowflake from '~icons/ri/snowflake-line';
import IconSpeaker from '~icons/ri/speaker-line';
import IconTempCold from '~icons/ri/temp-cold-line';
import IconTimer from '~icons/ri/timer-line';
import IconTv from '~icons/ri/tv-line';
import IconVideo from '~icons/ri/video-on-line';
import IconWindy from '~icons/ri/windy-line';

const { name } = defineProps<{ name?: string }>();

const icons: Record<string, Component> = {
  shut: IconShutDown,
  plant: IconPlant,
  bulb: IconBulb,
  video: IconVideo,
  windy: IconWindy,
  camera: IconCamera,
  light: IconFlashlight,
  tv: IconTv,
  therm: IconTempCold,
  store: IconDatabase,
  socket: IconOutlet,
  plug: IconPlug,
  noti: IconNotification,
  lock: IconLock,
  chart: IconChart,
  battery: IconBattery,
  ram: IconRam,
  map: IconMapPin,
  speaker: IconSpeaker,
  timer: IconTimer,
  snow: IconSnowflake,
  blaze: IconBlaze,
  door: IconDoor,
};

const icon = computed(() => (name && icons[name]) || IconDashboard);
</script>

<template>
  <component :is="icon" class="size-full" />
</template>
