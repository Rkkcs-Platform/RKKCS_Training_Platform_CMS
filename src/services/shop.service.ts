import { api } from './api'

export type ShopStatus = 'active' | 'inactive'

export interface ShopOwnerSummary {
  id: string
  name: string
  email: string
  staffCode?: string
}

export interface ShopItem {
  id: string
  shopCode: string
  shopName: string
  status: ShopStatus
  ownerId: string
  owner?: ShopOwnerSummary
  createdAt?: string
  updatedAt?: string
}

export interface ShopListResponse {
  items: ShopItem[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export async function fetchShops(params?: { page?: number; limit?: number }) {
  const { data } = await api.get<ShopListResponse>('/admin/shops', { params })
  return data
}

export async function createShop(payload: {
  shopCode: string
  shopName: string
  ownerId: string
  status?: ShopStatus
}) {
  const { data } = await api.post<ShopItem>('/admin/shops', payload)
  return data
}

export async function fetchShopUsers() {
  const { data } = await api.get<
    Array<{
      id: string
      name: string
      email: string
      staffCode?: string
      status: string
      shopId?: string
      shopCode?: string
      shopName?: string
      isShopOwner: boolean
    }>
  >('/admin/shops/users')
  return data
}

export async function ensureShopForUser(payload: {
  userId: string
  shopCode: string
  shopName: string
}) {
  const { data } = await api.post<ShopItem>(
    '/admin/shops/ensure-for-user',
    payload,
  )
  return data
}

export async function updateShop(
  shopId: string,
  payload: Partial<{
    shopCode: string
    shopName: string
    ownerId: string
    status: ShopStatus
  }>,
) {
  const { data } = await api.patch<ShopItem>(`/admin/shops/${shopId}`, payload)
  return data
}
