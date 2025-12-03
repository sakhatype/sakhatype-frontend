<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import { apiService } from '@/services/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Clock, CirclePlay, LogOut, Settings, CalendarDays, Zap, Target } from 'lucide-vue-next'

const { isDark } = useTheme()
const authStore = useAuthStore()
const router = useRouter()

const isLogoutDialogOpen = ref(false)
const isLoading = ref(true)
const profile = ref<any>(null)
const testResults = ref<any[]>([])

// Расчет прогресса до следующего уровня
const levelProgress = computed(() => {
  if (!profile.value) return { current: 0, max: 100, percentage: 0, toNext: 100 }
  
  const currentLevelXp = (profile.value.level - 1) * 1000
  const nextLevelXp = profile.value.level * 1000
  const currentXp = profile.value.total_experience
  
  const progressInLevel = currentXp - currentLevelXp
  const xpNeededForLevel = 1000
  const percentage = (progressInLevel / xpNeededForLevel) * 100
  const toNext = nextLevelXp - currentXp
  
  return {
    current: progressInLevel,
    max: xpNeededForLevel,
    percentage,
    toNext
  }
})

const formattedDate = computed(() => {
  if (!profile.value?.created_at) return ''
  const date = new Date(profile.value.created_at)
  return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
})

const totalTimeFormatted = computed(() => {
  if (!profile.value) return '0 мин'
  const minutes = Math.floor(profile.value.total_time_seconds / 60)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (hours > 0) {
    return `${hours} ч ${remainingMinutes} м`
  }
  return `${minutes} м`
})

const userInitial = computed(() => {
  return authStore.username?.[0]?.toUpperCase() || 'U'
})

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    router.push('/')
    return
  }

  try {
    isLoading.value = true
    const [profileData, resultsData] = await Promise.all([
      apiService.getUserProfile(authStore.username!),
      apiService.getUserResults(authStore.username!, 10)
    ])
    profile.value = profileData
    testResults.value = resultsData
  } catch (error) {
    console.error('Failed to load profile:', error)
  } finally {
    isLoading.value = false
  }
})

const logout = () => {
  authStore.logout()
  isLogoutDialogOpen.value = false
  router.push('/')
}

const openLogoutDialog = () => {
  isLogoutDialogOpen.value = true
}
</script>

<template>
  <div>
    <!-- Header -->
    <header :class="[isDark ? 'border-gray-800' : 'border-gray-200']">
      <div class="container mx-auto py-4 flex items-center justify-between">
        <h1 :class="['text-3xl font-bold', isDark ? 'text-white' : 'text-gray-900']">Профиль</h1>
        <div class="flex items-center gap-3">
          <!-- <Button class="select-none cursor-pointer" variant="outline" @click="openLogoutDialog">
            <LogOut :size="20" /> Запасная кнопка под редактировать есле чо диэннэ
          </Button> -->
        </div>
      </div>
    </header>

    <!-- Loading state -->
    <div v-if="isLoading" class="container mx-auto px-1 py-12 text-center">
      <p :class="['text-lg', isDark ? 'text-neutral-400' : 'text-neutral-600']">Загрузка...</p>
    </div>

    <!-- Main Content -->
    <main v-else-if="profile" class="container mx-auto px-1 py-1">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <!-- Profile Card -->
        <Card :class="['col-span-2 p-2', isDark ? '' : 'bg-white']">
          <CardContent class="p-2">
            <div class="flex items-stretch gap-4">
              <div
                class="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0"
              >
                <span class="text-white text-4xl font-bold">{{ userInitial }}</span>
              </div>

              <div class="flex flex-col justify-between flex-1">
                <!-- Верх -->
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <h2 :class="['text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900']">
                      {{ profile.username }}
                    </h2>
                    <Badge class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs">
                      Ур. {{ profile.level }}
                    </Badge>
                  </div>

                  <!-- Центр -->
                  <div class="flex flex-col justify-center flex-1">
                    <p :class="['text-sm mb-1', isDark ? 'text-neutral-400' : 'text-neutral-600']">
                      Опыт
                    </p>
                    <Progress
                      :model-value="levelProgress.percentage"
                      :max="100"
                      :class="['h-2 w-full', isDark ? 'bg-neutral-900' : 'bg-gray-200']"
                    />
                    <div class="flex items-center justify-between text-xs w-full mt-1">
                      <span :class="isDark ? 'text-neutral-400' : 'text-neutral-600'">
                        {{ levelProgress.current }} / {{ levelProgress.max }}
                      </span>
                      <div class="gap-1 flex items-center">
                        <span :class="isDark ? 'text-neutral-400' : 'text-neutral-600'"
                          >Еще {{ levelProgress.toNext }} до
                        </span>
                        <Badge
                          variant="secondary"
                          class="text-xs bg-purple-500 hover:bg-purple-600 text-white"
                        >
                          Ур. {{ profile.level + 1 }}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Низ -->
                <div class="flex items-center gap-1">
                  <CalendarDays :size="16" :class="isDark ? 'text-neutral-400' : 'text-neutral-600'" />
                  <span :class="['text-xs', isDark ? 'text-neutral-500' : 'text-neutral-600']">
                    Дата регистрации:  {{ formattedDate }}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Stats Card -->
        <Card class="flex items-center justify-center py-0">
          <CardContent class="p-2 w-full">
            <div class="space-y-2 w-full flex flex-col items-center justify-center">
              <Alert class="flex items-center justify-between gap-2 p-1 px-3 w-full">
                <div class="flex items-center gap-2">
                  <CirclePlay :size="20" :class="isDark ? 'text-neutral-400' : 'text-neutral-600'" />
                  <span :class="['text-sm', isDark ? 'text-neutral-400' : 'text-neutral-600']"
                    >Пройдено тестов</span
                  >
                </div>
                <span :class="['text-lg font-bold', isDark ? 'text-white' : 'text-gray-900']">
                  {{ profile.total_tests }}
                </span>
              </Alert>
              <Alert class="flex items-center justify-between gap-2 p-1 px-3 w-full">
                <div class="flex items-center gap-2">
                  <Zap :size="20" :class="isDark ? 'text-neutral-400' : 'text-neutral-600'" />
                  <span :class="['text-sm', isDark ? 'text-neutral-400' : 'text-neutral-600']"
                    >Лучший WPM</span
                  >
                </div>
                <span :class="['text-lg font-bold', isDark ? 'text-white' : 'text-gray-900']">
                  {{ Math.round(profile.best_wpm) }}
                </span>
              </Alert>
              <Alert class="flex items-center justify-between gap-2 p-1 px-3 w-full">
                <div class="flex items-center gap-2">
                  <Clock :size="20" :class="isDark ? 'text-neutral-400' : 'text-neutral-600'" />
                  <span :class="['text-sm', isDark ? 'text-neutral-400' : 'text-neutral-600']"
                    >Общее время печати</span
                  >
                </div>
                <span :class="['text-lg font-bold', isDark ? 'text-white' : 'text-gray-900']">
                  {{ totalTimeFormatted }}
                </span>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Recent Tests -->
      <div class="mt-8" v-if="testResults.length > 0">
        <h2 :class="['text-2xl font-bold mb-4', isDark ? 'text-white' : 'text-gray-900']">
          Последние тесты
        </h2>
        <Card :class="[isDark ? '' : 'bg-white']">
          <CardContent class="p-4">
            <div class="space-y-3">
              <div
                v-for="result in testResults"
                :key="result.id"
                :class="[
                  'flex items-center justify-between p-3 rounded-lg',
                  isDark ? 'bg-neutral-900' : 'bg-gray-50'
                ]"
              >
                <div class="flex items-center gap-4">
                  <Badge variant="outline">{{ result.time_mode }}s</Badge>
                  <div>
                    <p :class="['font-semibold', isDark ? 'text-white' : 'text-gray-900']">
                      {{ Math.round(result.wpm) }} WPM
                    </p>
                    <p :class="['text-sm', isDark ? 'text-neutral-400' : 'text-neutral-600']">
                      Сөпкэ: {{ Math.round(result.accuracy) }}%
                    </p>
                  </div>
                </div>
                <div :class="['text-xs', isDark ? 'text-neutral-500' : 'text-neutral-600']">
                  {{ new Date(result.created_at).toLocaleDateString('ru-RU') }}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>

    <!-- Logout Dialog -->
    <AlertDialog :open="isLogoutDialogOpen" @update:open="isLogoutDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Тахсары гыныҥ дуо?</AlertDialogTitle>
          <AlertDialogDescription>
            Тахсаары кэннэ эн аатыҥ туһунан сибээстээх информацияҥы көрүөххэ буолбат.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Суох</AlertDialogCancel>
          <AlertDialogAction @click="logout">Тахсыы</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
