import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
} from 'vue-router'
import { useAuthStore } from '@/stores/auth'

function routeRequiresAuth(to: RouteLocationNormalized) {
  return to.matched.some((record) => record.meta.requiresAuth)
}

function routeRequiresAdmin(to: RouteLocationNormalized) {
  return to.matched.some((record) => record.meta.requiresAdmin)
}

function routeIsGuestOnly(to: RouteLocationNormalized) {
  return to.matched.some((record) => record.meta.guestOnly)
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        {
          path: '',
          name: 'today-codes',
          component: () => import('@/pages/TodayCodesPage.vue'),
        },
        {
          path: 'user-history',
          name: 'user-history',
          component: () => import('@/pages/UserHistoryPage.vue'),
        },
        {
          path: 'setting',
          name: 'setting',
          component: () => import('@/pages/SettingPage.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'today-codes' },
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (routeRequiresAuth(to) && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (routeRequiresAdmin(to) && authStore.isAuthenticated && !authStore.isAdmin) {
    return { name: 'login' }
  }

  if (routeIsGuestOnly(to) && authStore.isAuthenticated && authStore.isAdmin) {
    return { name: 'today-codes' }
  }

  return true
})

export default router
