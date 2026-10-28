<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { showError } from '@/common'
import { applyImageCrop, readCropSizeFromUrl } from '@/common/utils/image-url'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const model = defineModel<string>({ default: '' })

const props = withDefaults(
  defineProps<{
    broken?: boolean
  }>(),
  { broken: false },
)

const emit = defineEmits<{
  brokenChange: [value: boolean]
}>()

const cropWidth = ref(400)
const cropHeight = ref(400)

const previewUrl = computed(() => model.value.trim())

watch(
  () => model.value,
  (value) => {
    const size = readCropSizeFromUrl(value)
    if (size) {
      cropWidth.value = size.width
      cropHeight.value = size.height
    }
  },
  { immediate: true },
)

function onUrlUpdate(value: string | number) {
  model.value = String(value)
  emit('brokenChange', false)
}

function applyCrop() {
  try {
    model.value = applyImageCrop(model.value, cropWidth.value, cropHeight.value)
    emit('brokenChange', false)
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Không áp dụng được crop')
  }
}

function applyPreset(size: number) {
  cropWidth.value = size
  cropHeight.value = size
  applyCrop()
}
</script>

<template>
  <div class="space-y-3">
    <div class="space-y-2">
      <label class="text-sm font-medium">URL ảnh</label>
      <Input
        :model-value="model"
        class="h-11"
        placeholder="https://..."
        @update:model-value="onUrlUpdate"
      />
      <p class="text-xs text-muted-foreground">
        Catalog dùng ảnh vuông 400×400. Dán URL rồi bấm Áp dụng crop (Unsplash gắn
        <code class="rounded bg-muted px-1">fit=crop</code>; link khác ép qua wsrv.nl).
      </p>
    </div>

    <div class="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/20 p-3">
      <div class="space-y-1">
        <label class="text-xs font-medium text-muted-foreground">Rộng</label>
        <Input
          v-model.number="cropWidth"
          type="number"
          min="1"
          class="h-10 w-24"
        />
      </div>
      <div class="space-y-1">
        <label class="text-xs font-medium text-muted-foreground">Cao</label>
        <Input
          v-model.number="cropHeight"
          type="number"
          min="1"
          class="h-10 w-24"
        />
      </div>
      <Button type="button" variant="outline" class="h-10" @click="applyCrop">
        Áp dụng crop
      </Button>
      <Button type="button" variant="outline" class="h-10" @click="applyPreset(400)">
        400×400
      </Button>
      <Button type="button" variant="outline" class="h-10" @click="applyPreset(800)">
        800×800
      </Button>
    </div>

    <div
      v-if="previewUrl"
      class="flex items-center gap-3 rounded-xl border bg-muted/30 p-3"
    >
      <div class="size-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
        <img
          v-if="!props.broken"
          :src="previewUrl"
          alt="Preview"
          class="size-full object-cover"
          @error="emit('brokenChange', true)"
        />
        <div
          v-else
          class="flex size-full items-center justify-center text-xs text-muted-foreground"
        >
          Lỗi ảnh
        </div>
      </div>
      <p class="min-w-0 break-all text-xs text-muted-foreground">{{ previewUrl }}</p>
    </div>
  </div>
</template>
