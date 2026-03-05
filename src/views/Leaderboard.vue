<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import { apiService } from '@/services/api'
import { Card, CardContent } from '@/shared/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Alert } from '@/components/ui/alert'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Trophy, Medal, Search, ArrowUp, ArrowDown, Globe, Filter } from 'lucide-vue-next'

const { isDark } = useTheme()
const authStore = useAuthStore()

interface LeaderboardEntry {
  username: string
  best_wpm: number
  total_tests: number
  level?: number
  best_accuracy?: number
}

interface UserRank {
  rank: number
  username: string
  best_wpm: number
  total_tests: number
  level: number
}

const isLoading = ref(true)
const leaderboardData = ref<LeaderboardEntry[]>([])
const myRank = ref<UserRank | null>(null)

// Фильтры
const activeMode = ref<'filtered' | 'global'>('filtered')
const selectedDifficulty = ref<'normal' | 'high'>('normal')
const selectedTimeMode = ref<number>(30)
const searchQuery = ref('')
const sortColumn = ref<'username' | 'wpm' | 'level' | 'total_tests'>('wpm')
const sortDirection = ref<'asc' | 'desc'>('desc')

const timeModeOptions = [15, 30, 60, 120]
const difficultyOptions = [
  { value: 'normal', label: 'Обычная' },
  { value: 'high', label: 'Якутская' },
]
const modeOptions = [
  { value: 'filtered', label: 'По режиму' },
  { value: 'global', label: 'Общий' },
]

// Загрузка данных
async function loadLeaderboard() {
  isLoading.value = true
  myRank.value = null

  try {
    if (activeMode.value === 'global') {
      leaderboardData.value = await apiService.getGlobalLeaderboard(100)

      if (authStore.isAuthenticated) {
        try {
          myRank.value = await apiService.getMyGlobalRank()
        } catch (e) {
          // Нет данных — нормально
        }
      }
    } else {
      leaderboardData.value = await apiService.getLeaderboard(
        selectedDifficulty.value,
        selectedTimeMode.value,
        100
      )

      if (authStore.isAuthenticated) {
        try {
          myRank.value = await apiService.getMyRank(
            selectedDifficulty.value,
            selectedTimeMode.value
          )
        } catch (e) {
          // Нет данных — нормально
        }
      }
    }
  } catch (error) {
    console.error('Failed to load leaderboard:', error)
    leaderboardData.value = []
  } finally {
    isLoading.value = false
  }
}

// Перезагрузка при смене любого фильтра
watch([activeMode, selectedDifficulty, selectedTimeMode], () => {
  loadLeaderboard()
})

onMounted(() => {
  loadLeaderboard()
})

// Фильтрация и сортировка
const filteredLeaderboard = computed(() => {
  let filtered = leaderboardData.value.filter(user =>
    user.username.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
  return sortLeaderboard(filtered)
})

function sortLeaderboard(data: LeaderboardEntry[]) {
  const sorted = [...data]
  sorted.sort((a, b) => {
    let aVal: string | number
    let bVal: string | number
    switch (sortColumn.value) {
      case 'username': aVal = a.username; bVal = b.username; break
      case 'wpm': aVal = a.best_wpm; bVal = b.best_wpm; break
      case 'level': aVal = a.level || 0; bVal = b.level || 0; break
      case 'total_tests': aVal = a.total_tests; bVal = b.total_tests; break
      default: aVal = a.best_wpm; bVal = b.best_wpm
    }
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection.value === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection.value === 'asc' ? aVal - bVal : bVal - aVal
    }
    return 0
  })
  return sorted
}

function toggleSort(column: typeof sortColumn.value) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'desc'
  }
}

const getMedalColor = (index: number) => {
  if (index === 0) return 'text-yellow-500'
  if (index === 1) return 'text-neutral-400'
  if (index === 2) return 'text-orange-600'
  return 'text-neutral-500'
}

const getRankBadgeColor = (index: number) => {
  if (index === 0) return 'bg-yellow-500 text-white'
  if (index === 1) return 'bg-neutral-900 text-white'
  if (index === 2) return 'bg-orange-600 text-white'
  return ''
}

const isCurrentUser = (username: string) => {
  return authStore.isAuthenticated && authStore.username === username
}
</script>

<template>
  <div>
    <!-- Header -->
    <header :class="[isDark ? 'border-gray-800' : 'border-gray-200']">
      <div class="py-3 sm:py-4 md:py-6 flex items-center gap-3">
        <Trophy :size="24" class="sm:w-7 sm:h-7" :class="isDark ? 'text-yellow-500' : 'text-yellow-600'" />
        <h1 :class="['text-xl sm:text-2xl md:text-4xl font-bold', isDark ? 'text-white' : 'text-gray-900']">
          Лидерборд
        </h1>
      </div>
    </header>

    <main class="py-3 sm:py-4 md:py-6">
      <!-- Все фильтры в одном блоке -->
      <div class="flex flex-col items-center gap-3 mb-4 sm:mb-6">
        <!-- Режим: По режиму / Общий -->
        <Alert class="flex items-center gap-1 sm:gap-2 p-1 px-2 sm:px-3">
          <ToggleGroup
            type="single"
            :model-value="activeMode"
            @update:model-value="(v: string) => { if (v) activeMode = v as 'filtered' | 'global' }"
            class="flex gap-1"
          >
            <ToggleGroupItem
              v-for="opt in modeOptions"
              :key="opt.value"
              :value="opt.value"
              :class="[
                'px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all select-none cursor-pointer',
                isDark
                  ? 'data-[state=on]:bg-[#2a2a2a] data-[state=on]:text-white text-neutral-500 hover:bg-[#1a1a1a]'
                  : 'data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 text-neutral-500 hover:bg-gray-100',
              ]"
            >
              <Filter v-if="opt.value === 'filtered'" :size="14" class="mr-1 hidden sm:inline-block" />
              <Globe v-if="opt.value === 'global'" :size="14" class="mr-1 hidden sm:inline-block" />
              {{ opt.label }}
            </ToggleGroupItem>
          </ToggleGroup>
        </Alert>

        <!-- Фильтры difficulty + time_mode (только для режима "По режиму") -->
        <div v-if="activeMode === 'filtered'" class="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <!-- Difficulty -->
          <Alert class="flex items-center gap-1 sm:gap-2 p-1 px-2 sm:px-3">
            <ToggleGroup
              type="single"
              :model-value="selectedDifficulty"
              @update:model-value="(v: string) => { if (v) selectedDifficulty = v as 'normal' | 'high' }"
              class="flex gap-1"
            >
              <ToggleGroupItem
                v-for="opt in difficultyOptions"
                :key="opt.value"
                :value="opt.value"
                :class="[
                  'px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all select-none cursor-pointer',
                  isDark
                    ? 'data-[state=on]:bg-[#2a2a2a] data-[state=on]:text-white text-neutral-500 hover:bg-[#1a1a1a]'
                    : 'data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 text-neutral-500 hover:bg-gray-100',
                ]"
              >
                {{ opt.label }}
              </ToggleGroupItem>
            </ToggleGroup>
          </Alert>

          <!-- Time mode -->
          <Alert class="flex items-center gap-1 sm:gap-2 p-1 px-2 sm:px-3">
            <ToggleGroup
              type="single"
              :model-value="String(selectedTimeMode)"
              @update:model-value="(v: string) => { if (v) selectedTimeMode = Number(v) }"
              class="flex gap-1"
            >
              <ToggleGroupItem
                v-for="opt in timeModeOptions"
                :key="opt"
                :value="String(opt)"
                :class="[
                  'px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all select-none cursor-pointer',
                  isDark
                    ? 'data-[state=on]:bg-[#2a2a2a] data-[state=on]:text-white text-neutral-500 hover:bg-[#1a1a1a]'
                    : 'data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 text-neutral-500 hover:bg-gray-100',
                ]"
              >
                {{ opt }}с
              </ToggleGroupItem>
            </ToggleGroup>
          </Alert>
        </div>
      </div>

      <!-- Мой ранг -->
      <div
        v-if="myRank && !isLoading"
        :class="[
          'mb-4 p-3 sm:p-4 rounded-xl border-2 flex flex-col sm:flex-row items-center justify-between gap-2',
          isDark ? 'bg-blue-950/30 border-blue-800/50' : 'bg-blue-50 border-blue-200'
        ]"
      >
        <div class="flex items-center gap-3">
          <div :class="['text-2xl sm:text-3xl font-bold', isDark ? 'text-blue-400' : 'text-blue-600']">
            #{{ myRank.rank }}
          </div>
          <div>
            <p :class="['text-sm font-medium', isDark ? 'text-white' : 'text-gray-900']">
              {{ myRank.username }}
            </p>
            <p :class="['text-xs', isDark ? 'text-neutral-400' : 'text-neutral-600']">
              Ваша позиция в рейтинге
            </p>
          </div>
        </div>
        <div :class="['text-xl sm:text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900']">
          {{ Math.round(myRank.best_wpm) }} <span class="text-xs font-normal text-neutral-500">WPM</span>
        </div>
      </div>

      <!-- Search -->
      <div class="mb-4 flex items-center gap-2 max-w-md mx-auto">
        <Search :size="18" :class="isDark ? 'text-neutral-400' : 'text-neutral-600'" class="flex-shrink-0" />
        <Input
          v-model="searchQuery"
          placeholder="Поиск по имени..."
          class="flex-1 text-sm"
        />
      </div>

      <!-- Loading skeleton -->
      <div v-if="isLoading" class="space-y-3">
        <div
          v-for="i in 8"
          :key="i"
          :class="[
            'h-12 sm:h-14 rounded-lg animate-pulse',
            isDark ? 'bg-neutral-800' : 'bg-gray-200'
          ]"
        />
      </div>

      <!-- Leaderboard -->
      <Card v-else :class="[isDark ? '' : 'bg-white']">
        <CardContent class="p-0">
          <!-- Desktop Table -->
          <div class="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-16">Ранг</TableHead>
                  <TableHead>
                    <Button variant="ghost" @click="toggleSort('username')" class="flex items-center gap-1 text-xs sm:text-sm">
                      Имя
                      <component :is="sortDirection === 'asc' ? ArrowUp : ArrowDown" v-if="sortColumn === 'username'" :size="14" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" @click="toggleSort('level')" class="flex items-center gap-1 text-xs sm:text-sm">
                      Уровень
                      <component :is="sortDirection === 'asc' ? ArrowUp : ArrowDown" v-if="sortColumn === 'level'" :size="14" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" @click="toggleSort('total_tests')" class="flex items-center gap-1 text-xs sm:text-sm">
                      Тесты
                      <component :is="sortDirection === 'asc' ? ArrowUp : ArrowDown" v-if="sortColumn === 'total_tests'" :size="14" />
                    </Button>
                  </TableHead>
                  <TableHead class="text-right">
                    <Button variant="ghost" @click="toggleSort('wpm')" class="flex items-center gap-1 ml-auto text-xs sm:text-sm">
                      WPM
                      <component :is="sortDirection === 'asc' ? ArrowUp : ArrowDown" v-if="sortColumn === 'wpm'" :size="14" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="(user, index) in filteredLeaderboard"
                  :key="user.username"
                  :class="[
                    index < 3 && 'font-semibold',
                    isCurrentUser(user.username) && (isDark ? 'bg-blue-950/20' : 'bg-blue-50')
                  ]"
                >
                  <TableCell class="font-medium">
                    <Medal v-if="index < 3" :size="20" :class="getMedalColor(index)" />
                    <span v-else>{{ index + 1 }}</span>
                  </TableCell>
                  <TableCell>
                    <span :class="isCurrentUser(user.username) ? (isDark ? 'text-blue-400' : 'text-blue-600') : ''">
                      {{ user.username }}
                    </span>
                    <Badge v-if="isCurrentUser(user.username)" class="ml-2 text-xs bg-blue-500 text-white">Вы</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge :class="getRankBadgeColor(index)">Ур. {{ user.level || 1 }}</Badge>
                  </TableCell>
                  <TableCell>{{ user.total_tests }}</TableCell>
                  <TableCell class="text-right font-bold">{{ Math.round(user.best_wpm) }}</TableCell>
                </TableRow>
                <TableRow v-if="filteredLeaderboard.length === 0">
                  <TableCell colspan="5" class="text-center py-8">
                    <p :class="isDark ? 'text-neutral-500' : 'text-neutral-400'">Пользователи не найдены</p>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <!-- Mobile Cards -->
          <div class="md:hidden">
            <div
              v-for="(user, index) in filteredLeaderboard"
              :key="user.username"
              :class="[
                'flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b last:border-b-0',
                isDark ? 'border-neutral-800' : 'border-gray-100',
                index < 3 ? 'font-semibold' : '',
                isCurrentUser(user.username) && (isDark ? 'bg-blue-950/20' : 'bg-blue-50')
              ]"
            >
              <div class="flex items-center gap-2 sm:gap-3">
                <div class="w-7 sm:w-8 flex-shrink-0 flex items-center justify-center">
                  <Medal v-if="index < 3" :size="18" :class="getMedalColor(index)" />
                  <span v-else :class="['text-xs sm:text-sm', isDark ? 'text-neutral-400' : 'text-neutral-500']">{{ index + 1 }}</span>
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1">
                    <p :class="[
                      'text-xs sm:text-sm font-medium truncate',
                      isCurrentUser(user.username)
                        ? (isDark ? 'text-blue-400' : 'text-blue-600')
                        : (isDark ? 'text-white' : 'text-gray-900')
                    ]">
                      {{ user.username }}
                    </p>
                    <Badge v-if="isCurrentUser(user.username)" class="text-[10px] bg-blue-500 text-white px-1">Вы</Badge>
                  </div>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <Badge :class="['text-[10px] sm:text-xs', getRankBadgeColor(index)]">Ур. {{ user.level || 1 }}</Badge>
                    <span :class="['text-[10px] sm:text-xs', isDark ? 'text-neutral-500' : 'text-neutral-500']">{{ user.total_tests }} тестов</span>
                  </div>
                </div>
              </div>
              <div :class="['text-base sm:text-lg font-bold flex-shrink-0', isDark ? 'text-white' : 'text-gray-900']">
                {{ Math.round(user.best_wpm) }} <span class="text-[10px] sm:text-xs font-normal text-neutral-500">WPM</span>
              </div>
            </div>
            <div v-if="filteredLeaderboard.length === 0" class="text-center py-8">
              <p :class="isDark ? 'text-neutral-500' : 'text-neutral-400'">Пользователи не найдены</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  </div>
</template>
