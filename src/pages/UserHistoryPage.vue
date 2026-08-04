<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  formatDisplayDate,
  formatDisplayTime,
  getTodayDateString,
  showSubmissionDetailFailed,
  showSubmissionsLoadFailed,
} from '@/common'
import { Badge } from '@/components/ui/badge'
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

async function loadList() {
  isLoadingList.value = true

  try {
    const data = await fetchAdminSubmissions({
      page: 1,
      limit: 50,
      date: filterDate.value.trim(),
    })
    items.value = data.items ?? []
  } catch {
    showSubmissionsLoadFailed()
  } finally {
    isLoadingList.value = false
  }
}

async function handleSelect(item: AdminSubmissionItem) {
  selectedId.value = item.id
  isLoadingDetail.value = true

  try {
    detail.value = await fetchAdminSubmissionById(item.id)
  } catch {
    showSubmissionDetailFailed()
  } finally {
    isLoadingDetail.value = false
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
          Xem tiến độ và chi tiết mã user đã nhập theo ngày
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
      <CardHeader>
        <CardTitle>Chi tiết nhập mã</CardTitle>
        <CardDescription v-if="detail">
          {{ detail.user.name }} · {{ formatDisplayDate(detail.date) }} · Đúng
          {{ detail.correct }} · Sai {{ detail.wrong }}
        </CardDescription>
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
          <div class="space-y-3 md:hidden">
            <div
              v-for="answer in detail!.answers"
              :key="`${answer.order}-${answer.inputCode}`"
              class="flex items-center justify-between rounded-xl border p-3"
            >
              <div>
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
