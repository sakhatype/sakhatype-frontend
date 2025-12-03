<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { leaderboardApi, type LeaderboardEntry } from '@/shared/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Trophy, Zap, Target, Medal, Search, ArrowUp, ArrowDown } from 'lucide-vue-next'

const { isDark } = useTheme()

const isLoading = ref(true)
const wpmLeaderboard = ref<LeaderboardEntry[]>([])
const accuracyLeaderboard = ref<LeaderboardEntry[]>([])
const activeTab = ref('wpm')
const searchQuery = ref('')
const sortColumn = ref<'username' | 'wpm' | 'accuracy' | 'level' | 'total_tests'>('wpm')
const sortDirection = ref<'asc' | 'desc'>('desc')

onMounted(async () => {
  try {
    isLoading.value = true
    const [wpmData, accuracyData] = await Promise.all([
      leaderboardApi.getLeaderboardWpm(100),
      leaderboardApi.getLeaderboardAccuracy(100)
    ])
    wpmLeaderboard.value = wpmData
    accuracyLeaderboard.value = accuracyData
  } catch (error) {
    console.error('Failed to load leaderboard:', error)
  } finally {
    isLoading.value = false
  }
})

const filteredWpmLeaderboard = computed(() => {
  let filtered = wpmLeaderboard.value.filter(user =>
    user.username.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
  
  return sortLeaderboard(filtered, 'wpm')
})

const filteredAccuracyLeaderboard = computed(() => {
  let filtered = accuracyLeaderboard.value.filter(user =>
    user.username.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
  
  return sortLeaderboard(filtered, 'accuracy')
})

function sortLeaderboard(data: LeaderboardEntry[], defaultSort: 'wpm' | 'accuracy') {
  const sorted = [...data]
  
  sorted.sort((a, b) => {
    let aVal, bVal
    
    switch (sortColumn.value) {
      case 'username':
        aVal = a.username
        bVal = b.username
        break
      case 'wpm':
        aVal = a.best_wpm
        bVal = b.best_wpm
        break
      case 'accuracy':
        aVal = a.best_accuracy
        bVal = b.best_accuracy
        break
      case 'level':
        aVal = a.level
        bVal = b.level
        break
      case 'total_tests':
        aVal = a.total_tests
        bVal = b.total_tests
        break
      default:
        aVal = defaultSort === 'wpm' ? a.best_wpm : a.best_accuracy
        bVal = defaultSort === 'wpm' ? b.best_wpm : b.best_accuracy
    }
    
    if (typeof aVal === 'string') {
      return sortDirection.value === 'asc' 
        ? aVal.localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal)
    }
    
    return sortDirection.value === 'asc' ? aVal - bVal : bVal - aVal
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
  if (index === 1) return 'text-gray-400'
  if (index === 2) return 'text-orange-600'
  return 'text-gray-500'
}

const getRankBadgeColor = (index: number) => {
  if (index === 0) return 'bg-yellow-500 text-white'
  if (index === 1) return 'bg-gray-400 text-white'
  if (index === 2) return 'bg-orange-600 text-white'
  return ''
}
</script>

<template>
  <div>
    <!-- Header -->
    <header :class="[isDark ? 'border-gray-800' : 'border-gray-200']">
      <div class="container mx-auto py-6 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Trophy :size="32" :class="isDark ? 'text-yellow-500' : 'text-yellow-600'" />
          <h1 :class="['text-4xl font-bold', isDark ? 'text-white' : 'text-gray-900']">
            Лидерборд
          </h1>
        </div>
      </div>
    </header>

    <!-- Loading state -->
    <div v-if="isLoading" class="container mx-auto px-4 py-12 text-center">
      <p :class="['text-lg', isDark ? 'text-gray-400' : 'text-neutral-600']">Күүтүү...</p>
    </div>

    <!-- Leaderboard Content -->
    <main v-else class="container mx-auto px-4 py-6">
      <Tabs v-model="activeTab" default-value="wpm" class="w-full">
        <TabsList class="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
          <TabsTrigger value="wpm" class="flex items-center gap-2">
            <Zap :size="16" />
            <span>Хамсааһын (WPM)</span>
          </TabsTrigger>
          <TabsTrigger value="accuracy" class="flex items-center gap-2">
            <Target :size="16" />
            <span>Сөпкэ (Точность)</span>
          </TabsTrigger>
        </TabsList>

        <!-- Search -->
        <div class="mb-4 flex items-center gap-2 max-w-md mx-auto">
          <Search :size="20" :class="isDark ? 'text-gray-400' : 'text-neutral-600'" />
          <Input
            v-model="searchQuery"
            placeholder="Поиск по имени..."
            class="flex-1"
          />
        </div>

        <!-- WPM Leaderboard -->
        <TabsContent value="wpm">
          <Card :class="[isDark ? '' : 'bg-white']">
            <CardContent class="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="w-16">Ранг</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        @click="toggleSort('username')"
                        class="flex items-center gap-1"
                      >
                        Имя
                        <component
                          :is="sortDirection === 'asc' ? ArrowUp : ArrowDown"
                          v-if="sortColumn === 'username'"
                          :size="14"
                        />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        @click="toggleSort('level')"
                        class="flex items-center gap-1"
                      >
                        Уровень
                        <component
                          :is="sortDirection === 'asc' ? ArrowUp : ArrowDown"
                          v-if="sortColumn === 'level'"
                          :size="14"
                        />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        @click="toggleSort('total_tests')"
                        class="flex items-center gap-1"
                      >
                        Тесты
                        <component
                          :is="sortDirection === 'asc' ? ArrowUp : ArrowDown"
                          v-if="sortColumn === 'total_tests'"
                          :size="14"
                        />
                      </Button>
                    </TableHead>
                    <TableHead class="text-right">
                      <Button
                        variant="ghost"
                        @click="toggleSort('wpm')"
                        class="flex items-center gap-1 ml-auto"
                      >
                        WPM
                        <component
                          :is="sortDirection === 'asc' ? ArrowUp : ArrowDown"
                          v-if="sortColumn === 'wpm'"
                          :size="14"
                        />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    v-for="(user, index) in filteredWpmLeaderboard"
                    :key="user.username"
                    :class="[index < 3 && 'font-semibold']"
                  >
                    <TableCell class="font-medium">
                      <Medal v-if="index < 3" :size="20" :class="getMedalColor(index)" />
                      <span v-else>{{ index + 1 }}</span>
                    </TableCell>
                    <TableCell>{{ user.username }}</TableCell>
                    <TableCell>
                      <Badge :class="getRankBadgeColor(index)">
                        Уровень {{ user.level }}
                      </Badge>
                    </TableCell>
                    <TableCell>{{ user.total_tests }}</TableCell>
                    <TableCell class="text-right font-bold">
                      {{ Math.round(user.best_wpm) }}
                    </TableCell>
                  </TableRow>
                  
                  <!-- Empty state -->
                  <TableRow v-if="filteredWpmLeaderboard.length === 0">
                    <TableCell colspan="5" class="text-center py-8">
                      <p :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                        Пользователи не найдены
                      </p>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Accuracy Leaderboard -->
        <TabsContent value="accuracy">
          <Card :class="[isDark ? '' : 'bg-white']">
            <CardContent class="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="w-16">Ранг</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        @click="toggleSort('username')"
                        class="flex items-center gap-1"
                      >
                        Имя
                        <component
                          :is="sortDirection === 'asc' ? ArrowUp : ArrowDown"
                          v-if="sortColumn === 'username'"
                          :size="14"
                        />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        @click="toggleSort('level')"
                        class="flex items-center gap-1"
                      >
                        Уровень
                        <component
                          :is="sortDirection === 'asc' ? ArrowUp : ArrowDown"
                          v-if="sortColumn === 'level'"
                          :size="14"
                        />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        @click="toggleSort('total_tests')"
                        class="flex items-center gap-1"
                      >
                        Тесты
                        <component
                          :is="sortDirection === 'asc' ? ArrowUp : ArrowDown"
                          v-if="sortColumn === 'total_tests'"
                          :size="14"
                        />
                      </Button>
                    </TableHead>
                    <TableHead class="text-right">
                      <Button
                        variant="ghost"
                        @click="toggleSort('accuracy')"
                        class="flex items-center gap-1 ml-auto"
                      >
                        Точность
                        <component
                          :is="sortDirection === 'asc' ? ArrowUp : ArrowDown"
                          v-if="sortColumn === 'accuracy'"
                          :size="14"
                        />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow
                    v-for="(user, index) in filteredAccuracyLeaderboard"
                    :key="user.username"
                    :class="[index < 3 && 'font-semibold']"
                  >
                    <TableCell class="font-medium">
                      <Medal v-if="index < 3" :size="20" :class="getMedalColor(index)" />
                      <span v-else>{{ index + 1 }}</span>
                    </TableCell>
                    <TableCell>{{ user.username }}</TableCell>
                    <TableCell>
                      <Badge :class="getRankBadgeColor(index)">
                        Уровень {{ user.level }}
                      </Badge>
                    </TableCell>
                    <TableCell>{{ user.total_tests }}</TableCell>
                    <TableCell class="text-right font-bold">
                      {{ Math.round(user.best_accuracy) }}%
                    </TableCell>
                  </TableRow>
                  
                  <!-- Empty state -->
                  <TableRow v-if="filteredAccuracyLeaderboard.length === 0">
                    <TableCell colspan="5" class="text-center py-8">
                      <p :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                        Пользователи не найдены
                      </p>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  </div>
</template>
