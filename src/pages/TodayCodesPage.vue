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
    showError('Chọn shop trước khi generate')
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
          <CardTitle>Mã code hôm nay</CardTitle>
          <CardDescription>
            {{ formatDisplayDate(today) }} · {{ today }}
            <span v-if="selectedShop" class="block mt-1">
              Shop: <strong>{{ selectedShop.shopCode }}</strong> — {{ selectedShop.shopName }}
            </span>
          </CardDescription>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" :disabled="isLoading" @click="loadChallenge">
            <RefreshCw class="size-4" :class="cn(isLoading && 'animate-spin')" />
            Tải lại
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="isGenerating || challenge?.status === 'locked' || !selectedShopId"
            @click="handleGenerate"
          >
            <Sparkles class="size-4" />
            {{
              isGenerating
                ? 'Đang tạo...'
                : challenge
                  ? 'Regenerate'
                  : 'Generate'
            }}
          </Button>
          <Button
            v-if="challenge"
            variant="outline"
            size="sm"
            :disabled="isTogglingLock"
            @click="handleToggleLock"
          >
            <Unlock v-if="challenge.status === 'locked'" class="size-4" />
            <Lock v-else class="size-4" />
            {{
              isTogglingLock
                ? '...'
                : challenge.status === 'locked'
                  ? 'Mở khóa'
                  : 'Khóa'
            }}
          </Button>
          <Button
            v-if="challenge"
            variant="outline"
            size="sm"
            :disabled="isReprocessing"
            @click="handleReprocess"
          >
            <RotateCcw class="size-4" :class="cn(isReprocessing && 'animate-spin')" />
            {{ isReprocessing ? 'Reprocess...' : 'Reprocess orders' }}
          </Button>
          <Button
            size="sm"
            :disabled="!challenge || isExporting"
            @click="handleExport"
          >
            <Download class="size-4" />
            {{ isExporting ? 'Đang export...' : 'Export CSV' }}
          </Button>
        </div>
      </CardHeader>

      <CardContent class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium" for="shop-select">Shop (quan trọng)</label>
          <select
            id="shop-select"
            v-model="selectedShopId"
            class="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option disabled value="">Chọn shop</option>
            <option v-for="shop in shops" :key="shop.id" :value="shop.id">
              {{ shop.shopCode }} — {{ shop.shopName }}
            </option>
          </select>
          <p class="text-xs text-muted-foreground">
            User chỉ khớp mã của <strong>đúng shop</strong> họ được gắn. Copy mã từ shop khác sẽ báo không tìm thấy.
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
            {{ isGenerating ? 'Đang tạo...' : 'Generate mã cho shop này' }}
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
              {{ challenge.totalCodes }} mã · độ dài {{ challenge.codeLength }}
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
  </div>
</template>
