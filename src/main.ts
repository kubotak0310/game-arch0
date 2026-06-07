/**
 * アプリのエントリーポイント。
 *
 * Pinia には `pinia-plugin-persistedstate` を組み込み、`progress` ストア等の
 * `persist: true` 指定で localStorage 永続化が有効になる。
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import router from './router/index.ts'
import './style.css'
import App from './App.vue'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

createApp(App)
  .use(pinia)
  .use(router)
  .mount('#app')
