import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RefreshTokenResponse,
} from '@/types/auth'
import { api } from './api'

export async function loginRequest(payload: LoginPayload) {
  const { data } = await api.post<AuthResponse>('/auth/login', payload)
  return data
}

export async function logoutRequest() {
  const { data } = await api.post<{ message: string }>('/auth/logout')
  return data
}

export async function refreshTokenRequest(refreshToken: string) {
  const { data } = await api.post<RefreshTokenResponse>('/auth/refresh', {
    refreshToken,
  })
  return data
}

export async function fetchProfileRequest() {
  const { data } = await api.get<AuthUser>('/auth/me')
  return data
}
