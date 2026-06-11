export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  staffCode?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}

export interface LoginPayload {
  email: string
  password: string
}
