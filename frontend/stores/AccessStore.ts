import { defineStore } from 'pinia';

import { api } from '@/utils/helpers.ts';
import { getRole } from '@/utils/auth.ts';
import { canAccess, DEFAULT_ROLE_PAGES, type TAccessPage, type TRolePages } from '@/utils/access.ts';

interface EffectiveAccess {
  pages: TAccessPage[];
}

const cloneDefaultPages = (): TRolePages => JSON.parse(JSON.stringify(DEFAULT_ROLE_PAGES)) as TRolePages;

export const useAccessStore = defineStore('access', {
  state: () => ({
    loaded: false,
    pages: cloneDefaultPages(),
    /** Effective pages for the current user: per-user override or role defaults. */
    effective: [...DEFAULT_ROLE_PAGES[getRole()]],
  }),
  getters: {
    can: state => (path: string): boolean => canAccess(getRole(), path, state.effective),
  },
  actions: {
    async load(force = false): Promise<void> {
      if (this.loaded && !force) return;
      try {
        const [roles, me] = await Promise.all([
          api.get<TRolePages>('/access'),
          api.get<EffectiveAccess>('/access/me'),
        ]);
        if (roles?.user && roles?.viewer) this.pages = roles;
        if (Array.isArray(me?.pages)) this.effective = me.pages;
      } catch {
        // Keep the defaults if the hub is still starting or auth is unavailable.
        this.effective = [...this.pages[getRole()]];
      } finally {
        this.loaded = true;
      }
    },
    async save(next: Pick<TRolePages, 'user' | 'viewer'>): Promise<void> {
      this.pages = await api.put<TRolePages>('/access', { body: JSON.stringify(next) });
      this.effective = [...this.pages[getRole()]];
    },
    toggle(role: 'user' | 'viewer', page: TAccessPage): void {
      const current = this.pages[role];
      this.pages[role] = current.includes(page) ? current.filter(item => item !== page) : [...current, page];
    },
  },
});
