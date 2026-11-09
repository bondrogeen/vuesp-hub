<script setup lang="ts">
import { computed } from 'vue';
import { VisionIcon } from 'vuesp-components/components';

import { tileViewIcon } from '../../../shared/dashboardTiles.ts';

const { name } = defineProps<{ name?: string }>();

const icon = computed(() => tileViewIcon(name));
</script>

<template>
	<VisionIcon :name="icon" class="size-full" />
</template>
