<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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
  ensureShopForUser,
  fetchShopUsers,
  fetchShops,
  type ShopItem,
  updateShop,
} from '@/services/shop.service'

const isLoading = ref(false)
const isSubmitting = ref(false)
const shops = ref<ShopItem[]>([])
const users = ref<
  Array<{
    id: string
    name: string
    email: string
    staffCode?: string
    shopId?: string
    shopCode?: string
    shopName?: string
    isShopOwner: boolean
  }>
>([])

const selectedUserId = ref('')
const shopCode = ref('')
const shopName = ref('')

const selectedUser = computed(() =>
  users.value.find((user) => user.id === selectedUserId.value),
)

const usersNeedingShop = computed(() =>
  users.value.filter(
    (user) => !user.shopId || user.shopCode === 'DEFAULT' || !user.isShopOwner,
  ),
)

async function loadAll() {
  isLoading.value = true
  try {
    const [shopData, userData] = await Promise.all([
      fetchShops({ page: 1, limit: 50 }),
      fetchShopUsers(),
    ])
    shops.value = shopData.items
    users.value = userData
  } catch (error) {
    showError(getErrorMessage(error) || TOAST_MESSAGES.shops.loadFailed)
  } finally {
    isLoading.value = false
  }
}

function pickUser(userId: string) {
  selectedUserId.value = userId
  const user = users.value.find((item) => item.id === userId)
  if (user && !shopCode.value) {
    shopCode.value = `SHOP-${(user.staffCode || user.id.slice(-4)).toUpperCase()}`
  }
  if (user && !shopName.value) {
    shopName.value = `Shop ${user.name}`
  }
}

async function handleAttachShop() {
  if (!selectedUserId.value || !shopCode.value.trim() || !shopName.value.trim()) {
    showError(TOAST_MESSAGES.shops.missingFields)
    return
  }

  isSubmitting.value = true
  try {
    const shop = await ensureShopForUser({
      userId: selectedUserId.value,
      shopCode: shopCode.value.trim(),
      shopName: shopName.value.trim(),
    })
    showSuccess(
      `${TOAST_MESSAGES.shops.attachSuccess}: ${shop.shopCode} → ${selectedUser.value?.email}`,
    )
    shopCode.value = ''
    shopName.value = ''
    selectedUserId.value = ''
    await loadAll()
  } catch (error) {
    showError(getErrorMessage(error) || TOAST_MESSAGES.shops.createFailed)
  } finally {
    isSubmitting.value = false
  }
}

async function toggleStatus(shop: ShopItem) {
  try {
    const next = shop.status === 'active' ? 'inactive' : 'active'
    await updateShop(shop.id, { status: next })
    showSuccess(
      next === 'active'
        ? TOAST_MESSAGES.shops.activateSuccess
        : TOAST_MESSAGES.shops.deactivateSuccess,
    )
    await loadAll()
  } catch (error) {
    showError(getErrorMessage(error) || TOAST_MESSAGES.shops.updateFailed)
  }
}

onMounted(() => {
  void loadAll()
})
</script>

<template>
  <div class="space-y-5">
    <Card>
      <CardHeader>
        <CardTitle>Gắn Shop cho user hiện có</CardTitle>
        <CardDescription>
          Không xóa tài khoản. Chọn user → tạo shop riêng (nếu đang thuộc DEFAULT sẽ được chuyển sang shop mới).
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div v-if="isLoading" class="text-muted-foreground">Đang tải...</div>

        <div v-else class="space-y-2">
          <p class="text-sm font-medium">User cần gắn / tách khỏi DEFAULT</p>
          <div
            v-if="!usersNeedingShop.length"
            class="rounded-xl border border-dashed p-4 text-sm text-muted-foreground"
          >
            Tất cả user đã có shop riêng.
          </div>
          <div v-else class="space-y-2">
            <button
              v-for="user in usersNeedingShop"
              :key="user.id"
              type="button"
              class="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition hover:bg-muted/50"
              :class="selectedUserId === user.id && 'border-primary bg-primary/5'"
              @click="pickUser(user.id)"
            >
              <div>
                <p class="font-medium">{{ user.name }}</p>
                <p class="text-xs text-muted-foreground">{{ user.email }}</p>
                <p class="mt-1 font-mono text-[11px] text-muted-foreground break-all">
                  ID: {{ user.id }}
                </p>
              </div>
              <Badge variant="secondary">
                {{ user.shopCode ?? 'Chưa có shop' }}
              </Badge>
            </button>
          </div>
        </div>

        <form
          v-if="selectedUserId"
          class="grid gap-4 rounded-xl border p-4 sm:grid-cols-2"
          @submit.prevent="handleAttachShop"
        >
          <p class="sm:col-span-2 text-sm">
            Đang gắn cho: <strong>{{ selectedUser?.name }}</strong>
            ({{ selectedUser?.email }})
          </p>
          <div class="space-y-2">
            <label class="text-sm font-medium" for="attach-shop-code">Shop code</label>
            <Input id="attach-shop-code" v-model="shopCode" class="h-11" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium" for="attach-shop-name">Tên shop</label>
            <Input id="attach-shop-name" v-model="shopName" class="h-11" />
          </div>
          <Button type="submit" class="h-11 sm:col-span-2" :disabled="isSubmitting">
            {{ isSubmitting ? 'Đang gắn...' : 'Tạo & gắn shop cho user này' }}
          </Button>
        </form>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Danh sách Shop</CardTitle>
          <CardDescription>Bao gồm shop DEFAULT dùng chung khi backfill</CardDescription>
        </div>
        <Button variant="outline" size="sm" :disabled="isLoading" @click="loadAll">
          Tải lại
        </Button>
      </CardHeader>
      <CardContent>
        <div
          v-if="!shops.length && !isLoading"
          class="rounded-xl border border-dashed p-8 text-center text-muted-foreground"
        >
          Chưa có shop nào — restart API để seed DEFAULT
        </div>
        <template v-else-if="shops.length">
          <div class="hidden overflow-hidden rounded-xl border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead class="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="shop in shops" :key="shop.id">
                  <TableCell class="font-mono text-sm">{{ shop.shopCode }}</TableCell>
                  <TableCell>{{ shop.shopName }}</TableCell>
                  <TableCell>
                    <div>
                      <p>{{ shop.owner?.name ?? '—' }}</p>
                      <p class="text-xs text-muted-foreground">{{ shop.owner?.email }}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge :variant="shop.status === 'active' ? 'default' : 'secondary'">
                      {{ shop.status }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      v-if="shop.shopCode !== 'DEFAULT'"
                      variant="outline"
                      size="sm"
                      @click="toggleStatus(shop)"
                    >
                      {{ shop.status === 'active' ? 'Deactivate' : 'Activate' }}
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div class="space-y-2 md:hidden">
            <div v-for="shop in shops" :key="shop.id" class="rounded-xl border p-4">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="font-semibold">{{ shop.shopName }}</p>
                  <p class="font-mono text-xs text-muted-foreground">{{ shop.shopCode }}</p>
                </div>
                <Badge :variant="shop.status === 'active' ? 'default' : 'secondary'">
                  {{ shop.status }}
                </Badge>
              </div>
              <p class="mt-2 text-sm text-muted-foreground">
                Owner: {{ shop.owner?.name ?? shop.ownerId }}
              </p>
            </div>
          </div>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
