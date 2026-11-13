import { createRouter, createWebHistory } from 'vue-router';
import { routes, handleHotUpdate } from 'vue-router/auto-routes';

import { getMustChangePassword, getToken } from '@/utils/auth.ts';
import { useAccessStore } from '@/stores/AccessStore.ts';
import { withTrailingSlash, withoutTrailingSlash } from '@/utils/path.ts';

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
  { path: '/alisa/', redirect: '/modules/yandex/hub/' },
  { path: '/smart-home/', redirect: '/modules/yandex/hub/' },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/404.vue'),
    meta: { layout: 'LayoutEmpty' },
  },
] as typeof routes;

addMeta(appRoutes);

const router = createRouter({
  linkActiveClass: 'text-cyan-main',
  linkExactActiveClass: 'text-cyan-main',
  history: createWebHistory('/'),
  routes: appRoutes,
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' };
  },
});

router.beforeEach(async to => {
  // Every hub URL carries a trailing slash; normalize old links before routing.
  const pathWithSlash = withTrailingSlash(to.path);
  if (pathWithSlash !== to.path) {
    return { path: pathWithSlash, query: to.query, hash: to.hash, replace: true };
  }

  const path = withoutTrailingSlash(to.path);
  const token = getToken();
  const mustChangePassword = getMustChangePassword();
  const isAuthRoute = path.startsWith('/auth');

  if (isAuthRoute) {
    if (!token) {
      return path === '/auth/login' ? true : { path: '/auth/login/' };
    }
    if (mustChangePassword && path !== '/auth/change-password') {
      return { path: '/auth/change-password/' };
    }
    if (!mustChangePassword && path === '/auth/change-password') {
      return { path: '/' };
    }
    if (path === '/auth/login') return { path: mustChangePassword ? '/auth/change-password/' : '/' };
    return true;
  }

  if (!token) {
    return { path: '/auth/login/', query: { redirect: to.fullPath } };
  }

  if (mustChangePassword) {
    return { path: '/auth/change-password/' };
  }

  const access = useAccessStore();
  if (!access.loaded) await access.load();
  if (!access.can(to.path)) {
    return { path: '/403/', query: { from: to.fullPath } };
  }

  return true;
});

if (import.meta.hot) {
  handleHotUpdate(router);
}

export default router;
