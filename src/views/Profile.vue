<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import { apiService } from '@/services/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert } from '@/components/ui/alert'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Clock, CirclePlay, LogOut, CalendarDays, Zap } from 'lucide-vue-next'

const { isDark } = useTheme()
const authStore = useAuthStore()
const router = useRouter()

const isLogoutDialogOpen = ref(false)
const isLoading = ref(true)
const profile = ref<any>(null)
const testResults = ref<any[]>([])

const levelProgress = computed(() => {
  if (!profile.value) return { current: 0, max: 1000, percentage: 0, toNext: 1000 }
  const currentLevelXp = (profile.value.level - 1) * 1000
  const nextLevelXp = profile.value.level * 1000
  const currentXp = profile.value.total_experience
  const progressInLevel = currentXp - currentLevelXp
  const percentage = (progressInLevel / 1000) * 100
  const toNext = nextLevelXp - currentXp
  return { current: progressInLevel, max: 1000, percentage: Math.min(100, percentage), toNext }
})

const formattedDate = computed(() => {
  if (!profile.value?.created_at) return ''
  return new Date(profile.value.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
})

const totalTimeFormatted = computed(() => {
  if (!profile.value) return '0 мин'
  const min = Math.floor(profile.value.total_time_seconds / 60)
  const h = Math.floor(min / 60)
  const rm = min % 60
  return h > 0 ? `${h} ч ${rm} м` : `${min} м`
})

const userInitial = computed(() => authStore.username?.[0]?.toUpperCase() || 'U')

onMounted(async () => {
  if (!authStore.isAuthenticated) { router.push('/'); return }
  try {
    isLoading.value = true
    const [p, r] = await Promise.all([
      apiService.getUserProfile(authStore.username!),
      apiService.getUserResults(authStore.username!, 10)
    ])
    profile.value = p
    testResults.value = r
  } catch (e) {
    console.error('Profile load failed:', e)
  } finally {
    isLoading.value = false
  }
})

const logout = () => { authStore.logout(); isLogoutDialogOpen.value = false; router.push('/') }
</script>

<template>
  <div>
    <header>
      <div class="py-3 sm:py-4">
        <h1 :class="['text-2xl sm:text-3xl font-bold', isDark ? 'text-white' : 'text-gray-900']">Профиль</h1>
      </div>
    </header>

    <div v-if="isLoading" class="py-12 text-center">
      <p :class="['text-lg', isDark ? 'text-neutral-400' : 'text-neutral-600']">Загрузка...</p>
    </div>

    <main v-else-if="profile" class="py-2">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <!-- Profile card -->
        <Card class="col-span-1 md:col-span-2 p-2">
          <CardContent class="p-2">
            <div class="flex items-stretch gap-3">
              <div class="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span class="text-white text-2xl sm:text-3xl font-bold">{{ userInitial }}</span>
              </div>
              <div class="flex flex-col justify-between flex-1 min-w-0">
                <div>
                  <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 :class="['text-lg sm:text-2xl font-bold truncate', isDark ? 'text-white' : 'text-gray-900']">{{ profile.username }}</h2>
                    <Badge class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-0.5 text-xs flex-shrink-0">Ур. {{ profile.level }}</Badge>
                  </div>
                  <div class="flex flex-col flex-1">
                    <p :class="['text-xs mb-1', isDark ? 'text-neutral-400' : 'text-neutral-600']">Опыт</p>
                    <Progress :model-value="levelProgress.percentage" :max="100" :class="['h-2 w-full', isDark ? 'bg-neutral-900' : 'bg-gray-200']" />
                    <div class="flex items-center justify-between text-xs w-full mt-1 flex-wrap gap-1">
                      <span :class="isDark ? 'text-neutral-400' : 'text-neutral-600'">{{ levelProgress.current }} / {{ levelProgress.max }}</span>
                      <div class="gap-1 flex items-center">
                        <span :class="['hidden sm:inline', isDark ? 'text-neutral-400' : 'text-neutral-600']">Ещё {{ levelProgress.toNext }} до</span>
                        <Badge variant="secondary" class="text-xs bg-purple-500 hover:bg-purple-600 text-white">Ур. {{ profile.level + 1 }}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-1 mt-2">
                  <CalendarDays :size="14" :class="isDark ? 'text-neutral-400' : 'text-neutral-600'" />
                  <span :class="['text-xs', isDark ? 'text-neutral-500' : 'text-neutral-600']">{{ formattedDate }}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Stats -->
        <Card class="flex items-center justify-center py-0">
          <CardContent class="p-2 w-full">
            <div class="space-y-2 w-full flex flex-col items-center justify-center">
              <Alert class="flex items-center justify-between gap-2 p-1 px-3 w-full">
                <div class="flex items-center gap-2">
                  <CirclePlay :size="16" :class="isDark ? 'text-neutral-400' : 'text-neutral-600'" />
                  <span :class="['text-xs sm:text-sm', isDark ? 'text-neutral-400' : 'text-neutral-600']">Тестов</span>
                </div>
                <span :class="['text-base font-bold', isDark ? 'text-white' : 'text-gray-900']">{{ profile.total_tests }}</span>
              </Alert>
              <Alert class="flex items-center justify-between gap-2 p-1 px-3 w-full">
                <div class="flex items-center gap-2">
                  <Zap :size="16" :class="isDark ? 'text-neutral-400' : 'text-neutral-600'" />
                  <span :class="['text-xs sm:text-sm', isDark ? 'text-neutral-400' : 'text-neutral-600']">Лучший WPM</span>
                </div>
                <span :class="['text-base font-bold', isDark ? 'text-white' : 'text-gray-900']">{{ Math.round(profile.best_wpm) }}</span>
              </Alert>
              <Alert class="flex items-center justify-between gap-2 p-1 px-3 w-full">
                <div class="flex items-center gap-2">
                  <Clock :size="16" :class="isDark ? 'text-neutral-400' : 'text-neutral-600'" />
                  <span :class="['text-xs sm:text-sm', isDark ? 'text-neutral-400' : 'text-neutral-600']">Время</span>
                </div>
                <span :class="['text-base font-bold', isDark ? 'text-white' : 'text-gray-900']">{{ totalTimeFormatted }}</span>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Recent tests -->
      <div class="mt-4 sm:mt-6" v-if="testResults.length > 0">
        <h2 :class="['text-lg sm:text-xl font-bold mb-3', isDark ? 'text-white' : 'text-gray-900']">Последние тесты</h2>
        <Card>
          <CardContent class="p-2 sm:p-3">
            <div class="space-y-2">
              <div v-for="(r, i) in testResults" :key="i"
                   :class="['flex items-center justify-between p-2 rounded-lg', isDark ? 'bg-neutral-900' : 'bg-gray-50']">
                <div class="flex items-center gap-2 sm:gap-3">
                  <Badge variant="outline" class="text-xs">{{ r.time_mode }}с</Badge>
                  <Badge variant="outline" class="text-xs">{{ r.difficulty === 'high' ? 'Якут.' : 'Обыч.' }}</Badge>
                  <div>
                    <p :class="['text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900']">{{ Math.round(r.wpm) }} WPM</p>
                    <p :class="['text-xs', isDark ? 'text-neutral-400' : 'text-neutral-600']">{{ Math.round(r.accuracy) }}%</p>
                  </div>
                </div>
                <div :class="['text-xs', isDark ? 'text-neutral-500' : 'text-neutral-600']">
                  {{ new Date(r.created_at).toLocaleDateString('ru-RU') }}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>

    <AlertDialog :open="isLogoutDialogOpen" @update:open="isLogoutDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Выйти?</AlertDialogTitle>
          <AlertDialogDescription>Вы уверены?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Нет</AlertDialogCancel>
          <AlertDialogAction @click="logout">Да</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
