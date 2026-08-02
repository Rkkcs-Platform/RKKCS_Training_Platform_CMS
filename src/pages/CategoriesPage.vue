<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { getErrorMessage, showError, showSuccess } from '@/common'
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
  createAdminCategory,
  fetchAdminCategories,
  updateAdminCategory,
  type AdminCategory,
} from '@/services/phase5.service'

const isLoading = ref(false)
const isSubmitting = ref(false)
const items = ref<AdminCategory[]>([])
const form = reactive({
  categoryCode: '',
  name: '',
  description: '',
})

async function load() {
  isLoading.value = true
  try {
    const data = await fetchAdminCategories({ page: 1, limit: 100 })
    items.value = data.items ?? []
  } catch (error) {
    showError(getErrorMessage(error) || 'Không tải được categories')
  } finally {
    isLoading.value = false
  }
}

async function handleCreate() {
  if (!form.categoryCode.trim() || !form.name.trim()) {
    showError('Vui lòng nhập mã và tên category')
    return
  }
  isSubmitting.value = true
  try {
    await createAdminCategory({
      categoryCode: form.categoryCode.trim(),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
    })
    showSuccess('Đã tạo category')
    form.categoryCode = ''
    form.name = ''
    form.description = ''
    await load()
  } catch (error) {
    showError(getErrorMessage(error) || 'Tạo category thất bại')
  } finally {
    isSubmitting.value = false
  }
}

async function toggleStatus(item: AdminCategory) {
  try {
    await updateAdminCategory(item.id, {
      status: item.status === 'active' ? 'inactive' : 'active',
    })
    showSuccess('Đã cập nhật trạng thái')
    await load()
  } catch (error) {
    showError(getErrorMessage(error) || 'Cập nhật thất bại')
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
        <CardTitle>Categories</CardTitle>
        <CardDescription>Danh mục sản phẩm toàn platform</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-3 sm:grid-cols-3">
          <Input v-model="form.categoryCode" class="h-11" placeholder="Mã (OPS)" />
          <Input v-model="form.name" class="h-11" placeholder="Tên category" />
          <Input
            v-model="form.description"
            class="h-11"
            placeholder="Mô tả (tuỳ chọn)"
          />
        </div>
        <Button :disabled="isSubmitting" @click="handleCreate">
          {{ isSubmitting ? 'Đang tạo...' : 'Tạo category' }}
        </Button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Danh sách</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="isLoading" class="text-muted-foreground">Đang tải...</div>
        <div
          v-else-if="!items.length"
          class="rounded-xl border border-dashed p-8 text-center text-muted-foreground"
        >
          Chưa có category
        </div>
        <div v-else class="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="item in items" :key="item.id">
                <TableCell class="font-mono">{{ item.categoryCode }}</TableCell>
                <TableCell>
                  <div>{{ item.name }}</div>
                  <div
                    v-if="item.description"
                    class="text-xs text-muted-foreground"
                  >
                    {{ item.description }}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    :variant="item.status === 'active' ? 'default' : 'outline'"
                  >
                    {{ item.status }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" @click="toggleStatus(item)">
                    {{ item.status === 'active' ? 'Deactivate' : 'Activate' }}
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
