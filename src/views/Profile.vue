<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
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
import { Clock, CirclePlay, LogOut, Settings, CalendarDays } from 'lucide-vue-next'

const { isDark } = useTheme()

const isLogoutDialogOpen = ref(false)

const user = ref({
  username: 'createandchoose',
  level: 20,
  points: 65,
  maxPoints: 100,
  pointsToNextLevel: 45,
  nextLevelPrice: 21,
  registrationDate: '14 октября 2022',
  stats: {
    testsStarted: 3212,
    testsCompleted: 2734,
    totalTime: '42 ч 22м',
  },
})

const logout = () => {
  console.log('Logout confirmed')
  isLogoutDialogOpen.value = false
  // Здесь можно добавить редирект или очистку токенов
}

const openLogoutDialog = () => {
  isLogoutDialogOpen.value = true
}

const goToSettings = () => {
  console.log('Settings')
}
</script>

<template>
  <div>
    <!-- Header -->
    <header :class="[isDark ? 'border-gray-800' : 'border-gray-200']">
      <div class="container mx-auto py-4 flex items-center justify-between">
        <h1 :class="['text-3xl font-bold', isDark ? 'text-white' : 'text-gray-900']">Профиль</h1>
        <div class="flex items-center gap-3">
          <Button class="select-none cursor-pointer" variant="outline" @click="goToSettings">
            <Settings :size="20" /> Управление аккаунтом
          </Button>
          <Button class="select-none cursor-pointer" variant="outline" @click="openLogoutDialog">
            <LogOut :size="20" /> Выйти из аккаунта
          </Button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-1 py-1">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <!-- Profile Card -->
        <Card :class="['col-span-2 p-2', isDark ? '' : 'bg-white']">
          <CardContent class="p-2">
            <div class="flex items-stretch gap-4">
              <div
                class="w-28 h-28 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0"
              >
                <span class="text-white text-4xl font-bold">C</span>
              </div>

              <div class="flex flex-col justify-between flex-1">
                <!-- Верх -->
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <h2 :class="['text-2xl font-bold', isDark ? 'text-white' : 'text-gray-900']">
                      {{ user.username }}
                    </h2>
                    <Badge class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs">
                      Ур. {{ user.level }}
                    </Badge>
                  </div>

                  <!-- Центр -->
                  <div class="flex flex-col justify-center flex-1">
                    <p :class="['text-sm mb-1', isDark ? 'text-gray-400' : 'text-gray-600']">
                      Опыта
                    </p>
                    <Progress
                      :model-value="user.points"
                      :max="user.maxPoints"
                      :class="['h-2 w-full', isDark ? 'bg-gray-800' : 'bg-gray-200']"
                    />
                    <div class="flex items-center justify-between text-xs w-full mt-1">
                      <span :class="isDark ? 'text-gray-400' : 'text-gray-600'">
                        {{ user.points }} из {{ user.maxPoints }}
                      </span>
                      <div class="gap-1 flex items-center">
                        <span :class="isDark ? 'text-gray-400' : 'text-gray-600'"
                          >Еще {{ user.pointsToNextLevel }} до
                        </span>
                        <Badge
                          variant="secondary"
                          class="text-xs bg-purple-500 hover:bg-purple-600 text-white"
                        >
                          {{ user.nextLevelPrice }} Ур.
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Низ -->
                <div class="flex items-center gap-1">
                  <CalendarDays :size="16" :class="isDark ? 'text-gray-400' : 'text-gray-600'" />
                  <span :class="['text-xs', isDark ? 'text-gray-500' : 'text-gray-600']">
                    Дата регистрации: {{ user.registrationDate }}
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
                  <CirclePlay :size="20" :class="isDark ? 'text-gray-400' : 'text-gray-600'" />
                  <span :class="['text-sm', isDark ? 'text-gray-400' : 'text-gray-600']"
                    >Пройдено тестов</span
                  >
                </div>
                <span :class="['text-lg font-bold', isDark ? 'text-white' : 'text-gray-900']">
                  {{ user.stats.testsCompleted }}
                </span>
              </Alert>

              <Alert class="flex items-center justify-between gap-2 p-1 px-3 w-full">
                <div class="flex items-center gap-2">
                  <Clock :size="20" :class="isDark ? 'text-gray-400' : 'text-gray-600'" />
                  <span :class="['text-sm', isDark ? 'text-gray-400' : 'text-gray-600']"
                    >Тестов начато</span
                  >
                </div>
                <span :class="['text-lg font-bold', isDark ? 'text-white' : 'text-gray-900']">
                  {{ user.stats.testsStarted }}
                </span>
              </Alert>

              <Alert class="flex items-center justify-between gap-2 p-1 px-3 w-full">
                <div class="flex items-center gap-2">
                  <Clock :size="20" :class="isDark ? 'text-gray-400' : 'text-gray-600'" />
                  <span :class="['text-sm', isDark ? 'text-gray-400' : 'text-gray-600']"
                    >Общее время печати</span
                  >
                </div>
                <span :class="['text-lg font-bold', isDark ? 'text-white' : 'text-gray-900']">
                  {{ user.stats.totalTime }}
                </span>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Statistics Section -->
      <div class="mt-8">
        <h2 :class="['text-3xl font-bold mb-6', isDark ? 'text-white' : 'text-gray-900']">
          Статистика
        </h2>
        <Card :class="[isDark ? '' : 'bg-white']">
          <CardContent class="p-8">
            <p :class="['text-center py-12', isDark ? 'text-gray-500' : 'text-gray-400']">
              Здесь будет статистика
            </p>
          </CardContent>
        </Card>
      </div>
    </main>

    <!-- Logout Dialog -->
    <AlertDialog :open="isLogoutDialogOpen" @update:open="isLogoutDialogOpen = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Вы уверены, что хотите выйти?</AlertDialogTitle>
          <AlertDialogDescription>
            После выхода вам потребуется снова войти в аккаунт для доступа к своему профилю и
            статистике.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction @click="logout">Выйти</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
