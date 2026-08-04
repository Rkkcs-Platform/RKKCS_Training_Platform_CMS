import { api } from './api'

export interface AdminCategory {
  id: string
  categoryCode: string
  name: string
  description?: string
  status: 'active' | 'inactive'
  shopId?: string
}

export interface AdminNews {
  id: string
  title: string
  slug: string
  summary: string
  content: string
  coverImageUrl?: string
  status: 'draft' | 'published'
  publishedAt?: string
  createdAt?: string
}

export interface AdminDashboardData {
  kpis: Array<{ label: string; value: number; isCurrency?: boolean }>
  today: { batches: number; submissions: number; orders: number }
  ops: {
    pendingShipments: number
    paidPayments: number
    pendingJobs: number
    failedJobs: number
  }
  revenueTrend: Array<{ date: string; amount: number; orders: number }>
  ordersByStatus: Array<{ status: string; count: number }>
  topShops: Array<{
    shopId: string
    shopCode: string
    shopName: string
    orders: number
    revenue: number
  }>
}

export async function fetchAdminCategories(params?: {
  page?: number
  limit?: number
  status?: string
}) {
  const { data } = await api.get<{ items: AdminCategory[] }>(
    '/admin/categories',
    { params },
  )
  return data
}

export async function createAdminCategory(payload: {
  categoryCode: string
  name: string
  description?: string
  status?: string
}) {
  const { data } = await api.post<AdminCategory>('/admin/categories', payload)
  return data
}

export async function updateAdminCategory(
  id: string,
  payload: Partial<{
    name: string
    description: string
    status: string
  }>,
) {
  const { data } = await api.patch<AdminCategory>(
    `/admin/categories/${id}`,
    payload,
  )
  return data
}

export async function fetchAdminNews(params?: {
  page?: number
  limit?: number
  status?: string
}) {
  const { data } = await api.get<{ items: AdminNews[] }>('/admin/news', {
    params,
  })
  return data
}

export async function createAdminNews(payload: {
  title: string
  summary: string
  content: string
  status?: string
  coverImageUrl?: string
}) {
  const { data } = await api.post<AdminNews>('/admin/news', payload)
  return data
}

export async function updateAdminNews(
  id: string,
  payload: Partial<{
    title: string
    summary: string
    content: string
    status: string
    coverImageUrl: string
  }>,
) {
  const { data } = await api.patch<AdminNews>(`/admin/news/${id}`, payload)
  return data
}

export async function fetchAdminDashboard() {
  const { data } = await api.get<AdminDashboardData>('/admin/dashboard')
  return data
}

export async function fetchAdminRevenueReport(days = 30) {
  const { data } = await api.get('/admin/reports/revenue', {
    params: { days },
  })
  return data
}

export async function fetchAdminOrdersReport() {
  const { data } = await api.get('/admin/reports/orders')
  return data
}

export async function fetchAdminTransactionCodes(params?: {
  page?: number
  limit?: number
  date?: string
  shopId?: string
  q?: string
}) {
  const { data } = await api.get('/admin/transaction-codes', { params })
  return data
}
