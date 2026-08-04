<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  formatDisplayDate,
  formatDisplayTime,
  getErrorMessage,
  showError,
  showSuccess,
} from '@/common'
import { TOAST_MESSAGES } from '@/common/constants/messages'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  fetchAdminOrderById,
  fetchAdminOrders,
  updateAdminOrder,
} from '@/services/order.service'
import type {
  AdminOrderDetail,
  AdminOrderItem,
  OrderStatus,
  ShipmentStatus,
} from '@/types/order'

const items = ref<AdminOrderItem[]>([])
const selectedId = ref<string | null>(null)
const detail = ref<AdminOrderDetail | null>(null)
const isLoadingList = ref(false)
const isLoadingDetail = ref(false)
const isSaving = ref(false)

const form = reactive({
  status: 'confirmed' as OrderStatus,
  fullName: '',
  phone: '',
  email: '',
  shipmentStatus: 'pending' as ShipmentStatus,
  currentLocation: '',
  deliveryAddress: '',
  carrier: '',
})

const orderStatuses: OrderStatus[] = [
  'pending',
  'confirmed',
  'shipping',
  'delivered',
  'cancelled',
]

const shipmentStatuses: ShipmentStatus[] = [
  'pending',
  'in_transit',
  'delivered',
]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

function syncForm(order: AdminOrderDetail) {
  form.status = order.status
  const rawName = order.customer.fullName?.trim() || ''
  form.fullName =
    !rawName || /^chưa cập nhật$/i.test(rawName) || /^customer\s+/i.test(rawName)
      ? ''
      : rawName
  form.phone = order.customer.phone || ''
  form.email = order.customer.email || ''
  form.shipmentStatus = (order.shipment?.status as ShipmentStatus) || 'pending'
  form.currentLocation = order.shipment?.currentLocation || ''
  form.deliveryAddress = order.shipment?.deliveryAddress || ''
  form.carrier = order.shipment?.carrier || ''
}

async function loadList() {
  isLoadingList.value = true
  try {
    const data = await fetchAdminOrders({ page: 1, limit: 50 })
    items.value = data.items ?? []
  } catch (error) {
    showError(getErrorMessage(error) || TOAST_MESSAGES.orders.loadFailed)
  } finally {
    isLoadingList.value = false
  }
}

async function handleSelect(item: AdminOrderItem) {
  selectedId.value = item.id
  isLoadingDetail.value = true
  try {
    detail.value = await fetchAdminOrderById(item.id)
    syncForm(detail.value)
  } catch (error) {
    showError(getErrorMessage(error) || TOAST_MESSAGES.orders.detailFailed)
  } finally {
    isLoadingDetail.value = false
  }
}

async function handleSave() {
  if (!selectedId.value) return
  isSaving.value = true
  try {
    detail.value = await updateAdminOrder(selectedId.value, {
      status: form.status,
      customer: {
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
      },
      shipment: {
        status: form.shipmentStatus,
        currentLocation: form.currentLocation,
        deliveryAddress: form.deliveryAddress,
        carrier: form.carrier,
      },
    })
    syncForm(detail.value)
    showSuccess(TOAST_MESSAGES.orders.updateSuccess)
    await loadList()
  } catch (error) {
    showError(getErrorMessage(error) || TOAST_MESSAGES.orders.updateFailed)
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  void loadList()
})
</script>

<template>
  <div class="space-y-5">
    <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>
          Đơn hàng toàn hệ thống (sinh từ mã giao dịch đúng + sản phẩm)
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div v-if="isLoadingList" class="text-muted-foreground">
          Đang tải...
        </div>

        <div
          v-else-if="!items.length"
          class="rounded-xl border border-dashed p-8 text-center text-muted-foreground"
        >
          Chưa có đơn hàng
        </div>

        <template v-else>
          <div class="space-y-2 md:hidden">
            <button
              v-for="item in items"
              :key="item.id"
              type="button"
              :class="
                cn(
                  'w-full rounded-xl border p-4 text-left transition',
                  selectedId === item.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50',
                )
              "
              @click="handleSelect(item)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-semibold">{{ item.orderCode }}</p>
                  <p class="mt-1 text-xs text-muted-foreground">
                    {{ item.shop?.shopCode || 'Shop' }}
                    · {{ item.customer.fullName || item.customer.customerCode }}
                  </p>
                </div>
                <Badge variant="outline">{{ item.status }}</Badge>
              </div>
              <p class="mt-2 text-sm font-medium">
                {{ formatCurrency(item.amount) }}
              </p>
            </button>
          </div>

          <div class="hidden overflow-hidden rounded-xl border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="item in items"
                  :key="item.id"
                  :class="
                    cn(
                      'cursor-pointer',
                      selectedId === item.id && 'bg-primary/5',
                    )
                  "
                  @click="handleSelect(item)"
                >
                  <TableCell class="font-medium">{{ item.orderCode }}</TableCell>
                  <TableCell>{{ item.shop?.shopCode || '—' }}</TableCell>
                  <TableCell>
                    {{
                      !item.customer.fullName
                        || /^chưa cập nhật$/i.test(item.customer.fullName)
                        || /^customer\s+/i.test(item.customer.fullName)
                        ? 'Chưa cập nhật người đặt'
                        : item.customer.fullName
                    }}
                  </TableCell>
                  <TableCell>{{ formatCurrency(item.amount) }}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{{ item.status }}</Badge>
                  </TableCell>
                  <TableCell class="text-muted-foreground">
                    {{ formatDisplayDate(item.createdAt) }}
                    {{ formatDisplayTime(item.createdAt) }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </template>
      </CardContent>
    </Card>

    <Card v-if="selectedId">
      <CardHeader>
        <CardTitle>Chi tiết / cập nhật đơn</CardTitle>
        <CardDescription>
          {{ detail?.orderCode || selectedId }}
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-5">
        <div v-if="isLoadingDetail" class="text-muted-foreground">
          Đang tải chi tiết...
        </div>
        <template v-else-if="detail">
          <div v-if="detail.items?.length" class="space-y-2">
            <p class="text-sm font-medium">Sản phẩm</p>
            <div
              v-for="line in detail.items"
              :key="line.id"
              class="flex justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <span>{{ line.productName }} × {{ line.quantity }}</span>
              <span>{{ formatCurrency(line.lineTotal) }}</span>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-2">
              <label class="text-sm font-medium">Trạng thái đơn</label>
              <select
                v-model="form.status"
                class="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option
                  v-for="status in orderStatuses"
                  :key="status"
                  :value="status"
                >
                  {{ status }}
                </option>
              </select>
            </div>
          <div class="space-y-2">
              <label class="text-sm font-medium">Tên người đặt hàng</label>
              <Input v-model="form.fullName" class="h-11" placeholder="Nguyễn Văn A" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">SĐT người đặt</label>
              <Input v-model="form.phone" class="h-11" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Email người đặt</label>
              <Input v-model="form.email" class="h-11" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Trạng thái ship</label>
              <select
                v-model="form.shipmentStatus"
                class="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option
                  v-for="status in shipmentStatuses"
                  :key="status"
                  :value="status"
                >
                  {{ status }}
                </option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Carrier</label>
              <Input v-model="form.carrier" class="h-11" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Vị trí hiện tại</label>
              <Input v-model="form.currentLocation" class="h-11" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Địa chỉ giao</label>
              <Input v-model="form.deliveryAddress" class="h-11" />
            </div>
          </div>

          <Button :disabled="isSaving" @click="handleSave">
            {{ isSaving ? 'Đang lưu...' : 'Lưu cập nhật' }}
          </Button>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
