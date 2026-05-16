import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import router from './router/index.ts'
import { ja } from './locales/ja.ts'
import { en } from './locales/en.ts'
import './style.css'
import App from './App.vue'

const pinia = createPinia()

const i18n = createI18n({
  legacy: false,
  locale: 'ja',
  fallbackLocale: 'en',
  messages: { ja, en },
})

createApp(App)
  .use(pinia)
  .use(router)
  .use(i18n)
  .mount('#app')
