<template>
  <main class="flex-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
    <VBreadcrumb :items="[{ name: t('common.home'), path: '/' }, { name: t('admin.users') }]" class="mb-6" />

    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">{{ t('admin.users') }}</h1>
        <p class="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">{{ t('admin.usersHint') }}</p>
      </div>

      <VButton color="blue" @click="openCreate">{{ t('admin.addUser') }}</VButton>
    </div>

    <p v-if="error" role="alert" class="mb-5 rounded-md border border-red-400/50 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200">
      {{ error }}
    </p>

    <CardMain :title="t('admin.users')" :loading="isLoading">
      <template #header>
        <span class="text-xs text-gray-500 dark:text-gray-400">{{ t('admin.total', { count: users.length }) }}</span>
      </template>

      <div v-if="!isLoading && !users.length" class="py-10 text-center">
        <p class="text-sm font-medium text-gray-900 dark:text-white">{{ t('admin.emptyTitle') }}</p>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('admin.emptyHint') }}</p>
      </div>

      <div v-else class="hidden md:block">
        <VTable :headers="headers" :items="users">
          <template #username="{ item }">
            <div class="flex items-center gap-3">
              <span class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[var(--accent-blue)] text-xs font-semibold uppercase text-white">
                {{ item.username.slice(0, 2) }}
              </span>
              <span class="font-medium text-gray-900 dark:text-white">{{ item.username }}</span>
            </div>
          </template>

          <template #role="{ item }">
            <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium" :class="roleClass(item.role)">
              {{ t(`admin.roles.${item.role}`) }}
            </span>
          </template>

          <template #action="{ item }">
            <div class="flex justify-end gap-2">
              <VButton size="sm" color="gray" @click="openEdit(item)">{{ t('admin.edit') }}</VButton>
              <VButton size="sm" color="red" :disabled="item.id === currentUserId" @click="confirmDelete(item)">{{ t('common.remove') }}</VButton>
            </div>
          </template>
        </VTable>
      </div>

      <ul class="divide-y divide-gray-200 md:hidden dark:divide-gray-800">
        <li v-for="item in users" :key="item.id" class="flex items-center gap-3 py-4">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[var(--accent-blue)] text-xs font-semibold uppercase text-white">
            {{ item.username.slice(0, 2) }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium text-gray-900 dark:text-white">{{ item.username }}</p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t(`admin.roles.${item.role}`) }}</p>
          </div>
          <button type="button" class="rounded-md px-2 py-1 text-sm font-medium text-primary hover:bg-blue-50 dark:hover:bg-blue-950/40" @click="openEdit(item)">
            {{ t('admin.edit') }}
          </button>
        </li>
      </ul>
    </CardMain>

    <VDialog v-if="dialog" :title="dialogTitle" size="md" @close="closeDialog">
      <div class="grid grid-cols-1 gap-3">
        <VTextField v-model="form.username" :label="t('admin.username')" autocomplete="off" />
        <VTextField
          v-model="form.password"
          :label="editing ? t('admin.newPassword') : t('admin.password')"
          type="password"
          autocomplete="new-password"
        />
        <p class="-mt-1 text-xs text-gray-500 dark:text-gray-400">
          {{ editing ? t('admin.passwordHint') : t('admin.passwordRule') }}
        </p>

        <VSelect :model-value="roleLabel" :items="roleOptions" :label="t('admin.role')" @change="onRole" />
      </div>

      <p v-if="formError" class="mt-2 text-sm text-red-600 dark:text-red-400">{{ formError }}</p>

      <div class="mt-2 flex justify-end gap-3">
        <VButton outline color="gray" @click="closeDialog">{{ t('admin.cancel') }}</VButton>
        <VButton color="blue" :loading="isSaving" :disabled="isSaving" @click="save">
          {{ editing ? t('admin.save') : t('admin.create') }}
        </VButton>
      </div>
    </VDialog>

    <VDialog v-if="deleting" :title="t('admin.deleteTitle')" size="sm" @close="deleting = null">
      <p class="text-sm text-gray-600 dark:text-gray-300">{{ t('admin.deleteMessage', { username: deleting.username }) }}</p>
      <div class="mt-5 flex justify-end gap-3">
        <VButton outline color="gray" @click="deleting = null">{{ t('admin.cancel') }}</VButton>
        <VButton color="red" :loading="isDeleting" :disabled="isDeleting" @click="removeUser">{{ t('common.remove') }}</VButton>
      </div>
    </VDialog>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  BlockBreadcrumb as VBreadcrumb,
  CardMain,
  VButton,
  VDialog,
  VSelect,
  VTable,
  VTextField,
} from 'vuesp-components/components';

import { api } from '@/utils/helpers.ts';
import { getUserId } from '@/utils/auth.ts';
import type { IListItem } from 'vuesp-components/types';
import type { ManagedUser, UserRole } from '@/types';
import { userRoles } from '@/types';

const { t } = useI18n();

const users = ref<ManagedUser[]>([]);
const isLoading = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const error = ref('');
const formError = ref('');
const dialog = ref(false);
const editing = ref<ManagedUser | null>(null);
const deleting = ref<ManagedUser | null>(null);
const currentUserId = getUserId();

const form = reactive({ username: '', password: '', role: 'user' as UserRole });

const headers = [
  { name: t('admin.username'), key: 'username', className: 'min-w-50' },
  { name: t('admin.role'), key: 'role', className: 'w-40' },
  { name: '', key: 'action', className: 'w-48' },
];

const roleOptions = computed<IListItem<UserRole>[]>(() =>
  userRoles.map(role => ({ name: t(`admin.roles.${role}`), value: role })),
);
const roleLabel = computed(() => t(`admin.roles.${form.role}`));
const dialogTitle = computed(() => (editing.value ? t('admin.editUser') : t('admin.addUser')));

const roleClass = (role: UserRole) => {
  if (role === 'admin') return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300';
  if (role === 'user') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
  return 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300';
};

const load = async () => {
  isLoading.value = true;
  error.value = '';
  try {
    users.value = await api.get<ManagedUser[]>('/users');
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('admin.loadFailed');
  } finally {
    isLoading.value = false;
  }
};

const openCreate = () => {
  editing.value = null;
  form.username = '';
  form.password = '';
  form.role = 'user';
  formError.value = '';
  dialog.value = true;
};

const openEdit = (user: ManagedUser) => {
  editing.value = user;
  form.username = user.username;
  form.password = '';
  form.role = user.role;
  formError.value = '';
  dialog.value = true;
};

const closeDialog = () => {
  if (isSaving.value) return;
  dialog.value = false;
};

const onRole = ({ value }: IListItem<unknown>) => {
  if (value === 'admin' || value === 'user' || value === 'viewer') form.role = value;
};

const save = async () => {
  formError.value = '';
  if (!form.username.trim()) {
    formError.value = t('admin.usernameRequired');
    return;
  }
  if (!editing.value && form.password.length < 6) {
    formError.value = t('admin.passwordRule');
    return;
  }

  isSaving.value = true;
  try {
    if (editing.value) {
      const body: Record<string, unknown> = { username: form.username, role: form.role };
      if (form.password) body.password = form.password;
      await api.patch<ManagedUser>(`/users/${editing.value.id}`, { body: JSON.stringify(body) });
    } else {
      await api.post<ManagedUser>('/users', {
        body: JSON.stringify({ username: form.username, password: form.password, role: form.role }),
      });
    }
    dialog.value = false;
    await load();
  } catch (cause) {
    formError.value = cause instanceof Error ? cause.message : t('admin.saveFailed');
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = (user: ManagedUser) => {
  deleting.value = user;
};

const removeUser = async () => {
  if (!deleting.value) return;
  isDeleting.value = true;
  try {
    await api.delete(`/users/${deleting.value.id}`);
    deleting.value = null;
    await load();
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : t('admin.deleteFailed');
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  void load();
});
</script>
