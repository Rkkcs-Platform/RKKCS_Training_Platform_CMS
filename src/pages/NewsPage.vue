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
  createAdminNews,
  fetchAdminNews,
  updateAdminNews,
  type AdminNews,
} from '@/services/phase5.service'

const isLoading = ref(false)
const isSubmitting = ref(false)
const items = ref<AdminNews[]>([])
const form = reactive({
  title: '',
  summary: '',
  content: '',
  publish: true,
})

async function load() {
  isLoading.value = true
  try {
    const data = await fetchAdminNews({ page: 1, limit: 100 })
    items.value = data.items ?? []
  } catch (error) {
    showError(getErrorMessage(error) || 'Không tải được news')
  } finally {
    isLoading.value = false
  }
}

async function handleCreate() {
  if (
    form.title.trim().length < 3 ||
    form.summary.trim().length < 10 ||
    form.content.trim().length < 20
  ) {
    showError('Title ≥3, summary ≥10, content ≥20 ký tự')
    return
  }
  isSubmitting.value = true
  try {
    await createAdminNews({
      title: form.title.trim(),
      summary: form.summary.trim(),
      content: form.content.trim(),
      status: form.publish ? 'published' : 'draft',
    })
    showSuccess('Đã tạo bài viết')
    form.title = ''
    form.summary = ''
    form.content = ''
    await load()
  } catch (error) {
    showError(getErrorMessage(error) || 'Tạo news thất bại')
  } finally {
    isSubmitting.value = false
  }
}

async function togglePublish(item: AdminNews) {
  try {
    await updateAdminNews(item.id, {
      status: item.status === 'published' ? 'draft' : 'published',
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
        <CardTitle>News</CardTitle>
        <CardDescription>
          Viết tin đăng cho Shop Owner Portal
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <Input v-model="form.title" class="h-11" placeholder="Tiêu đề" />
        <Input v-model="form.summary" class="h-11" placeholder="Tóm tắt" />
        <textarea
          v-model="form.content"
          rows="6"
          class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          placeholder="Nội dung chi tiết"
        />
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.publish" type="checkbox" class="size-4" />
          Publish ngay
        </label>
        <Button :disabled="isSubmitting" @click="handleCreate">
          {{ isSubmitting ? 'Đang tạo...' : 'Tạo bài viết' }}
        </Button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Danh sách tin</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <div v-if="isLoading" class="text-muted-foreground">Đang tải...</div>
        <div
          v-else-if="!items.length"
          class="rounded-xl border border-dashed p-8 text-center text-muted-foreground"
        >
          Chưa có bài viết
        </div>
        <div
          v-for="item in items"
          :key="item.id"
          class="rounded-xl border p-4"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-medium">{{ item.title }}</p>
              <p class="mt-1 text-sm text-muted-foreground">{{ item.summary }}</p>
              <p class="mt-1 font-mono text-xs text-muted-foreground">
                /{{ item.slug }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <Badge
                :variant="item.status === 'published' ? 'default' : 'outline'"
              >
                {{ item.status }}
              </Badge>
              <Button size="sm" variant="outline" @click="togglePublish(item)">
                {{ item.status === 'published' ? 'Unpublish' : 'Publish' }}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
