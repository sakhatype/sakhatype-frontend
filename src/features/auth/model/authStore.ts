import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/shared/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const username = ref<string | null>(localStorage.getItem('username'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!username.value)

  async function login(user: string, password: string) {
    try {
      isLoading.value = true
      error.value = null
      const data = await authApi.login(user, password)
      token.value = data.access_token
      username.value = data.username
      return data
    } catch (e: any) {
      error.value = e.message || 'Ошибка входа'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function register(user: string, password: string) {
    try {
      isLoading.value = true
      error.value = null
      await authApi.register(user, password)
      // После регистрации автоматически входим
      return await login(user, password)
    } catch (e: any) {
      error.value = e.message || 'Ошибка регистрации'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    token.value = null
    username.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('username')
  }

  return {
    token,
    username,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
  }
})
