import { createRouter, createWebHistory } from 'vue-router';
import { routes, handleHotUpdate } from "vue-router/auto-routes";

console.log(routes);

const addMeta = (routeRecords: typeof routes) => {
  for (const route of routeRecords) {
    route.meta ??= {}
    console.log(route.path);

    const routeName = typeof route.name === 'string' ? route.name : route.path;
    if (routeName.includes('/auth')) {
      route.meta.layout = 'LayoutEmpty'
    } else if (routeName.includes('/dashboard')) {
      route.meta.layout = 'LayoutEmpty'
    } else {
      route.meta.layout = 'LayoutMain'
    }
    if (route.children) {
      addMeta(route.children as typeof routes)
    }
  }
}

addMeta(routes)


const router = createRouter({
  linkActiveClass: 'text-primary',
  linkExactActiveClass: 'text-primary',
  history: createWebHistory('/'),
  routes,
  scrollBehavior() {
    //to, from, savedPosition
    return { top: 0, behavior: 'smooth' };
  },
});

if (import.meta.hot) {
  handleHotUpdate(router);
}

export default router;