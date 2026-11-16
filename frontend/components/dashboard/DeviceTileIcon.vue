<script setup lang="ts">
import { computed } from 'vue';
import { VIcon } from 'vuesp-components/components';

import { tileViewIcon } from '../../../shared/dashboardTiles.ts';

const { name } = defineProps<{ name?: string }>();

const icon = computed(() => tileViewIcon(name));
</script>

<template>
	<VIcon :name="icon" class="size-full" />
</template>
