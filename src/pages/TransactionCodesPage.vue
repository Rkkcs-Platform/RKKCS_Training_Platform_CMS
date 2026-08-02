<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { getErrorMessage, showError } from '@/common'
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
import { fetchShops, type ShopItem } from '@/services/shop.service'
import { fetchAdminTransactionCodes } from '@/services/phase5.service'

const isLoading = ref(false)
const shops = ref<ShopItem[]>([])
const items = ref<
  Array<{
    code: string
    order: number
    date: string
    shopCode?: string
    shopName?: string
    batchStatus: string
    used: boolean
  }>
>([])
const summary = ref<{
  totalCodes: number
  used: number
  unused: number
  batches: number
} | null>(null)
const filters = reactive({
  date: '',
  shopId: '',
  q: '',
})

async function load() {
  isLoading.value = true
  try {
    const data = await fetchAdminTransactionCodes({
      page: 1,
      limit: 100,
      date: filters.date || undefined,
      shopId: filters.shopId || undefined,
      q: filters.q || undefined,
    })
    items.value = data.items ?? []
    summary.value = data.summary ?? null
  } catch (error) {
    showError(getErrorMessage(error) || 'Không tải được transaction codes')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  try {
    const shopData = await fetchShops({ page: 1, limit: 100 })
    shops.value = shopData.items
  } catch {
    shops.value = []
  }
  await load()
})
</script>

<template>
  <div class="space-y-5">
    <Card>
      <CardHeader>
        <CardTitle>Transaction monitoring</CardTitle>
        <CardDescription>
          Theo dõi mã giao dịch theo batch — đã dùng / chưa dùng
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-3 sm:grid-cols-4">
          <Input
            v-model="filters.date"
            class="h-11"
            type="date"
            placeholder="Ngày"
          />
          <select
            v-model="filters.shopId"
            class="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">Tất cả shop</option>
            <option v-for="shop in shops" :key="shop.id" :value="shop.id">
              {{ shop.shopCode }}
            </option>
          </select>
          <Input
            v-model="filters.q"
            class="h-11"
            placeholder="Tìm mã..."
          />
          <Button :disabled="isLoading" @click="load">
            {{ isLoading ? 'Đang tải...' : 'Lọc' }}
          </Button>
        </div>

        <div
          v-if="summary"
          class="grid gap-3 sm:grid-cols-4"
        >
          <div class="rounded-xl border p-3 text-sm">
            <p class="text-muted-foreground">Total codes</p>
            <p class="text-xl font-semibold">{{ summary.totalCodes }}</p>
          </div>
          <div class="rounded-xl border p-3 text-sm">
            <p class="text-muted-foreground">Used</p>
            <p class="text-xl font-semibold">{{ summary.used }}</p>
          </div>
          <div class="rounded-xl border p-3 text-sm">
            <p class="text-muted-foreground">Unused</p>
            <p class="text-xl font-semibold">{{ summary.unused }}</p>
          </div>
          <div class="rounded-xl border p-3 text-sm">
            <p class="text-muted-foreground">Batches</p>
            <p class="text-xl font-semibold">{{ summary.batches }}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardContent class="pt-6">
        <div v-if="isLoading" class="text-muted-foreground">Đang tải...</div>
        <div
          v-else-if="!items.length"
          class="rounded-xl border border-dashed p-8 text-center text-muted-foreground"
        >
          Không có mã phù hợp bộ lọc
        </div>
        <div v-else class="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Usage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="item in items" :key="`${item.date}-${item.code}`">
                <TableCell class="font-mono">{{ item.code }}</TableCell>
                <TableCell>{{ item.date }}</TableCell>
                <TableCell>{{ item.shopCode || '—' }}</TableCell>
                <TableCell>{{ item.batchStatus }}</TableCell>
                <TableCell>
                  <Badge :variant="item.used ? 'default' : 'outline'">
                    {{ item.used ? 'Used' : 'Unused' }}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
