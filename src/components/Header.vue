<script setup lang="ts">
import { Trophy } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import LoginDialog from './LoginDialog.vue'

const { isDark } = useTheme()
</script>

<template>
  <header class="py-5 flex items-center justify-between">
    <div class="flex items-center gap-8">
      <!-- Главная через router-link -->
      <router-link to="/" class="flex items-center gap-3 select-none cursor-pointer">
        <span class="text-2xl font-bold tracking-tight">Sakhatype</span>
      </router-link>

      <!-- Лидерборд -->
      <router-link
        to="/leaderboard"
        :class="[
          'flex items-center gap-2 transition-colors text-sm select-none cursor-pointer',
          isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900',
        ]"
      >
        <Trophy :size="16" />
        <span>Лидерборд</span>
      </router-link>

      <router-link
        to="/profile"
        :class="[
          'flex items-center gap-2 transition-colors text-sm select-none cursor-pointer',
          isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900',
        ]"
      >
        <span>(профиль тест фронт)</span>
      </router-link>
    </div>

    <!-- Логин -->
    <LoginDialog />
  </header>
</template>
