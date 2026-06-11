import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { RefreshTokenResponse } from '@/types/auth'
import { showSessionExpired } from '@/common/utils/toast'
import { useAuthStore } from '@/stores/auth'
import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/common/utils/storage'

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let isAppMounted = false
let refreshQueue: Array<(token: string) => void> = []

export function setAppMounted() {
  isAppMounted = true
}

function syncAuthStoreFromStorage() {
  const authStore = useAuthStore()

  authStore.accessToken = getAccessToken()
  authStore.refreshToken = getRefreshToken()
  authStore.user = null
}

function notifySessionExpired() {
  if (!isAppMounted) return
  showSessionExpired()
}

function processQueue(token: string) {
  refreshQueue.forEach((callback) => callback(token))
  refreshQueue = []
}

function rejectQueue() {
  refreshQueue = []
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error)
    }

    if (originalRequest.url?.includes('/auth/refresh')) {
      clearAuthStorage()
      syncAuthStoreFromStorage()
      notifySessionExpired()
      return Promise.reject(error)
    }

    if (originalRequest._retry) {
      return Promise.reject(error)
    }

    const refreshToken = getRefreshToken()

    if (!refreshToken) {
      clearAuthStorage()
      syncAuthStoreFromStorage()
      notifySessionExpired()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          resolve(api(originalRequest))
        })

        setTimeout(() => reject(error), 15_000)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post<RefreshTokenResponse>(
        `${baseURL}/auth/refresh`,
        { refreshToken },
      )

      setTokens(data.accessToken, data.refreshToken)

      const authStore = useAuthStore()
      authStore.accessToken = data.accessToken
      authStore.refreshToken = data.refreshToken

      processQueue(data.accessToken)
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      rejectQueue()
      clearAuthStorage()
      syncAuthStoreFromStorage()
      notifySessionExpired()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
