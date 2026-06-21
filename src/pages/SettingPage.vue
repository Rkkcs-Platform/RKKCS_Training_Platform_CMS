<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { getSettingChallenge, updateSettingChallenge } from '@/services/setting.service'
import { onMounted, ref } from 'vue'
import { ChallengeGenerationSettings, defaultSetting } from '@/types/setting'

const setting = ref<ChallengeGenerationSettings>({ ...defaultSetting })
const isSaving = ref(false)

const handleUpdateSetting = async () => {
  isSaving.value = true
  try {
    setting.value = await updateSettingChallenge({
      codeCount: Number(setting.value.codeCount),
      codeLength: Number(setting.value.codeLength),
      isAutoRandomCodeCount: setting.value.isAutoRandomCodeCount,
      generateTime: setting.value.generateTime ?? '03:00',
    })
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  setting.value = await getSettingChallenge()
})
</script>

<template>
    <div class="container flex flex-col gap-4">
        <div>
            <label class="text-sm font-medium" for="codeCount">Số mã code render</label>
            <Input
              v-model.number="setting.codeCount"
              :disabled="setting.isAutoRandomCodeCount"
              id="codeCount"
              type="number"
              name="codeNumberRender"
              placeholder="Số mã code render trong ngày"
            />
        </div>
        <div>
            <label class="text-sm font-medium" for="codeLength">Độ dài code</label>
            <Input
              v-model.number="setting.codeLength"
              id="codeLength"
              type="number"
              name="codeLength"
              placeholder="Độ dài code"
            />
        </div>
        <div class="flex items-center gap-3">
            <Checkbox
              id="auto-random-code-count"
              v-model="setting.isAutoRandomCodeCount"
            />
            <label class="text-sm font-medium" for="auto-random-code-count">
              Auto random số lượng mã code
            </label>
        </div>
        <Button
          size="lg"
          class="w-30 cursor-pointer"
          :disabled="isSaving"
          @click="handleUpdateSetting"
        >
            {{ isSaving ? 'Đang lưu...' : 'Update' }}
        </Button>
    </div>
</template>
<style lang="css" scoped></style>
