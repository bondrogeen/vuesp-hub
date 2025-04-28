import { createRouter, createWebHistory } from 'vue-router';
import { routes, handleHotUpdate } from "vue-router/auto-routes";

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