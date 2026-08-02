<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  getErrorMessage,
  showSettingUpdateFailed,
  showSettingUpdateSuccess,
} from '@/common'
import { getSettingChallenge, updateSettingChallenge } from '@/services/setting.service'
import { ChallengeGenerationSettings, defaultSetting } from '@/types/setting'

const setting = ref<ChallengeGenerationSettings>({ ...defaultSetting })
const isSaving = ref(false)
const isLoading = ref(false)

const handleUpdateSetting = async () => {
  isSaving.value = true
  try {
    setting.value = await updateSettingChallenge({
      codeCount: Number(setting.value.codeCount),
      codeLength: Number(setting.value.codeLength),
      isAutoRandomCodeCount: setting.value.isAutoRandomCodeCount,
      generateTime: setting.value.generateTime ?? '03:00',
    })
    showSettingUpdateSuccess()
  } catch (error) {
    showSettingUpdateFailed(getErrorMessage(error))
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  isLoading.value = true
  try {
    setting.value = await getSettingChallenge()
  } catch (error) {
    showSettingUpdateFailed(getErrorMessage(error))
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="space-y-5">
    <Card>
      <CardHeader>
        <CardTitle>Cài đặt sinh mã hàng ngày</CardTitle>
        <CardDescription>
          Áp dụng cho cron 03:00 và khi Generate batch (nếu không truyền override).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="isLoading" class="text-muted-foreground">Đang tải...</div>
        <form v-else class="mx-auto max-w-lg space-y-4" @submit.prevent="handleUpdateSetting">
          <div class="space-y-2">
            <label class="text-sm font-medium" for="codeCount">Số mã code / ngày</label>
            <Input
              id="codeCount"
              v-model.number="setting.codeCount"
              :disabled="setting.isAutoRandomCodeCount"
              type="number"
              class="h-11"
              placeholder="Số mã code render trong ngày"
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium" for="codeLength">Độ dài code</label>
            <Input
              id="codeLength"
              v-model.number="setting.codeLength"
              type="number"
              class="h-11"
              placeholder="Độ dài code"
            />
          </div>
          <div class="flex items-center gap-3">
            <Checkbox
              id="auto-random-code-count"
              v-model="setting.isAutoRandomCodeCount"
            />
            <label class="text-sm font-medium" for="auto-random-code-count">
              Auto random số lượng mã (6–20), bỏ qua giá trị ở trên
            </label>
          </div>
          <Button type="submit" class="h-11 w-full sm:w-auto" :disabled="isSaving">
            {{ isSaving ? 'Đang lưu...' : 'Lưu cài đặt' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
