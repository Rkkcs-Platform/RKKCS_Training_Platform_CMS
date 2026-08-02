import { api } from './api'

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  staffCode: string
  role?: 'user' | 'admin'
}

export interface CreatedUserResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    name: string
    email: string
    role: string
    status: string
    staffCode?: string
  }
}

export async function createUser(payload: CreateUserPayload) {
  const { data } = await api.post<CreatedUserResponse>('/auth/register', payload)
  return data
}
