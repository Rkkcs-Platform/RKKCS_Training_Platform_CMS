<script setup lang="ts">
import { onMounted, ref } from 'vue'
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
const isTogglingMaintenance = ref(false)

const selectedLanguage = ref<'vi' | 'en' | 'ja'>('vi')
const isUpdatingLanguage = ref(false)

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

const handleToggleMaintenance = async (checked: boolean) => {
  isTogglingMaintenance.value = true
  try {
    const result = await setMaintenanceMode(checked)
    maintenanceEnabled.value = result.maintenance
    showSettingUpdateSuccess()
  } catch (error) {
    maintenanceEnabled.value = !checked
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
    maintenanceEnabled.value = maintenanceData.maintenance
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
        <CardTitle>Chế độ bảo trì</CardTitle>
        <CardDescription>
          Khi bật, trang USER sẽ hiển thị màn hình bảo trì. Người dùng không thể truy cập hệ thống.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium">
              {{ maintenanceEnabled ? '🔴 Đang bảo trì' : '🟢 Hoạt động bình thường' }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              {{ maintenanceEnabled
                ? 'Người dùng đang thấy màn hình bảo trì'
                : 'Hệ thống đang hoạt động bình thường'
              }}
            </p>
          </div>
          <Switch
            :model-value="maintenanceEnabled"
            :disabled="isTogglingMaintenance || isLoading"
            @update:model-value="handleToggleMaintenance"
          />
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
