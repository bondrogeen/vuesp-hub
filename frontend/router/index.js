import { createRouter, createWebHistory } from 'vue-router';
import { routes, handleHotUpdate } from "vue-router/auto-routes";

console.log(routes);

const addMeta = (routes) => {
  for (const route of routes) {
    route.meta ??= {}
    console.log(route.path);

    if ((route.name || route.path).includes('/auth')) {
      route.meta.layout = 'LayoutEmpty'
    } else {
      route.meta.layout = 'LayoutMain'
    }
    if (route.children) {
      addMeta(route.children)
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