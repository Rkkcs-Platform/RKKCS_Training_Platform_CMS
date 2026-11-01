<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Trash2 } from 'lucide-vue-next'
import {
  formatDisplayDate,
  formatDisplayTime,
  getErrorMessage,
  getTodayDateString,
  showSubmissionAnswerDeleted,
  showSubmissionAnswerDeleteFailed,
  showSubmissionDetailFailed,
  showSubmissionsLoadFailed,
  TOAST_MESSAGES,
} from '@/common'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  deleteAdminSubmissionAnswers,
  fetchAdminSubmissionById,
  fetchAdminSubmissions,
} from '@/services/submission.service'
import type {
  AdminSubmissionDetail,
  AdminSubmissionItem,
} from '@/types/submission'

const items = ref<AdminSubmissionItem[]>([])
const selectedId = ref<string | null>(null)
const detail = ref<AdminSubmissionDetail | null>(null)
const filterDate = ref(getTodayDateString())
const isLoadingList = ref(false)
const isLoadingDetail = ref(false)
const isDeleting = ref(false)
const selectedOrders = ref<number[]>([])

const selectedCount = computed(() => selectedOrders.value.length)

const allSelected = computed(() => {
  const answers = detail.value?.answers ?? []
  return answers.length > 0 && selectedOrders.value.length === answers.length
})

watch(selectedId, () => {
  selectedOrders.value = []
})

async function loadList() {
  isLoadingList.value = true

  try {
    const data = await fetchAdminSubmissions({
      page: 1,
      limit: 50,
      date: filterDate.value.trim(),
    })
    items.value = data.items ?? []

    if (
      selectedId.value &&
      !items.value.some((item) => item.id === selectedId.value)
    ) {
      selectedId.value = null
      detail.value = null
      selectedOrders.value = []
    }
  } catch {
    showSubmissionsLoadFailed()
  } finally {
    isLoadingList.value = false
  }
}

async function handleSelect(item: AdminSubmissionItem) {
  selectedId.value = item.id
  selectedOrders.value = []
  isLoadingDetail.value = true

  try {
    detail.value = await fetchAdminSubmissionById(item.id)
  } catch {
    showSubmissionDetailFailed()
  } finally {
    isLoadingDetail.value = false
  }
}

function isOrderSelected(order: number) {
  return selectedOrders.value.includes(order)
}

function toggleOrder(order: number, checked: boolean | 'indeterminate') {
  const on = checked === true
  if (on) {
    if (!selectedOrders.value.includes(order)) {
      selectedOrders.value = [...selectedOrders.value, order]
    }
    return
  }
  selectedOrders.value = selectedOrders.value.filter((item) => item !== order)
}

function toggleSelectAll(checked: boolean | 'indeterminate') {
  const on = checked === true
  if (!on || !detail.value) {
    selectedOrders.value = []
    return
  }
  selectedOrders.value = detail.value.answers.map((answer) => answer.order)
}

function syncListItemFromDetail() {
  if (!selectedId.value || !detail.value) return

  items.value = items.value.map((item) =>
    item.id === selectedId.value
      ? {
          ...item,
          submitted: detail.value!.submitted,
          correct: detail.value!.correct,
          wrong: detail.value!.wrong,
          accuracy: detail.value!.accuracy,
          status: detail.value!.status,
          completedAt: detail.value!.completedAt,
        }
      : item,
  )
}

async function handleDeleteSelected() {
  if (!selectedId.value || !selectedOrders.value.length || isDeleting.value) {
    return
  }

  const count = selectedOrders.value.length
  const confirmed = window.confirm(
    count === 1
      ? TOAST_MESSAGES.submissions.deleteConfirm
      : TOAST_MESSAGES.submissions.deleteMultiConfirm.replace(
          '{count}',
          String(count),
        ),
  )
  if (!confirmed) return

  isDeleting.value = true

  try {
    detail.value = await deleteAdminSubmissionAnswers(
      selectedId.value,
      [...selectedOrders.value],
    )
    selectedOrders.value = []
    syncListItemFromDetail()
    showSubmissionAnswerDeleted()
  } catch (error) {
    showSubmissionAnswerDeleteFailed(getErrorMessage(error))
  } finally {
    isDeleting.value = false
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
        <CardTitle>Lịch sử nhập mã của user</CardTitle>
        <CardDescription>
          Xem tiến độ và chi tiết mã user đã nhập theo ngày. Có thể chọn nhiều mã để xóa.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div class="flex-1 space-y-2">
            <label class="text-sm font-medium" for="filter-date">Lọc theo ngày</label>
            <Input
              id="filter-date"
              v-model="filterDate"
              type="date"
              class="h-10"
            />
          </div>
          <button
            type="button"
            class="h-10 rounded-lg border px-4 text-sm font-medium hover:bg-muted"
            @click="loadList"
          >
            Áp dụng
          </button>
        </div>

        <div v-if="isLoadingList" class="text-muted-foreground">
          Đang tải...
        </div>

        <div
          v-else-if="items.length === 0"
          class="rounded-xl border border-dashed p-8 text-center text-muted-foreground"
        >
          Chưa có dữ liệu nhập mã
        </div>

        <template v-else>
          <div class="space-y-3 md:hidden">
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
              <div class="flex items-center justify-between gap-2">
                <p class="font-semibold">{{ item.user.name }}</p>
                <Badge :variant="item.status === 'completed' ? 'default' : 'secondary'">
                  {{ item.status === 'completed' ? 'Xong' : 'Đang làm' }}
                </Badge>
              </div>
              <p class="mt-1 text-xs text-muted-foreground">{{ item.user.email }}</p>
              <p class="mt-2 text-sm text-muted-foreground">
                {{ formatDisplayDate(item.date) }} · Đúng {{ item.correct }} · Sai
                {{ item.wrong }}
              </p>
            </button>
          </div>

          <div class="hidden overflow-hidden rounded-xl border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Đúng</TableHead>
                  <TableHead>Sai</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="item in items"
                  :key="item.id"
                  :class="
                    cn(
                      'cursor-pointer',
                      selectedId === item.id && 'bg-muted/50',
                    )
                  "
                  @click="handleSelect(item)"
                >
                  <TableCell class="font-medium">{{ item.user.name }}</TableCell>
                  <TableCell>{{ item.user.email }}</TableCell>
                  <TableCell>{{ formatDisplayDate(item.date) }}</TableCell>
                  <TableCell>{{ item.correct }}</TableCell>
                  <TableCell>{{ item.wrong }}</TableCell>
                  <TableCell>
                    <Badge :variant="item.status === 'completed' ? 'default' : 'secondary'">
                      {{ item.status === 'completed' ? 'Hoàn thành' : 'Đang làm' }}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </template>
      </CardContent>
    </Card>

    <Card v-if="selectedId">
      <CardHeader class="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Chi tiết nhập mã</CardTitle>
          <CardDescription v-if="detail" class="mt-1.5">
            {{ detail.user.name }} · {{ formatDisplayDate(detail.date) }} · Đúng
            {{ detail.correct }} · Sai {{ detail.wrong }}
          </CardDescription>
        </div>
        <Button
          v-if="detail?.answers.length"
          type="button"
          variant="outline"
          class="gap-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          :disabled="!selectedCount || isDeleting"
          @click="handleDeleteSelected"
        >
          <Trash2 class="size-4" />
          {{ selectedCount ? `Xóa đã chọn (${selectedCount})` : 'Xóa đã chọn' }}
        </Button>
      </CardHeader>
      <CardContent>
        <div v-if="isLoadingDetail" class="text-muted-foreground">
          Đang tải chi tiết...
        </div>

        <div
          v-else-if="!detail?.answers.length"
          class="rounded-xl border border-dashed p-6 text-center text-muted-foreground"
        >
          Chưa nhập mã nào
        </div>

        <template v-else>
          <div class="mb-3 flex items-center gap-2 md:hidden">
            <Checkbox
              :model-value="allSelected"
              @update:model-value="toggleSelectAll"
            />
            <span class="text-sm text-muted-foreground">Chọn tất cả</span>
          </div>

          <div class="space-y-3 md:hidden">
            <div
              v-for="answer in detail!.answers"
              :key="`${answer.order}-${answer.inputCode}`"
              class="flex items-center gap-3 rounded-xl border p-3"
            >
              <Checkbox
                :model-value="isOrderSelected(answer.order)"
                @update:model-value="(checked) => toggleOrder(answer.order, checked)"
              />
              <div class="min-w-0 flex-1">
                <p class="font-mono text-base font-semibold tracking-widest">
                  {{ answer.inputCode }}
                </p>
                <p class="text-xs text-muted-foreground">
                  #{{ answer.order }} · {{ formatDisplayTime(answer.submittedAt) }}
                </p>
              </div>
              <Badge :variant="answer.isCorrect ? 'default' : 'destructive'">
                {{ answer.isCorrect ? 'Đúng' : 'Sai' }}
              </Badge>
            </div>
          </div>

          <div class="hidden overflow-hidden rounded-xl border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-12">
                    <Checkbox
                      :model-value="allSelected"
                      @update:model-value="toggleSelectAll"
                    />
                  </TableHead>
                  <TableHead>#</TableHead>
                  <TableHead>Mã đã nhập</TableHead>
                  <TableHead>Kết quả</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="answer in detail!.answers"
                  :key="`${answer.order}-${answer.inputCode}`"
                >
                  <TableCell>
                    <Checkbox
                      :model-value="isOrderSelected(answer.order)"
                      @update:model-value="(checked) => toggleOrder(answer.order, checked)"
                    />
                  </TableCell>
                  <TableCell>{{ answer.order }}</TableCell>
                  <TableCell class="font-mono font-semibold tracking-widest">
                    {{ answer.inputCode }}
                  </TableCell>
                  <TableCell>
                    <Badge :variant="answer.isCorrect ? 'default' : 'destructive'">
                      {{ answer.isCorrect ? 'Đúng' : 'Sai' }}
                    </Badge>
                  </TableCell>
                  <TableCell>{{ formatDisplayTime(answer.submittedAt) }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
