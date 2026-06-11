import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { USER_ROLES } from '@/common/constants/roles'
import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setStoredUser,
  setTokens as persistTokens,
} from '@/common/utils/storage'
import {
  fetchProfileRequest,
  loginRequest,
  logoutRequest,
  refreshTokenRequest,
} from '@/services/auth.service'
import type { AuthUser, LoginPayload } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(getStoredUser<AuthUser>())
  const accessToken = ref<string | null>(getAccessToken())
  const refreshToken = ref<string | null>(getRefreshToken())
  const isReady = ref(false)

  const isAuthenticated = computed(
    () => Boolean(accessToken.value && user.value),
  )

  const isAdmin = computed(
    () => user.value?.role === USER_ROLES.admin,
  )

  function applyTokens(access: string, refresh: string) {
    accessToken.value = access
    refreshToken.value = refresh
    persistTokens(access, refresh)
  }

  function clearSession() {
    clearAuthStorage()
    accessToken.value = null
    refreshToken.value = null
    user.value = null
  }

  async function login(payload: LoginPayload) {
    const data = await loginRequest(payload)

    if (!data.accessToken || !data.user) {
      throw new Error('Invalid login response')
    }

    applyTokens(data.accessToken, data.refreshToken ?? '')
    setStoredUser(data.user)
    user.value = data.user
    return data
  }

  async function logout() {
    try {
      if (accessToken.value) {
        await logoutRequest()
      }
    } finally {
      clearSession()
    }
  }

  async function refreshSession() {
    const token = refreshToken.value

    if (!token) {
      throw new Error('Missing refresh token')
    }

    const data = await refreshTokenRequest(token)
    applyTokens(data.accessToken, data.refreshToken)
    return data
  }

  function hydrateFromStorage() {
    accessToken.value = getAccessToken()
    refreshToken.value = getRefreshToken()
    user.value = getStoredUser<AuthUser>()

    if (!accessToken.value || !user.value) {
      clearSession()
    }

    isReady.value = true
  }

  async function validateSession() {
    if (!accessToken.value) {
      return false
    }

    try {
      const profile = await fetchProfileRequest()

      if (profile.role !== USER_ROLES.admin) {
        clearSession()
        return false
      }

      user.value = profile
      setStoredUser(profile)
      return true
    } catch {
      try {
        await refreshSession()
        const profile = await fetchProfileRequest()

        if (profile.role !== USER_ROLES.admin) {
          clearSession()
          return false
        }

        user.value = profile
        setStoredUser(profile)
        return true
      } catch {
        clearSession()
        return false
      }
    }
  }

  return {
    user,
    accessToken,
    refreshToken,
    isReady,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    refreshSession,
    hydrateFromStorage,
    validateSession,
  }
})
