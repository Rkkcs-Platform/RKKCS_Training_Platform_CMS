export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipping'
  | 'delivered'
  | 'cancelled'

export type ShipmentStatus = 'pending' | 'in_transit' | 'delivered'

export interface AdminOrderCustomer {
  id: string
  customerCode?: string
  fullName?: string
  phone?: string
  email?: string
}

export interface AdminOrderShop {
  id: string
  shopCode?: string
  shopName?: string
}

export interface AdminOrderItemLine {
  id: string
  productId: string
  productCode: string
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface AdminOrderItem {
  id: string
  shopId: string
  orderCode: string
  transactionCode: string
  amount: number
  status: OrderStatus
  customer: AdminOrderCustomer
  shop?: AdminOrderShop
  createdAt: string
}

export interface AdminOrderDetail extends AdminOrderItem {
  batchId?: string
  items?: AdminOrderItemLine[]
  payment?: {
    id: string
    paymentCode: string
    amount: number
    status: string
    method?: string
  } | null
  shipment?: {
    id: string
    shipmentCode: string
    carrier?: string
    status: string
    currentLocation?: string
    deliveryAddress?: string
    eta?: string
  } | null
}

export interface AdminOrderListResponse {
  items: AdminOrderItem[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface UpdateOrderPayload {
  status?: OrderStatus
  customer?: {
    fullName?: string
    phone?: string
    email?: string
  }
  shipment?: {
    status?: ShipmentStatus
    carrier?: string
    currentLocation?: string
    deliveryAddress?: string
  }
  items?: Array<{ productId: string; quantity: number }>
}

export interface ReprocessJobResponse {
  id: string
  batchId: string
  shopId: string
  status: string
  generatedOrders: number
  error?: string
}

export interface AdminProduct {
  id: string
  shopId: string
  shop?: { shopCode?: string; shopName?: string }
  productCode: string
  name: string
  description?: string
  price: number
  status: string
  isDefault?: boolean
}

export interface AdminProductListResponse {
  items: AdminProduct[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
