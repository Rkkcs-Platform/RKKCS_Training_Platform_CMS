<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
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
import {
  createAdminProduct,
  fetchAdminProducts,
  updateAdminProduct,
} from '@/services/order.service'
import { fetchShops, type ShopItem } from '@/services/shop.service'
import type { AdminProduct } from '@/types/order'

const isLoading = ref(false)
const isSubmitting = ref(false)
const products = ref<AdminProduct[]>([])
const shops = ref<ShopItem[]>([])
const form = reactive({
  shopId: '',
  productCode: '',
  name: '',
  price: 150000,
  isDefault: true,
})

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
    const [shopData, productData] = await Promise.all([
      fetchShops({ page: 1, limit: 100 }),
      fetchAdminProducts({ page: 1, limit: 100 }),
    ])
    shops.value = shopData.items
    products.value = productData.items ?? []
    if (!form.shopId && shops.value[0]) {
      form.shopId = shops.value[0].id
    }
  } catch (error) {
    showError(getErrorMessage(error) || TOAST_MESSAGES.products.loadFailed)
  } finally {
    isLoading.value = false
  }
}

async function handleCreate() {
  if (!form.shopId || !form.productCode.trim() || !form.name.trim()) {
    showError(TOAST_MESSAGES.products.missingFields)
    return
  }

  isSubmitting.value = true
  try {
    await createAdminProduct({
      shopId: form.shopId,
      productCode: form.productCode.trim(),
      name: form.name.trim(),
      price: Number(form.price) || 0,
      isDefault: form.isDefault,
    })
    showSuccess(TOAST_MESSAGES.products.createSuccess)
    form.productCode = ''
    form.name = ''
    await load()
  } catch (error) {
    showError(getErrorMessage(error) || TOAST_MESSAGES.products.createFailed)
  } finally {
    isSubmitting.value = false
  }
}

async function handleSetDefault(product: AdminProduct) {
  try {
    await updateAdminProduct(product.id, { isDefault: true })
    showSuccess('Đã đặt làm sản phẩm mặc định')
    await load()
  } catch (error) {
    showError(getErrorMessage(error) || TOAST_MESSAGES.common.requestFailed)
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
        <CardTitle>Products</CardTitle>
        <CardDescription>
          Catalog sản phẩm theo shop. Đơn mới sẽ gắn sản phẩm mặc định.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="space-y-2">
            <label class="text-sm font-medium">Shop</label>
            <select
              v-model="form.shopId"
              class="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option disabled value="">Chọn shop</option>
              <option v-for="shop in shops" :key="shop.id" :value="shop.id">
                {{ shop.shopCode }} — {{ shop.shopName }}
              </option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Mã sản phẩm</label>
            <Input v-model="form.productCode" class="h-11" placeholder="SP001" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Tên sản phẩm</label>
            <Input v-model="form.name" class="h-11" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Giá</label>
            <Input v-model.number="form.price" type="number" min="0" class="h-11" />
          </div>
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.isDefault" type="checkbox" class="size-4" />
          Đặt làm mặc định khi sinh order
        </label>
        <Button :disabled="isSubmitting" @click="handleCreate">
          {{ isSubmitting ? 'Đang tạo...' : 'Tạo sản phẩm' }}
        </Button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Danh sách sản phẩm</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="isLoading" class="text-muted-foreground">Đang tải...</div>
        <div
          v-else-if="!products.length"
          class="rounded-xl border border-dashed p-8 text-center text-muted-foreground"
        >
          Chưa có sản phẩm — hệ thống sẽ tự tạo DEFAULT khi sinh đơn
        </div>
        <div v-else class="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Default</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="product in products" :key="product.id">
                <TableCell class="font-mono">{{ product.productCode }}</TableCell>
                <TableCell>{{ product.name }}</TableCell>
                <TableCell>{{ product.shop?.shopCode || '—' }}</TableCell>
                <TableCell>{{ formatCurrency(product.price) }}</TableCell>
                <TableCell>
                  <Badge :variant="product.isDefault ? 'default' : 'outline'">
                    {{ product.isDefault ? 'Yes' : 'No' }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    v-if="!product.isDefault"
                    size="sm"
                    variant="outline"
                    @click="handleSetDefault(product)"
                  >
                    Set default
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
