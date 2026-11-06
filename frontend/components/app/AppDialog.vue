<template>
  <VDialog :title="dialogTitle" :size="size" @close="close">
    <slot>{{ message }}</slot>

    <div v-if="$slots.footer || callback" class="flex justify-end pt-4">
      <slot name="footer">
        <VButton :color="color" @click="confirm">{{ dialogButton }}</VButton>
      </slot>
    </div>
  </VDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { VButton, VDialog } from 'vuesp-components/components';

import type { AppDialogEmits, AppDialogProps } from './AppDialog.types.ts';

const { title, message = '', callback, button, color = 'blue', size = 'sm' } = defineProps<AppDialogProps>();
const emit = defineEmits<AppDialogEmits>();
const { t } = useI18n();

const dialogTitle = computed(() => title ?? t('common.attention'));
const dialogButton = computed(() => button ?? t('common.ok'));

const close = () => emit('close');
const confirm = () => {
  callback?.();
  close();
};
</script>
