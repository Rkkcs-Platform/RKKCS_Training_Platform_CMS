import { api } from './api'
import type {
  AdminOrderDetail,
  AdminOrderListResponse,
  AdminProduct,
  AdminProductListResponse,
  ReprocessJobResponse,
  UpdateOrderPayload,
} from '@/types/order'

export async function fetchAdminOrders(params?: {
  page?: number
  limit?: number
}) {
  const { data } = await api.get<AdminOrderListResponse>('/admin/orders', {
    params,
  })
  return data
}

export async function fetchAdminOrderById(id: string) {
  const { data } = await api.get<AdminOrderDetail>(`/admin/orders/${id}`)
  return data
}

export async function updateAdminOrder(id: string, payload: UpdateOrderPayload) {
  const { data } = await api.patch<AdminOrderDetail>(
    `/admin/orders/${id}`,
    payload,
  )
  return data
}

export async function reprocessBatch(
  challengeId: string,
  force = false,
) {
  const { data } = await api.post<ReprocessJobResponse>(
    `/admin/batches/${challengeId}/reprocess`,
    { force },
  )
  return data
}

export async function fetchAdminProducts(params?: {
  page?: number
  limit?: number
  shopId?: string
}) {
  const { data } = await api.get<AdminProductListResponse>('/admin/products', {
    params,
  })
  return data
}

export async function createAdminProduct(payload: {
  shopId: string
  productCode: string
  name: string
  price: number
  description?: string
  isDefault?: boolean
}) {
  const { data } = await api.post<AdminProduct>('/admin/products', payload)
  return data
}

export async function updateAdminProduct(
  id: string,
  payload: Partial<{
    name: string
    price: number
    description: string
    status: string
    isDefault: boolean
  }>,
) {
  const { data } = await api.patch<AdminProduct>(
    `/admin/products/${id}`,
    payload,
  )
  return data
}
