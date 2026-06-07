/**
 * Vue Router の設定。
 *
 * 現状はルートが 1 つだけ（`StageView` のみ）。章セレクトやプロフィールページなど
 * 追加画面が必要になったらここにルートを足す。HTML5 History モードを使用。
 */
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
