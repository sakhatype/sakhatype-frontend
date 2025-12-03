<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User } from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const authStore = useAuthStore()
const router = useRouter()
const isOpen = ref(false)
const errorMessage = ref('')

// формы
const loginForm = ref({ username: '', password: '' })
const registerForm = ref({ username: '', password: '', confirmPassword: '' })

const login = async () => {
  try {
    errorMessage.value = ''
    await authStore.login(loginForm.value.username, loginForm.value.password)
    isOpen.value = false
    // Перенаправляем на профиль после входа
    router.push('/profile')
  } catch (error: any) {
    errorMessage.value = error.message || 'Ошибка входа'
  }
}

const register = async () => {
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    errorMessage.value = 'Пароли не совпадают!'
    return
  }
  
  if (registerForm.value.password.length < 4) {
    errorMessage.value = 'Пароль должен быть минимум 4 символа'
    return
  }

  try {
    errorMessage.value = ''
    await authStore.register(registerForm.value.username, registerForm.value.password)
    isOpen.value = false
    // Перенаправляем на профиль после регистрации
    router.push('/profile')
  } catch (error: any) {
    errorMessage.value = error.message || 'Ошибка регистрации'
  }
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogTrigger as-child>
      <Button variant="outline" class="flex items-center gap-2 cursor-pointer select-none">
        <User :size="16" />
        <span>Войти</span>
      </Button>
    </DialogTrigger>

    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle class="text-2xl font-bold text-center">Регистрация</DialogTitle>
      </DialogHeader>

      <Tabs default-value="login" class="w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="login">Войти</TabsTrigger>
          <TabsTrigger value="register">Регистрация</TabsTrigger>
        </TabsList>

        <!-- Сообщение об ошибке -->
        <div v-if="errorMessage" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">
          {{ errorMessage }}
        </div>

        <!-- Форма входа -->
        <TabsContent value="login">
          <form @submit.prevent="login" class="space-y-4 mt-4">
            <div class="space-y-2">
              <Label for="login-username">Имя пользователя</Label>
              <Input
                id="login-username"
                v-model="loginForm.username"
                type="text"
                placeholder="username"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="login-password">Пароль</Label>
              <Input
                id="login-password"
                v-model="loginForm.password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" class="w-full" :disabled="authStore.isLoading">
              {{ authStore.isLoading ? 'Подождите...' : 'Войти' }}
            </Button>
          </form>
        </TabsContent>

        <!-- Форма регистрации -->
        <TabsContent value="register">
          <form @submit.prevent="register" class="space-y-4 mt-4">
            <div class="space-y-2">
              <Label for="register-username">Имя пользователя</Label>
              <Input
                id="register-username"
                v-model="registerForm.username"
                type="text"
                placeholder="username"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="register-password">Пароль</Label>
              <Input
                id="register-password"
                v-model="registerForm.password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="register-confirm">Повтор пароля</Label>
              <Input
                id="register-confirm"
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" class="w-full" :disabled="authStore.isLoading">
              {{ authStore.isLoading ? 'Подождите...' : 'Зарегистрироватся' }}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>
