<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Trophy, User, LogOut, Menu, X } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import { apiService } from '@/services/api'
import LoginDialog from './LoginDialog.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/shared/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const { isDark } = useTheme()
const authStore = useAuthStore()
const router = useRouter()
const userLevel = ref<number>(1)
const mobileMenuOpen = ref(false)

// Загрузить уровень пользователя
async function loadUserLevel() {
  if (authStore.isAuthenticated && authStore.username) {
    try {
      const profile = await apiService.getUserProfile(authStore.username)
      userLevel.value = profile.level
    } catch (error) {
      console.error('Failed to load user profile:', error)
    }
  } else {
    userLevel.value = 1
  }
}

// Загрузить при монтировании
onMounted(() => {
  loadUserLevel()
})

// Перезагрузить при смене авторизации (логин/логаут)
watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      // Небольшая задержка чтобы токен успел сохраниться
      setTimeout(() => loadUserLevel(), 100)
    } else {
      userLevel.value = 1
    }
  }
)

// Слушаем кастомное событие обновления профиля (после сохранения теста)
function onProfileUpdate() {
  loadUserLevel()
}

onMounted(() => {
  window.addEventListener('sakhatype:test-saved', onProfileUpdate)
})

onUnmounted(() => {
  window.removeEventListener('sakhatype:test-saved', onProfileUpdate)
})

const handleLogout = () => {
  authStore.logout()
  mobileMenuOpen.value = false
  router.push('/')
}
</script>

<template>
  <header class="py-3 sm:py-5 flex items-center justify-between relative">
    <!-- Logo -->
    <router-link to="/" class="flex items-center gap-3 select-none cursor-pointer">
      <img :src="isDark ? '/logo.svg' : '/logo-b.svg'" class="h-8 sm:h-auto" />
    </router-link>

    <!-- Desktop nav -->
    <div class="hidden sm:flex items-center gap-4">
      <router-link
        to="/leaderboard"
        :class="[
          'flex items-center gap-2 transition-colors text-sm select-none cursor-pointer',
          isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-gray-900',
        ]"
      >
        <Trophy :size="16" />
        <span>Лидерборд</span>
      </router-link>

      <div v-if="authStore.isAuthenticated">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="flex items-center gap-2 cursor-pointer select-none">
              <User :size="16" />
              <span>{{ authStore.username }}</span>
              <Badge variant="secondary" class="ml-1">{{ userLevel }}</Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="router.push('/profile')" class="cursor-pointer">
              <User :size="16" class="mr-2" />
              <span>Профиль</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="handleLogout" class="cursor-pointer text-red-600">
              <LogOut :size="16" class="mr-2" />
              <span>Выйти</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <LoginDialog v-else />
    </div>

    <!-- Mobile hamburger -->
    <button
      class="sm:hidden p-2 rounded-lg"
      :class="isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-gray-900'"
      @click="mobileMenuOpen = !mobileMenuOpen"
    >
      <component :is="mobileMenuOpen ? X : Menu" :size="24" />
    </button>

    <!-- Mobile dropdown menu -->
    <div
      v-if="mobileMenuOpen"
      :class="[
        'sm:hidden absolute top-full left-[-16px] right-[-16px] z-50 border-b px-4 py-3 flex flex-col gap-2',
        isDark ? 'bg-[#0a0a0a] border-neutral-800' : 'bg-gray-50 border-gray-200'
      ]"
    >
      <router-link
        to="/leaderboard"
        :class="[
          'flex items-center gap-2 text-sm py-2',
          isDark ? 'text-neutral-300' : 'text-neutral-700'
        ]"
        @click="mobileMenuOpen = false"
      >
        <Trophy :size="16" />
        <span>Лидерборд</span>
      </router-link>

      <template v-if="authStore.isAuthenticated">
        <router-link
          to="/profile"
          :class="[
            'flex items-center gap-2 text-sm py-2',
            isDark ? 'text-neutral-300' : 'text-neutral-700'
          ]"
          @click="mobileMenuOpen = false"
        >
          <User :size="16" />
          <span>{{ authStore.username }}</span>
          <Badge variant="secondary" class="ml-1">{{ userLevel }}</Badge>
        </router-link>
        <button
          @click="handleLogout"
          class="flex items-center gap-2 text-sm py-2 text-red-500 w-full"
        >
          <LogOut :size="16" />
          <span>Выйти</span>
        </button>
      </template>
      <div v-else class="py-1">
        <LoginDialog />
      </div>
    </div>
  </header>
</template>
