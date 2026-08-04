<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getErrorMessage, showError } from '@/common'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  fetchAdminOrdersReport,
  fetchAdminRevenueReport,
} from '@/services/phase5.service'

const isLoading = ref(false)
const days = ref(30)
const revenue = ref<{
  days: number
  totalRevenue: number
  totalOrders: number
  byDay: Array<{ date: string; amount: number; orders: number }>
  byShop: Array<{
    shopCode: string
    shopName: string
    amount: number
    orders: number
  }>
} | null>(null)
const orders = ref<{
  byStatus: Array<{ status: string; count: number; amount: number }>
  recentDays: Array<{ date: string; count: number }>
} | null>(null)

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
    const [rev, ord] = await Promise.all([
      fetchAdminRevenueReport(days.value),
      fetchAdminOrdersReport(),
    ])
    revenue.value = rev
    orders.value = ord
  } catch (error) {
    showError(getErrorMessage(error) || 'Không tải được reports')
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
        <CardTitle>Reports</CardTitle>
        <CardDescription>Doanh thu và đơn hàng toàn platform</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-wrap items-center gap-3">
        <select
          v-model.number="days"
          class="flex h-10 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option :value="7">7 ngày</option>
          <option :value="30">30 ngày</option>
          <option :value="90">90 ngày</option>
        </select>
        <Button :disabled="isLoading" @click="load">
          {{ isLoading ? 'Đang tải...' : 'Tải báo cáo' }}
        </Button>
      </CardContent>
    </Card>

    <div v-if="revenue" class="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Revenue ({{ revenue.days }} ngày)</CardTitle>
          <CardDescription>
            Tổng {{ formatCurrency(revenue.totalRevenue) }} ·
            {{ revenue.totalOrders }} orders
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-2">
          <div
            v-for="row in revenue.byShop"
            :key="row.shopCode"
            class="flex justify-between rounded-lg border px-3 py-2 text-sm"
          >
            <span>{{ row.shopCode }} — {{ row.shopName }}</span>
            <span>{{ formatCurrency(row.amount) }}</span>
          </div>
          <p
            v-if="!revenue.byShop.length"
            class="text-sm text-muted-foreground"
          >
            Chưa có doanh thu
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orders by status</CardTitle>
        </CardHeader>
        <CardContent class="space-y-2">
          <div
            v-for="row in orders?.byStatus || []"
            :key="row.status"
            class="flex justify-between rounded-lg border px-3 py-2 text-sm"
          >
            <span>{{ row.status }}</span>
            <span>
              {{ row.count }} · {{ formatCurrency(row.amount) }}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
