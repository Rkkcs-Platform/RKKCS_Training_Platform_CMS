<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getErrorMessage, showError } from '@/common'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  fetchAdminDashboard,
  type AdminDashboardData,
} from '@/services/phase5.service'

const isLoading = ref(false)
const data = ref<AdminDashboardData | null>(null)

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

async function load() {
  isLoading.value = true
  try {
    data.value = await fetchAdminDashboard()
  } catch (error) {
    showError(getErrorMessage(error) || 'Không tải được dashboard')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="space-y-5">
    <Card>
      <CardHeader>
        <CardTitle>Admin Dashboard</CardTitle>
        <CardDescription>
          Tổng quan toàn platform — shops, orders, revenue, processing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="isLoading" class="text-muted-foreground">Đang tải...</div>
        <div v-else-if="data" class="space-y-6">
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="kpi in data.kpis"
              :key="kpi.label"
              class="rounded-xl border p-4"
            >
              <p class="text-xs text-muted-foreground">{{ kpi.label }}</p>
              <p class="mt-1 text-2xl font-semibold">
                {{
                  kpi.isCurrency
                    ? formatCurrency(kpi.value)
                    : kpi.value.toLocaleString('vi-VN')
                }}
              </p>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-xl border p-4">
              <p class="text-xs text-muted-foreground">Batches hôm nay</p>
              <p class="mt-1 text-xl font-semibold">{{ data.today.batches }}</p>
            </div>
            <div class="rounded-xl border p-4">
              <p class="text-xs text-muted-foreground">Submissions hôm nay</p>
              <p class="mt-1 text-xl font-semibold">
                {{ data.today.submissions }}
              </p>
            </div>
            <div class="rounded-xl border p-4">
              <p class="text-xs text-muted-foreground">Orders hôm nay</p>
              <p class="mt-1 text-xl font-semibold">{{ data.today.orders }}</p>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-xl border p-4">
              <p class="text-xs text-muted-foreground">Pending shipments</p>
              <p class="mt-1 text-xl font-semibold">
                {{ data.ops.pendingShipments }}
              </p>
            </div>
            <div class="rounded-xl border p-4">
              <p class="text-xs text-muted-foreground">Paid payments</p>
              <p class="mt-1 text-xl font-semibold">
                {{ data.ops.paidPayments }}
              </p>
            </div>
            <div class="rounded-xl border p-4">
              <p class="text-xs text-muted-foreground">Pending jobs</p>
              <p class="mt-1 text-xl font-semibold">
                {{ data.ops.pendingJobs }}
              </p>
            </div>
            <div class="rounded-xl border p-4">
              <p class="text-xs text-muted-foreground">Failed jobs</p>
              <p class="mt-1 text-xl font-semibold">
                {{ data.ops.failedJobs }}
              </p>
            </div>
          </div>

          <div>
            <p class="mb-2 text-sm font-medium">Top shops (revenue)</p>
            <div class="space-y-2">
              <div
                v-for="shop in data.topShops"
                :key="shop.shopId"
                class="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <span>{{ shop.shopCode }} — {{ shop.shopName }}</span>
                <span class="font-medium">
                  {{ formatCurrency(shop.revenue) }}
                  <span class="text-muted-foreground">
                    ({{ shop.orders }} orders)
                  </span>
                </span>
              </div>
              <p
                v-if="!data.topShops.length"
                class="text-sm text-muted-foreground"
              >
                Chưa có dữ liệu đơn hàng
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
