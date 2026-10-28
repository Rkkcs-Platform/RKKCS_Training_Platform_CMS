<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  getErrorMessage,
  showError,
  showSuccess,
} from '@/common'
import { TOAST_MESSAGES } from '@/common/constants/messages'
import ProductImageUrlField from '@/components/ProductImageUrlField.vue'
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
  fillShopOrderData,
  updateAdminProduct,
} from '@/services/order.service'
import { fetchShops, type ShopItem } from '@/services/shop.service'
import type { AdminProduct } from '@/types/order'

const isLoading = ref(false)
const isSubmitting = ref(false)
const isSavingEdit = ref(false)
const isFilling = ref(false)
const products = ref<AdminProduct[]>([])
const shops = ref<ShopItem[]>([])
const brokenImages = reactive<Record<string, boolean>>({})

const form = reactive({
  shopId: '',
  productCode: '',
  name: '',
  brand: '',
  sku: '',
  description: '',
  imageUrl: '',
  price: 2980,
  isDefault: false,
})

const editingProduct = ref<AdminProduct | null>(null)
const editForm = reactive({
  name: '',
  brand: '',
  sku: '',
  description: '',
  imageUrl: '',
  price: 0,
  isDefault: false,
})

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(amount)
}

function markImageBroken(key: string) {
  brokenImages[key] = true
}

function resetCreateForm() {
  form.productCode = ''
  form.name = ''
  form.brand = ''
  form.sku = ''
  form.description = ''
  form.imageUrl = ''
  form.price = 2980
  form.isDefault = false
  brokenImages.create = false
}

async function load() {
  isLoading.value = true
  try {
    const [shopData, productData] = await Promise.all([
      fetchShops({ page: 1, limit: 100 }),
      fetchAdminProducts({ page: 1, limit: 200 }),
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
      brand: form.brand.trim() || undefined,
      sku: form.sku.trim() || undefined,
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      price: Number(form.price) || 0,
      isDefault: form.isDefault,
    })
    showSuccess(TOAST_MESSAGES.products.createSuccess)
    resetCreateForm()
    await load()
  } catch (error) {
    showError(getErrorMessage(error) || TOAST_MESSAGES.products.createFailed)
  } finally {
    isSubmitting.value = false
  }
}

function openEdit(product: AdminProduct) {
  editingProduct.value = product
  editForm.name = product.name
  editForm.brand = product.brand || ''
  editForm.sku = product.sku || ''
  editForm.description = product.description || ''
  editForm.imageUrl = product.imageUrl || ''
  editForm.price = product.price
  editForm.isDefault = Boolean(product.isDefault)
  brokenImages.edit = false
}

function closeEdit() {
  editingProduct.value = null
}

async function handleSaveEdit() {
  if (!editingProduct.value || !editForm.name.trim()) {
    showError(TOAST_MESSAGES.products.missingFields)
    return
  }

  isSavingEdit.value = true
  try {
    await updateAdminProduct(editingProduct.value.id, {
      name: editForm.name.trim(),
      brand: editForm.brand.trim(),
      sku: editForm.sku.trim(),
      description: editForm.description.trim(),
      imageUrl: editForm.imageUrl.trim(),
      price: Number(editForm.price) || 0,
      isDefault: editForm.isDefault,
    })
    showSuccess(TOAST_MESSAGES.products.updateSuccess)
    closeEdit()
    await load()
  } catch (error) {
    showError(getErrorMessage(error) || TOAST_MESSAGES.products.updateFailed)
  } finally {
    isSavingEdit.value = false
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

async function handleFillAll() {
  isFilling.value = true
  try {
    const result = await fillShopOrderData()
    showSuccess(
      `${TOAST_MESSAGES.products.fillSuccess} ${result.shopCode}: +${result.productsCreated} SP, ${result.customersUpdated} khách, ${result.ordersProductUpdated}/${result.ordersScanned} đơn, ${result.shipmentsUpdated ?? 0} vận đơn` +
        (result.ordersFailed ? `, lỗi ${result.ordersFailed}` : ''),
    )
    await load()
  } catch (error) {
    showError(getErrorMessage(error) || TOAST_MESSAGES.products.fillFailed)
  } finally {
    isFilling.value = false
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
          Tạo / sửa catalog (ảnh URL, brand, SKU, 税込). Update All gán 2–3 SKU, địa chỉ
          〒 và Yamato/Sagawa cho đơn stub.
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
            <Input v-model="form.productCode" class="h-11" placeholder="SP-TEE01" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Tên sản phẩm</label>
            <Input v-model="form.name" class="h-11" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Brand</label>
            <Input v-model="form.brand" class="h-11" placeholder="UNIQORA" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">SKU</label>
            <Input v-model="form.sku" class="h-11" placeholder="RK-TEE-WHT-M" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Giá (税込)</label>
            <Input v-model.number="form.price" type="number" min="0" class="h-11" />
          </div>
          <div class="sm:col-span-2">
            <ProductImageUrlField
              v-model="form.imageUrl"
              :broken="brokenImages.create"
              @broken-change="brokenImages.create = $event"
            />
          </div>
          <div class="space-y-2 sm:col-span-2">
            <label class="text-sm font-medium">Mô tả</label>
            <textarea
              v-model="form.description"
              rows="2"
              class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              placeholder="Mô tả ngắn, 税込..."
            />
          </div>
        </div>

        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.isDefault" type="checkbox" class="size-4" />
          Đặt làm mặc định khi sinh order
        </label>
        <div class="flex flex-wrap gap-2">
          <Button :disabled="isSubmitting" @click="handleCreate">
            {{ isSubmitting ? 'Đang tạo...' : 'Tạo sản phẩm' }}
          </Button>
          <Button
            variant="outline"
            :disabled="isFilling"
            @click="handleFillAll"
          >
            {{ isFilling ? 'Đang fill...' : 'Update All' }}
          </Button>
        </div>
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
          Chưa có sản phẩm catalog. Tạo mới hoặc bấm Update All.
        </div>
        <div v-else class="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ảnh</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>Price (税込)</TableHead>
                <TableHead>Default</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="product in products" :key="product.id">
                <TableCell>
                  <img
                    v-if="product.imageUrl && !brokenImages[product.id]"
                    :src="product.imageUrl"
                    :alt="product.name"
                    class="size-10 rounded-md object-cover"
                    @error="markImageBroken(product.id)"
                  />
                  <span v-else class="text-muted-foreground">—</span>
                </TableCell>
                <TableCell>{{ product.brand || '—' }}</TableCell>
                <TableCell class="font-mono text-xs">{{ product.sku || '—' }}</TableCell>
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
                  <div class="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      @click="openEdit(product)"
                    >
                      Sửa
                    </Button>
                    <Button
                      v-if="!product.isDefault"
                      size="sm"
                      variant="outline"
                      @click="handleSetDefault(product)"
                    >
                      Set default
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <Teleport to="body">
      <div
        v-if="editingProduct"
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        @click.self="closeEdit"
      >
        <div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border bg-background p-5 shadow-xl">
          <div class="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold">Sửa sản phẩm</h2>
              <p class="mt-1 font-mono text-xs text-muted-foreground">
                {{ editingProduct.productCode }}
                <span v-if="editingProduct.shop?.shopCode">
                  · {{ editingProduct.shop.shopCode }}
                </span>
              </p>
            </div>
            <Button size="sm" variant="outline" @click="closeEdit">Đóng</Button>
          </div>

          <div class="space-y-3">
            <div class="space-y-2">
              <label class="text-sm font-medium">Tên sản phẩm</label>
              <Input v-model="editForm.name" class="h-11" />
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="space-y-2">
                <label class="text-sm font-medium">Brand</label>
                <Input v-model="editForm.brand" class="h-11" />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">SKU</label>
                <Input v-model="editForm.sku" class="h-11" />
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Giá (税込)</label>
              <Input v-model.number="editForm.price" type="number" min="0" class="h-11" />
            </div>
            <ProductImageUrlField
              v-model="editForm.imageUrl"
              :broken="brokenImages.edit"
              @broken-change="brokenImages.edit = $event"
            />
            <div class="space-y-2">
              <label class="text-sm font-medium">Mô tả</label>
              <textarea
                v-model="editForm.description"
                rows="3"
                class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            </div>
            <label class="flex items-center gap-2 text-sm">
              <input v-model="editForm.isDefault" type="checkbox" class="size-4" />
              Đặt làm mặc định khi sinh order
            </label>
          </div>

          <div class="mt-5 flex justify-end gap-2">
            <Button variant="outline" :disabled="isSavingEdit" @click="closeEdit">
              Hủy
            </Button>
            <Button :disabled="isSavingEdit" @click="handleSaveEdit">
              {{ isSavingEdit ? 'Đang lưu...' : 'Lưu' }}
            </Button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
