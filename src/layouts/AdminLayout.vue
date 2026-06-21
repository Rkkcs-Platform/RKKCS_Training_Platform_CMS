<script setup lang="ts">
import { LogOut } from 'lucide-vue-next'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { APP_LABELS } from '@/common/constants/messages'
import { showLogoutSuccess } from '@/common'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const tabs = [
  { label: APP_LABELS.nav.todayCodes, name: 'today-codes' },
  { label: APP_LABELS.nav.userHistory, name: 'user-history' },
  { label: APP_LABELS.nav.setting, name: 'setting' },
]

async function handleLogout() {
  await authStore.logout()
  showLogoutSuccess()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-svh bg-background">
    <header class="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div class="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div class="min-w-0">
          <p class="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {{ APP_LABELS.adminPanel }}
          </p>
          <p class="truncate text-sm font-semibold sm:text-base">
            {{ authStore.user?.name }}
          </p>
        </div>

        <Button variant="outline" size="sm" @click="handleLogout">
          <LogOut class="size-4" />
          <span class="hidden sm:inline">Đăng xuất</span>
        </Button>
      </div>

      <div class="mx-auto grid w-full max-w-5xl grid-cols-3 gap-2 px-4 pb-3 sm:px-6">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.name"
          :to="{ name: tab.name }"
          :class="
            cn(
              'rounded-lg border px-3 py-2 text-center text-sm font-medium transition',
              route.name === tab.name
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-foreground hover:bg-muted',
            )
          "
        >
          {{ tab.label }}
        </RouterLink>
      </div>
    </header>

    <main class="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
      <RouterView />
    </main>
  </div>
</template>
