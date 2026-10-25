<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Download, Lock, RefreshCw, RotateCcw, Sparkles, Unlock } from 'lucide-vue-next'
import {
  downloadBlob,
  formatDisplayDate,
  getErrorMessage,
  getTodayDateString,
  showChallengeExportFailed,
  showChallengeExportSuccess,
  showChallengeLoadFailed,
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
  exportChallengeCodesByDate,
  fetchChallengeByDate,
  generateChallenge,
  lockChallenge,
  regenerateChallenge,
  unlockChallenge,
} from '@/services/challenge.service'
import { reprocessBatch } from '@/services/order.service'
import { fetchShops, type ShopItem } from '@/services/shop.service'
import type { AdminChallengeDetail } from '@/types/challenge'

const today = getTodayDateString()
const isLoading = ref(false)
const isExporting = ref(false)
const isGenerating = ref(false)
const isTogglingLock = ref(false)
const isReprocessing = ref(false)
const challenge = ref<AdminChallengeDetail | null>(null)
const notFound = ref(false)
const shops = ref<ShopItem[]>([])
const selectedShopId = ref('')

const selectedShop = computed(() =>
  shops.value.find((shop) => shop.id === selectedShopId.value),
)

async function loadShops() {
  const data = await fetchShops({ page: 1, limit: 100 })
  shops.value = data.items
  const defaultShop =
    data.items.find((shop) => shop.shopCode === 'DEFAULT') ?? data.items[0]
  if (defaultShop && !selectedShopId.value) {
    selectedShopId.value = defaultShop.id
  }
}

async function loadChallenge() {
  if (!selectedShopId.value) return

  isLoading.value = true
  notFound.value = false

  try {
    const data = await fetchChallengeByDate(today, selectedShopId.value)

    if ('exists' in data && data.exists === false) {
      challenge.value = null
      notFound.value = true
      return
    }

    challenge.value = data as AdminChallengeDetail
  } catch {
    showChallengeLoadFailed()
  } finally {
    isLoading.value = false
  }
}

async function handleExport() {
  if (!challenge.value || !selectedShopId.value) return

  isExporting.value = true

  try {
    const { blob, filename } = await exportChallengeCodesByDate(
      today,
      selectedShopId.value,
    )
    downloadBlob(blob, filename)
    showChallengeExportSuccess()
  } catch (error) {
    showChallengeExportFailed(getErrorMessage(error))
  } finally {
    isExporting.value = false
  }
}

async function handleGenerate() {
  if (!selectedShopId.value) {
    showError('Chọn cửa hàng trước khi tạo phiếu')
    return
  }

  isGenerating.value = true

  try {
    if (challenge.value) {
      if (challenge.value.status === 'locked') {
        showError(TOAST_MESSAGES.challenge.lockedCannotRegenerate)
        return
      }

      challenge.value = await regenerateChallenge(challenge.value.id)
      showSuccess(TOAST_MESSAGES.challenge.regenerateSuccess)
    } else {
      challenge.value = await generateChallenge({
        date: today,
        shopId: selectedShopId.value,
      })
      notFound.value = false
      showSuccess(TOAST_MESSAGES.challenge.generateSuccess)
    }
  } catch (error) {
    showError(getErrorMessage(error) || TOAST_MESSAGES.challenge.generateFailed)
  } finally {
    isGenerating.value = false
  }
}

async function handleToggleLock() {
  if (!challenge.value) return

  isTogglingLock.value = true

  try {
    if (challenge.value.status === 'locked') {
      challenge.value = await unlockChallenge(challenge.value.id)
      showSuccess(TOAST_MESSAGES.challenge.unlockSuccess)
    } else {
      challenge.value = await lockChallenge(challenge.value.id)
      showSuccess(TOAST_MESSAGES.challenge.lockSuccess)
    }
  } catch (error) {
    showError(getErrorMessage(error) || TOAST_MESSAGES.challenge.lockFailed)
  } finally {
    isTogglingLock.value = false
  }
}

async function handleReprocess() {
  if (!challenge.value) return

  isReprocessing.value = true
  try {
    const job = await reprocessBatch(challenge.value.id)
    showSuccess(
      `${TOAST_MESSAGES.orders.reprocessSuccess} (${job.generatedOrders} order mới)`,
    )
  } catch (error) {
    showError(getErrorMessage(error) || TOAST_MESSAGES.orders.reprocessFailed)
  } finally {
    isReprocessing.value = false
  }
}

watch(selectedShopId, () => {
  void loadChallenge()
})

onMounted(async () => {
  try {
    await loadShops()
    await loadChallenge()
  } catch (error) {
    showError(getErrorMessage(error) || TOAST_MESSAGES.shops.loadFailed)
  }
})
</script>

<template>
  <div class="space-y-5">
    <Card>
      <CardHeader class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Phiếu hôm nay</CardTitle>
          <CardDescription>
            Mã đưa cho nhân viên nhập trong ngày · {{ formatDisplayDate(today) }}
            <span v-if="selectedShop" class="mt-1 block">
              {{ selectedShop.shopName }} · {{ selectedShop.shopCode }}
            </span>
          </CardDescription>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" :disabled="isLoading" @click="loadChallenge">
            <RefreshCw class="size-4" :class="cn(isLoading && 'animate-spin')" />
            Tải lại
          </Button>
          <Button
            size="sm"
            :disabled="!challenge || isExporting"
            @click="handleExport"
          >
            <Download class="size-4" />
            {{ isExporting ? 'Đang tải...' : 'Tải danh sách mã' }}
          </Button>
        </div>
      </CardHeader>

      <CardContent class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium" for="shop-select">Cửa hàng</label>
          <select
            id="shop-select"
            v-model="selectedShopId"
            class="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option disabled value="">Chọn cửa hàng</option>
            <option v-for="shop in shops" :key="shop.id" :value="shop.id">
              {{ shop.shopName }} — {{ shop.shopCode }}
            </option>
          </select>
          <p class="text-xs text-muted-foreground">
            Nhân viên chỉ nhận được mã của cửa hàng mình.
          </p>
        </div>

        <div v-if="isLoading" class="text-muted-foreground">
          Đang tải...
        </div>

        <div
          v-else-if="notFound"
          class="rounded-xl border border-dashed p-8 text-center"
        >
          <p class="text-muted-foreground">
            {{ TOAST_MESSAGES.challenge.notFound }}
            <span v-if="selectedShop"> ({{ selectedShop.shopCode }})</span>
          </p>
          <Button class="mt-4" :disabled="isGenerating" @click="handleGenerate">
            <Sparkles class="size-4" />
            {{ isGenerating ? 'Đang tạo...' : 'Tạo phiếu hôm nay' }}
          </Button>
        </div>

        <template v-else-if="challenge">
          <div class="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <Badge :variant="challenge.status === 'active' ? 'default' : 'secondary'">
              {{ challenge.status === 'active' ? 'Đang mở' : 'Đã khóa' }}
            </Badge>
            <Badge variant="outline">
              {{ challenge.shopCode ?? 'Shop' }}
            </Badge>
            <span class="text-muted-foreground">
              {{ challenge.totalCodes }} mã trên phiếu
            </span>
          </div>

          <div class="space-y-2 md:hidden">
            <div
              v-for="item in challenge.codes"
              :key="item.order"
              class="flex items-center justify-between rounded-xl border p-3"
            >
              <span class="text-xs text-muted-foreground">#{{ item.order }}</span>
              <span class="font-mono text-base font-semibold tracking-widest">
                {{ item.code }}
              </span>
            </div>
          </div>

          <div class="hidden overflow-hidden rounded-xl border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-20">#</TableHead>
                  <TableHead>Mã</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="item in challenge.codes" :key="item.order">
                  <TableCell>{{ item.order }}</TableCell>
                  <TableCell class="font-mono font-semibold tracking-widest">
                    {{ item.code }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </template>
      </CardContent>
    </Card>

    <Card v-if="selectedShopId">
      <CardHeader>
        <CardTitle>Quản trị</CardTitle>
        <CardDescription>
          Tạo lại phiếu, khóa phiếu, hoặc tạo lại đơn. Không cần khi chỉ in mã cho nhân viên.
        </CardDescription>
      </CardHeader>
      <CardContent class="flex flex-wrap gap-2">
        <Button
          variant="outline"
          :disabled="isGenerating || challenge?.status === 'locked'"
          @click="handleGenerate"
        >
          <Sparkles class="size-4" />
          {{
            isGenerating
              ? 'Đang tạo...'
              : challenge
                ? 'Tạo lại phiếu'
                : 'Tạo phiếu'
          }}
        </Button>
        <Button
          v-if="challenge"
          variant="outline"
          :disabled="isTogglingLock"
          @click="handleToggleLock"
        >
          <Unlock v-if="challenge.status === 'locked'" class="size-4" />
          <Lock v-else class="size-4" />
          {{
            isTogglingLock
              ? 'Đang lưu...'
              : challenge.status === 'locked'
                ? 'Mở khóa phiếu'
                : 'Khóa phiếu'
          }}
        </Button>
        <Button
          v-if="challenge"
          variant="outline"
          :disabled="isReprocessing"
          @click="handleReprocess"
        >
          <RotateCcw class="size-4" :class="cn(isReprocessing && 'animate-spin')" />
          {{ isReprocessing ? 'Đang chạy...' : 'Tạo lại đơn từ phiếu' }}
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
