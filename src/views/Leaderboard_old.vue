<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { apiService } from '@/services/api'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Zap, Target, Medal } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

const { isDark } = useTheme()

const isLoading = ref(true)
const wpmLeaderboard = ref<any[]>([])
const accuracyLeaderboard = ref<any[]>([])
const activeTab = ref('wpm')

onMounted(async () => {
  try {
    isLoading.value = true
    const [wpmData, accuracyData] = await Promise.all([
      apiService.getLeaderboardWpm(100),
      apiService.getLeaderboardAccuracy(100)
    ])
    wpmLeaderboard.value = wpmData
    accuracyLeaderboard.value = accuracyData
  } catch (error) {
    console.error('Failed to load leaderboard:', error)
  } finally {
    isLoading.value = false
  }
})

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
  return 'bg-gray-500 text-white'
}
</script>

<template>
  <div>
    <!-- Header -->
    <header :class="[isDark ? 'border-gray-800' : 'border-gray-200']">
      <div class="container mx-auto py-6 flex items-center gap-3">
        <Trophy :size="32" :class="isDark ? 'text-yellow-500' : 'text-yellow-600'" />
        <h1 :class="['text-4xl font-bold', isDark ? 'text-white' : 'text-gray-900']">
          Лидерборд
        </h1>
      </div>
    </header>

    <!-- Loading state -->
    <div v-if="isLoading" class="container mx-auto px-4 py-12 text-center">
      <p :class="['text-lg', isDark ? 'text-neutral-400' : 'text-neutral-600']">Загрузка...</p>
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

        <!-- WPM Leaderboard -->
        <TabsContent value="wpm">
          <Card :class="[isDark ? '' : 'bg-white']">
            <CardContent class="p-0">
              <div class="divide-y" :class="isDark ? 'divide-gray-800' : 'divide-gray-200'">
                <div
                  v-for="(user, index) in wpmLeaderboard"
                  :key="user.username"
                  :class="[
                    'flex items-center justify-between p-4 hover:bg-opacity-50 transition-colors',
                    isDark ? 'hover:bg-neutral-900' : 'hover:bg-gray-50',
                    index < 3 && 'font-semibold'
                  ]"
                >
                  <div class="flex items-center gap-4 flex-1">
                    <!-- Rank -->
                    <div class="flex items-center justify-center w-12">
                      <Medal v-if="index < 3" :size="24" :class="getMedalColor(index)" />
                      <span v-else :class="['text-lg font-bold', isDark ? 'text-neutral-400' : 'text-neutral-500']">
                        {{ index + 1 }}
                      </span>
                    </div>

                    <!-- User info -->
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <p :class="['text-lg', isDark ? 'text-white' : 'text-gray-900']">
                          {{ user.username }}
                        </p>
                        <Badge :class="['text-xs', getRankBadgeColor(index)]">
                          Уровень {{ user.level }}
                        </Badge>
                      </div>
                      <p :class="['text-sm', isDark ? 'text-neutral-400' : 'text-neutral-600']">
                        {{ user.total_tests }} тест бүтэрбитэ
                      </p>
                    </div>

                    <!-- WPM Score -->
                    <div class="text-right">
                      <p :class="['text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900']">
                        {{ Math.round(user.best_wpm) }}
                      </p>
                      <p :class="['text-sm', isDark ? 'text-neutral-400' : 'text-neutral-600']">
                        WPM
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Empty state -->
                <div
                  v-if="wpmLeaderboard.length === 0"
                  class="p-12 text-center"
                  :class="isDark ? 'text-neutral-500' : 'text-neutral-400'"
                >
                  <p>Бу диэки лидерлэр суох</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Accuracy Leaderboard -->
        <TabsContent value="accuracy">
          <Card :class="[isDark ? '' : 'bg-white']">
            <CardContent class="p-0">
              <div class="divide-y" :class="isDark ? 'divide-gray-800' : 'divide-gray-200'">
                <div
                  v-for="(user, index) in accuracyLeaderboard"
                  :key="user.username"
                  :class="[
                    'flex items-center justify-between p-4 hover:bg-opacity-50 transition-colors',
                    isDark ? 'hover:bg-neutral-900' : 'hover:bg-gray-50',
                    index < 3 && 'font-semibold'
                  ]"
                >
                  <div class="flex items-center gap-4 flex-1">
                    <!-- Rank -->
                    <div class="flex items-center justify-center w-12">
                      <Medal v-if="index < 3" :size="24" :class="getMedalColor(index)" />
                      <span v-else :class="['text-lg font-bold', isDark ? 'text-neutral-400' : 'text-neutral-500']">
                        {{ index + 1 }}
                      </span>
                    </div>

                    <!-- User info -->
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <p :class="['text-lg', isDark ? 'text-white' : 'text-gray-900']">
                          {{ user.username }}
                        </p>
                        <Badge :class="['text-xs', getRankBadgeColor(index)]">
                          Уровень {{ user.level }}
                        </Badge>
                      </div>
                      <p :class="['text-sm', isDark ? 'text-neutral-400' : 'text-neutral-600']">
                        {{ user.total_tests }} тест бүтэрбитэ
                      </p>
                    </div>

                    <!-- Accuracy Score -->
                    <div class="text-right">
                      <p :class="['text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900']">
                        {{ Math.round(user.best_accuracy) }}%
                      </p>
                      <p :class="['text-sm', isDark ? 'text-neutral-400' : 'text-neutral-600']">
                        Сөпкэ
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Empty state -->
                <div
                  v-if="accuracyLeaderboard.length === 0"
                  class="p-12 text-center"
                  :class="isDark ? 'text-neutral-500' : 'text-neutral-400'"
                >
                  <p>Бу диэки лидерлэр суох</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  </div>
</template>
