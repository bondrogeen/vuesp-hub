import { createRouter, createWebHistory } from 'vue-router';
import { routes, handleHotUpdate } from 'vue-router/auto-routes';

import { getToken } from '@/utils/auth.ts';

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

router.beforeEach(to => {
  if (to.path.startsWith('/device/') && to.path !== '/device/' && !to.path.endsWith('/')) {
    return { path: `${to.path}/`, query: to.query, hash: to.hash };
  }

  const token = getToken();
  const isAuthRoute = to.path.startsWith('/auth');

  if (isAuthRoute) {
    if (token && to.path === '/auth/login') return { path: '/' };
    return true;
  }

  if (!token) {
    return { path: '/auth/login', query: { redirect: to.fullPath } };
  }

  return true;
});

if (import.meta.hot) {
  handleHotUpdate(router);
}

export default router;
