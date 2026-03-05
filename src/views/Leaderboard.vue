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
import { Trophy, Medal, Search, ArrowUp, ArrowDown } from 'lucide-vue-next'

const { isDark } = useTheme()
const authStore = useAuthStore()

interface Entry {
  username: string
  best_wpm: number
  total_tests: number
  level?: number
}

const isLoading = ref(true)
const data = ref<Entry[]>([])
const searchQuery = ref('')
const sortCol = ref<'username' | 'wpm' | 'total_tests'>('wpm')
const sortDir = ref<'asc' | 'desc'>('desc')

// Фильтры — точно совпадают с бэкенд enum
const selectedDifficulty = ref<'normal' | 'high'>('normal')
const selectedTimeMode = ref<number>(30)

const timeOptions = [15, 30, 60, 120]

async function load() {
  isLoading.value = true
  try {
    // GET /api/leaderboard/{difficulty}/{time_mode}
    data.value = await apiService.getLeaderboard(selectedDifficulty.value, selectedTimeMode.value, 100)
  } catch (e) {
    console.error('Leaderboard load error:', e)
    data.value = []
  } finally {
    isLoading.value = false
  }
}

watch([selectedDifficulty, selectedTimeMode], () => load())
onMounted(() => load())

const filtered = computed(() => {
  let list = data.value.filter(u => u.username.toLowerCase().includes(searchQuery.value.toLowerCase()))
  list = [...list].sort((a, b) => {
    let av: any, bv: any
    if (sortCol.value === 'username') { av = a.username; bv = b.username }
    else if (sortCol.value === 'wpm') { av = a.best_wpm; bv = b.best_wpm }
    else { av = a.total_tests; bv = b.total_tests }
    if (typeof av === 'string') return sortDir.value === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    return sortDir.value === 'asc' ? av - bv : bv - av
  })
  return list
})

function toggleSort(col: typeof sortCol.value) {
  if (sortCol.value === col) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortCol.value = col; sortDir.value = 'desc' }
}

const medal = (i: number) => i === 0 ? 'text-yellow-500' : i === 1 ? 'text-neutral-400' : i === 2 ? 'text-orange-600' : 'text-neutral-500'
const rankBadge = (i: number) => i === 0 ? 'bg-yellow-500 text-white' : i === 1 ? 'bg-neutral-900 text-white' : i === 2 ? 'bg-orange-600 text-white' : ''
const isMe = (u: string) => authStore.isAuthenticated && authStore.username === u

const itemCls = computed(() => [
  'px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all select-none cursor-pointer',
  isDark.value
    ? 'data-[state=on]:bg-[#2a2a2a] data-[state=on]:text-white text-neutral-500 hover:bg-[#1a1a1a]'
    : 'data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 text-neutral-500 hover:bg-gray-100',
])
</script>

<template>
  <div>
    <!-- Title -->
    <div class="py-3 sm:py-4 md:py-6 flex items-center gap-3">
      <Trophy :size="22" class="sm:w-7 sm:h-7" :class="isDark ? 'text-yellow-500' : 'text-yellow-600'" />
      <h1 :class="['text-xl sm:text-2xl md:text-4xl font-bold', isDark ? 'text-white' : 'text-gray-900']">Лидерборд</h1>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row items-center justify-center gap-2 mb-4">
      <!-- Difficulty -->
      <Alert class="flex items-center gap-1 p-1 px-2 sm:px-3">
        <ToggleGroup type="single" :model-value="selectedDifficulty"
                     @update:model-value="(v: string) => { if (v) selectedDifficulty = v as any }" class="flex gap-1">
          <ToggleGroupItem value="normal" :class="itemCls">Обычная</ToggleGroupItem>
          <ToggleGroupItem value="high" :class="itemCls">Якутская</ToggleGroupItem>
        </ToggleGroup>
      </Alert>

      <!-- Time mode -->
      <Alert class="flex items-center gap-1 p-1 px-2 sm:px-3">
        <ToggleGroup type="single" :model-value="String(selectedTimeMode)"
                     @update:model-value="(v: string) => { if (v) selectedTimeMode = Number(v) }" class="flex gap-1">
          <ToggleGroupItem v-for="t in timeOptions" :key="t" :value="String(t)" :class="itemCls">{{ t }}с</ToggleGroupItem>
        </ToggleGroup>
      </Alert>
    </div>

    <!-- Search -->
    <div class="mb-4 flex items-center gap-2 max-w-md mx-auto">
      <Search :size="16" :class="isDark ? 'text-neutral-400' : 'text-neutral-600'" class="flex-shrink-0" />
      <Input v-model="searchQuery" placeholder="Поиск..." class="flex-1 text-sm" />
    </div>

    <!-- Skeleton -->
    <div v-if="isLoading" class="space-y-2">
      <div v-for="i in 8" :key="i" :class="['h-12 rounded-lg animate-pulse', isDark ? 'bg-neutral-800' : 'bg-gray-200']" />
    </div>

    <!-- Table -->
    <Card v-else :class="[isDark ? '' : 'bg-white']">
      <CardContent class="p-0">
        <!-- Desktop -->
        <div class="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-14">Ранг</TableHead>
                <TableHead>
                  <Button variant="ghost" @click="toggleSort('username')" class="flex items-center gap-1 text-xs sm:text-sm">
                    Имя <component :is="sortDir === 'asc' ? ArrowUp : ArrowDown" v-if="sortCol === 'username'" :size="14" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" @click="toggleSort('total_tests')" class="flex items-center gap-1 text-xs sm:text-sm">
                    Тесты <component :is="sortDir === 'asc' ? ArrowUp : ArrowDown" v-if="sortCol === 'total_tests'" :size="14" />
                  </Button>
                </TableHead>
                <TableHead class="text-right">
                  <Button variant="ghost" @click="toggleSort('wpm')" class="flex items-center gap-1 ml-auto text-xs sm:text-sm">
                    WPM <component :is="sortDir === 'asc' ? ArrowUp : ArrowDown" v-if="sortCol === 'wpm'" :size="14" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="(u, i) in filtered" :key="u.username"
                        :class="[i < 3 && 'font-semibold', isMe(u.username) && (isDark ? 'bg-blue-950/20' : 'bg-blue-50')]">
                <TableCell class="font-medium">
                  <Medal v-if="i < 3" :size="20" :class="medal(i)" /><span v-else>{{ i + 1 }}</span>
                </TableCell>
                <TableCell>
                  <span :class="isMe(u.username) ? (isDark ? 'text-blue-400' : 'text-blue-600') : ''">{{ u.username }}</span>
                  <Badge v-if="isMe(u.username)" class="ml-2 text-xs bg-blue-500 text-white">Вы</Badge>
                </TableCell>
                <TableCell>{{ u.total_tests }}</TableCell>
                <TableCell class="text-right font-bold">{{ Math.round(u.best_wpm) }}</TableCell>
              </TableRow>
              <TableRow v-if="filtered.length === 0">
                <TableCell colspan="4" class="text-center py-8">
                  <p :class="isDark ? 'text-neutral-500' : 'text-neutral-400'">Пусто</p>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Mobile -->
        <div class="md:hidden">
          <div v-for="(u, i) in filtered" :key="u.username"
               :class="['flex items-center justify-between px-3 py-2.5 border-b last:border-b-0',
                         isDark ? 'border-neutral-800' : 'border-gray-100',
                         i < 3 ? 'font-semibold' : '',
                         isMe(u.username) && (isDark ? 'bg-blue-950/20' : 'bg-blue-50')]">
            <div class="flex items-center gap-2">
              <div class="w-7 flex-shrink-0 flex items-center justify-center">
                <Medal v-if="i < 3" :size="18" :class="medal(i)" />
                <span v-else :class="['text-xs', isDark ? 'text-neutral-400' : 'text-neutral-500']">{{ i + 1 }}</span>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-1">
                  <p :class="['text-xs sm:text-sm font-medium truncate', isMe(u.username) ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-white' : 'text-gray-900')]">{{ u.username }}</p>
                  <Badge v-if="isMe(u.username)" class="text-[10px] bg-blue-500 text-white px-1">Вы</Badge>
                </div>
                <span :class="['text-[10px]', isDark ? 'text-neutral-500' : 'text-neutral-500']">{{ u.total_tests }} тестов</span>
              </div>
            </div>
            <div :class="['text-base font-bold flex-shrink-0', isDark ? 'text-white' : 'text-gray-900']">
              {{ Math.round(u.best_wpm) }} <span class="text-[10px] font-normal text-neutral-500">WPM</span>
            </div>
          </div>
          <div v-if="filtered.length === 0" class="text-center py-8">
            <p :class="isDark ? 'text-neutral-500' : 'text-neutral-400'">Пусто</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
