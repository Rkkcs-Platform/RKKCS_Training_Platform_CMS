<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Download, RefreshCw } from 'lucide-vue-next'
import {
  downloadBlob,
  formatDisplayDate,
  getErrorMessage,
  getTodayDateString,
  showChallengeExportFailed,
  showChallengeExportSuccess,
  showChallengeLoadFailed,
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
} from '@/services/challenge.service'
import type { AdminChallengeDetail } from '@/types/challenge'

const today = getTodayDateString()
const isLoading = ref(false)
const isExporting = ref(false)
const challenge = ref<AdminChallengeDetail | null>(null)
const notFound = ref(false)

async function loadChallenge() {
  isLoading.value = true
  notFound.value = false

  try {
    const data = await fetchChallengeByDate(today)

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
  if (!challenge.value) return

  isExporting.value = true

  try {
    const { blob, filename } = await exportChallengeCodesByDate(today)
    downloadBlob(blob, filename)
    showChallengeExportSuccess()
  } catch (error) {
    showChallengeExportFailed(getErrorMessage(error))
  } finally {
    isExporting.value = false
  }
}

onMounted(() => {
  void loadChallenge()
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
            {{ isExporting ? 'Đang export...' : 'Export CSV' }}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div v-if="isLoading" class="text-muted-foreground">
          Đang tải...
        </div>

        <div
          v-else-if="notFound"
          class="rounded-xl border border-dashed p-8 text-center text-muted-foreground"
        >
          {{ TOAST_MESSAGES.challenge.notFound }}
        </div>

        <template v-else-if="challenge">
          <div class="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <Badge :variant="challenge.status === 'active' ? 'default' : 'secondary'">
              {{ challenge.status === 'active' ? 'Đang mở' : 'Đã khóa' }}
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
