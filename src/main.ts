import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'vue-sonner/style.css'
import App from './App.vue'
import router from './router'
import { setAppMounted } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import './style.css'

async function bootstrapApp() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)

  const authStore = useAuthStore(pinia)
  authStore.hydrateFromStorage()

  app.use(router)
  await router.isReady()
  app.mount('#app')
  setAppMounted()

  const isValid = await authStore.validateSession()

  if (
    !isValid &&
    router.currentRoute.value.matched.some((record) => record.meta.requiresAuth)
  ) {
    await router.replace({
      name: 'login',
      query: { redirect: router.currentRoute.value.fullPath },
    })
  }
}

bootstrapApp().catch((error) => {
  console.error('Failed to start CMS:', error)
  document.body.innerHTML =
    '<p style="padding:24px;font-family:sans-serif">Không thể khởi động CMS. Vui lòng tải lại trang.</p>'
})
