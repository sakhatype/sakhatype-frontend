<template>
  <header class="py-5 flex items-center justify-between">
    <div class="flex items-center gap-8">
      <a href="/" class="flex items-center gap-3">
        <span class="text-2xl font-bold tracking-tight">Sakhatype</span>
      </a>
      <button
        :class="[
          'flex items-center gap-2 transition-colors text-sm',
          isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900',
        ]"
      >
        <Trophy :size="16" />
        <span>Лидерборд</span>
      </button>
    </div>
    <!-- <button
      :class="[
        'flex items-center gap-2 transition-colors text-sm',
        isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900',
      ]"
    >
      <User :size="16" />
      <span>Войти</span>
    </button> -->
    <Button variant="outline"> <User :size="16" /><span>Войти</span> </Button>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
// 1. Импорт Composable для общего состояния
import { useTheme } from '@/composables/useTheme'
const { isDark } = useTheme() // Получаем только isDark

// 2. Импорт локальных компонентов и иконок
import { Trophy, User } from 'lucide-vue-next'
</script>
