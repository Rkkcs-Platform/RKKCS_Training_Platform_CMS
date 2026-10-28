<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  getErrorMessage,
  showError,
  showSettingUpdateFailed,
  showSettingUpdateSuccess,
} from '@/common'
import {
  getSettingChallenge,
  updateSettingChallenge,
  getMaintenanceStatus,
  setMaintenanceMode,
  setLanguage,
} from '@/services/setting.service'
import { ChallengeGenerationSettings, defaultSetting } from '@/types/setting'

const setting = ref<ChallengeGenerationSettings>({ ...defaultSetting })
const isSaving = ref(false)
const isLoading = ref(false)
const maintenanceEnabled = ref(false)
const maintenanceUntil = ref<string | null>(null)
const maintenanceUntilTime = ref('')
const isTogglingMaintenance = ref(false)

const selectedLanguage = ref<'vi' | 'en' | 'ja'>('vi')
const isUpdatingLanguage = ref(false)

const maintenanceUntilLabel = computed(() => {
  if (!maintenanceUntil.value) return null
  const date = new Date(maintenanceUntil.value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
})

function defaultUntilTime() {
  const next = new Date()
  next.setMinutes(0, 0, 0)
  next.setHours(next.getHours() + 1)
  return `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`
}

function timeFromIso(iso: string | null) {
  if (!iso) return defaultUntilTime()
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return defaultUntilTime()
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

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

const applyMaintenanceResult = (result: {
  maintenance: boolean
  until: string | null
}) => {
  maintenanceEnabled.value = result.maintenance
  maintenanceUntil.value = result.until
  maintenanceUntilTime.value = timeFromIso(result.until)
}

const handleToggleMaintenance = async (checked: boolean) => {
  if (checked && !maintenanceUntilTime.value) {
    showError('Chọn giờ mở lại hệ thống trước khi bật')
    return
  }

  isTogglingMaintenance.value = true
  try {
    const result = await setMaintenanceMode(
      checked,
      checked ? maintenanceUntilTime.value : undefined,
    )
    applyMaintenanceResult(result)
    showSettingUpdateSuccess()
  } catch (error) {
    showSettingUpdateFailed(getErrorMessage(error))
  } finally {
    isTogglingMaintenance.value = false
  }
}

const handleUpdateMaintenanceUntil = async () => {
  if (!maintenanceUntilTime.value) {
    showError('Chọn giờ mở lại hệ thống')
    return
  }

  isTogglingMaintenance.value = true
  try {
    const result = await setMaintenanceMode(true, maintenanceUntilTime.value)
    applyMaintenanceResult(result)
    showSettingUpdateSuccess()
  } catch (error) {
    showSettingUpdateFailed(getErrorMessage(error))
  } finally {
    isTogglingMaintenance.value = false
  }
}

const handleUpdateLanguage = async (lang: 'vi' | 'en' | 'ja') => {
  isUpdatingLanguage.value = true
  try {
    const result = await setLanguage(lang)
    selectedLanguage.value = result.language as 'vi' | 'en' | 'ja'
    showSettingUpdateSuccess()
  } catch (error) {
    showSettingUpdateFailed(getErrorMessage(error))
  } finally {
    isUpdatingLanguage.value = false
  }
}

onMounted(async () => {
  isLoading.value = true
  try {
    const [settingData, maintenanceData] = await Promise.all([
      getSettingChallenge(),
      getMaintenanceStatus(),
    ])
    setting.value = settingData
    applyMaintenanceResult(maintenanceData)
    selectedLanguage.value = (maintenanceData.language as 'vi' | 'en' | 'ja') || 'vi'
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
        <CardTitle>Tạm dừng hệ thống</CardTitle>
        <CardDescription>
          Khi bật, trang USER báo hệ thống đang cập nhật đến giờ bạn chọn trong hôm nay. Đến giờ đó hệ thống tự mở lại.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-medium">
              {{ maintenanceEnabled ? 'Đang tạm dừng' : 'Hoạt động bình thường' }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              <template v-if="maintenanceEnabled && maintenanceUntilLabel">
                Dự kiến hoạt động trở lại lúc {{ maintenanceUntilLabel }} hôm nay
              </template>
              <template v-else-if="maintenanceEnabled">
                Người dùng đang thấy thông báo tạm dừng hệ thống
              </template>
              <template v-else>
                Hệ thống đang hoạt động bình thường
              </template>
            </p>
          </div>
          <Switch
            :model-value="maintenanceEnabled"
            :disabled="isTogglingMaintenance || isLoading"
            @update:model-value="handleToggleMaintenance"
          />
        </div>

        <div class="rounded-xl border bg-muted/30 p-4">
          <label class="text-sm font-medium" for="maintenance-until">
            Mở lại lúc (hôm nay)
          </label>
          <p class="mt-1 text-xs text-muted-foreground">
            Ví dụ chọn 15:00 thì hệ thống tự mở lại lúc 15:00 hôm nay.
          </p>
          <div class="mt-3 flex flex-wrap items-center gap-3">
            <Input
              id="maintenance-until"
              v-model="maintenanceUntilTime"
              type="time"
              class="h-11 w-40"
              :disabled="isTogglingMaintenance || isLoading"
            />
            <Button
              v-if="maintenanceEnabled"
              type="button"
              variant="outline"
              class="h-11"
              :disabled="isTogglingMaintenance || isLoading || !maintenanceUntilTime"
              @click="handleUpdateMaintenanceUntil"
            >
              Cập nhật giờ
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Ngôn ngữ mặc định của ứng dụng</CardTitle>
        <CardDescription>
          Thiết lập ngôn ngữ hiển thị mặc định cho ứng dụng USER.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex flex-wrap gap-4">
          <Button
            type="button"
            variant="outline"
            :class="[
              'flex items-center gap-2 h-11 px-6 border-slate-200/80 rounded-xl transition-all duration-200 shadow-sm hover:bg-slate-50 cursor-pointer',
              selectedLanguage === 'vi' ? 'border-sky-600 bg-sky-50 text-sky-700 font-semibold ring-2 ring-sky-100 hover:bg-sky-50' : ''
            ]"
            :disabled="isUpdatingLanguage || isLoading"
            @click="handleUpdateLanguage('vi')"
          >
            <span class="text-lg">🇻🇳</span>
            <span>Tiếng Việt (VN)</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            :class="[
              'flex items-center gap-2 h-11 px-6 border-slate-200/80 rounded-xl transition-all duration-200 shadow-sm hover:bg-slate-50 cursor-pointer',
              selectedLanguage === 'en' ? 'border-sky-600 bg-sky-50 text-sky-700 font-semibold ring-2 ring-sky-100 hover:bg-sky-50' : ''
            ]"
            :disabled="isUpdatingLanguage || isLoading"
            @click="handleUpdateLanguage('en')"
          >
            <span class="text-lg">🇺🇸</span>
            <span>English (EN)</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            :class="[
              'flex items-center gap-2 h-11 px-6 border-slate-200/80 rounded-xl transition-all duration-200 shadow-sm hover:bg-slate-50 cursor-pointer',
              selectedLanguage === 'ja' ? 'border-sky-600 bg-sky-50 text-sky-700 font-semibold ring-2 ring-sky-100 hover:bg-sky-50' : ''
            ]"
            :disabled="isUpdatingLanguage || isLoading"
            @click="handleUpdateLanguage('ja')"
          >
            <span class="text-lg">🇯🇵</span>
            <span>日本語 (JP)</span>
          </Button>
        </div>
      </CardContent>
    </Card>

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
