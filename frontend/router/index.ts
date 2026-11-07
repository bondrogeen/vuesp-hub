import { createRouter, createWebHistory } from 'vue-router';
import { routes, handleHotUpdate } from 'vue-router/auto-routes';

import { getMustChangePassword, getToken } from '@/utils/auth.ts';
import { useAccessStore } from '@/stores/AccessStore.ts';

const addMeta = (routeRecords: typeof routes): void => {
  for (const route of routeRecords) {
    route.meta ??= {};
    if (!route.meta.layout) {
      const routeName = typeof route.name === 'string' ? route.name : route.path;
      route.meta.layout = routeName.includes('/auth') ? 'LayoutEmpty' : 'LayoutMain';
    }
    if (route.children) addMeta(route.children as typeof routes);
  }
};

const appRoutes = [
  ...routes,
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/404.vue'),
    meta: { layout: 'LayoutEmpty' },
  },
] as typeof routes;

addMeta(appRoutes);

const router = createRouter({
  linkActiveClass: 'text-primary',
  linkExactActiveClass: 'text-primary',
  history: createWebHistory('/'),
  routes: appRoutes,
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' };
  },
});

router.beforeEach(async to => {
  if (to.path.startsWith('/device/') && to.path !== '/device/' && !to.path.endsWith('/')) {
    return { path: `${to.path}/`, query: to.query, hash: to.hash };
  }

  const token = getToken();
  const mustChangePassword = getMustChangePassword();
  const isAuthRoute = to.path.startsWith('/auth');

  if (isAuthRoute) {
    if (!token) {
      return to.path === '/auth/login' ? true : { path: '/auth/login' };
    }
    if (mustChangePassword && to.path !== '/auth/change-password') {
      return { path: '/auth/change-password' };
    }
    if (!mustChangePassword && to.path === '/auth/change-password') {
      return { path: '/' };
    }
    if (to.path === '/auth/login') return { path: mustChangePassword ? '/auth/change-password' : '/' };
    return true;
  }

  if (!token) {
    return { path: '/auth/login', query: { redirect: to.fullPath } };
  }

  if (mustChangePassword) {
    return { path: '/auth/change-password' };
  }

  const access = useAccessStore();
  if (!access.loaded) await access.load();
  if (!access.can(to.path)) {
    return { path: '/403', query: { from: to.fullPath } };
  }

  return true;
});

if (import.meta.hot) {
  handleHotUpdate(router);
}

export default router;
