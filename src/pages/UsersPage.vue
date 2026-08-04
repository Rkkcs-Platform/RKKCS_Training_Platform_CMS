<script setup lang="ts">
import { ref } from 'vue'
import {
  getErrorMessage,
  showError,
  showSuccess,
} from '@/common'
import { TOAST_MESSAGES } from '@/common/constants/messages'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { createShop } from '@/services/shop.service'
import { createUser } from '@/services/user.service'

const name = ref('')
const email = ref('')
const password = ref('')
const staffCode = ref('')
const createShopToo = ref(true)
const shopCode = ref('')
const shopName = ref('')
const lastCreatedUserId = ref('')
const isSubmitting = ref(false)

function resetForm() {
  name.value = ''
  email.value = ''
  password.value = ''
  staffCode.value = ''
  shopCode.value = ''
  shopName.value = ''
}

async function handleCreate() {
  if (
    !name.value.trim()
    || !email.value.trim()
    || !password.value
    || !staffCode.value.trim()
  ) {
    showError(TOAST_MESSAGES.users.missingFields)
    return
  }

  if (password.value.length < 6) {
    showError(TOAST_MESSAGES.users.passwordTooShort)
    return
  }

  if (createShopToo.value && (!shopCode.value.trim() || !shopName.value.trim())) {
    showError(TOAST_MESSAGES.shops.missingFields)
    return
  }

  isSubmitting.value = true

  try {
    const data = await createUser({
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
      staffCode: staffCode.value.trim(),
      role: 'user',
    })

    lastCreatedUserId.value = data.user.id
    let message = `${TOAST_MESSAGES.users.createSuccess}: ${data.user.email} · ID: ${data.user.id}`

    if (createShopToo.value) {
      const shop = await createShop({
        shopCode: shopCode.value.trim(),
        shopName: shopName.value.trim(),
        ownerId: data.user.id,
      })
      message += ` · Shop ${shop.shopCode}`
    }

    showSuccess(message)
    resetForm()
  } catch (error) {
    showError(getErrorMessage(error) || TOAST_MESSAGES.users.createFailed)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-5">
    <Card>
      <CardHeader>
        <CardTitle>Tạo tài khoản Shop Owner</CardTitle>
        <CardDescription>
          User không tự đăng ký. Có thể tạo kèm Shop (1 owner = 1 shop) trong cùng bước.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form class="mx-auto max-w-lg space-y-4" @submit.prevent="handleCreate">
          <div class="space-y-2">
            <label class="text-sm font-medium" for="user-name">Họ tên</label>
            <Input
              id="user-name"
              v-model="name"
              class="h-11"
              placeholder="Nguyễn Văn A"
              autocomplete="name"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium" for="user-email">Email</label>
            <Input
              id="user-email"
              v-model="email"
              type="email"
              class="h-11"
              placeholder="owner@gmail.com"
              autocomplete="email"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium" for="user-staff">Mã nhân viên</label>
            <Input
              id="user-staff"
              v-model="staffCode"
              class="h-11"
              placeholder="4819"
              maxlength="4"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium" for="user-password">Mật khẩu tạm</label>
            <Input
              id="user-password"
              v-model="password"
              type="password"
              class="h-11"
              placeholder="Tối thiểu 6 ký tự"
              autocomplete="new-password"
            />
          </div>

          <div class="flex items-center gap-3 rounded-xl border p-3">
            <Checkbox id="create-shop-too" v-model="createShopToo" />
            <label class="text-sm font-medium" for="create-shop-too">
              Tạo kèm Shop cho user này
            </label>
          </div>

          <template v-if="createShopToo">
            <div class="space-y-2">
              <label class="text-sm font-medium" for="shop-code">Shop code</label>
              <Input id="shop-code" v-model="shopCode" class="h-11" placeholder="SHOP001" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium" for="shop-name">Tên shop</label>
              <Input id="shop-name" v-model="shopName" class="h-11" placeholder="Chi nhánh Hà Nội" />
            </div>
          </template>

          <Button type="submit" class="h-11 w-full" :disabled="isSubmitting">
            {{ isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản' }}
          </Button>

          <p
            v-if="lastCreatedUserId"
            class="rounded-lg bg-muted px-3 py-2 font-mono text-xs break-all"
          >
            Last user ID: {{ lastCreatedUserId }}
          </p>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
