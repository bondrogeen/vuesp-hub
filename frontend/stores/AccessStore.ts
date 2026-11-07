import { defineStore } from 'pinia';

import { api } from '@/utils/helpers.ts';
import { getRole } from '@/utils/auth.ts';
import { canAccess, DEFAULT_ROLE_PAGES, type AccessPage, type RolePages } from '@/utils/access.ts';

export const useAccessStore = defineStore('access', {
  state: () => ({
    loaded: false,
    pages: JSON.parse(JSON.stringify(DEFAULT_ROLE_PAGES)) as RolePages,
  }),
  getters: {
    can: state => (path: string): boolean => canAccess(getRole(), path, state.pages),
  },
  actions: {
    async load(force = false): Promise<void> {
      if (this.loaded && !force) return;
      try {
        const pages = await api.get<RolePages>('/access');
        if (pages?.user && pages?.viewer) this.pages = pages;
      } catch {
        // Keep the defaults if the hub is still starting or auth is unavailable.
      } finally {
        this.loaded = true;
      }
    },
    async save(next: Pick<RolePages, 'user' | 'viewer'>): Promise<void> {
      this.pages = await api.put<RolePages>('/access', { body: JSON.stringify(next) });
    },
    toggle(role: 'user' | 'viewer', page: AccessPage): void {
      const current = this.pages[role];
      this.pages[role] = current.includes(page) ? current.filter(item => item !== page) : [...current, page];
    },
  },
});
