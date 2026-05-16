import { createRouter, createWebHistory } from 'vue-router'
import StageView from '../views/StageView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: StageView,
    },
  ],
})

export default router
