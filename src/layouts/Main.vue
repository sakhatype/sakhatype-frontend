<template>
  <div
    :class="[
      // Вся страница тянется на всю высоту и плавно меняет цвета
      'min-h-screen flex flex-col transition-colors duration-300',
      isDark ? 'dark bg-[#0a0a0a] text-white' : 'bg-gray-50 text-gray-900',
    ]"
  >
    <header class="w-full px-8 py-5">
      <div class="mx-auto max-w-[980px]">
        <Header />
      </div>
    </header>

    <main class="flex-1 w-full flex flex-col items-center py-16">
      <div class="w-full mx-auto max-w-[980px]">
        <RouterView />
      </div>
    </main>

    <footer class="w-full px-8 py-5">
      <div class="mx-auto max-w-[980px]">
        <Footer />
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'

const { isDark } = useTheme()
</script>

<style scoped>
/* Tailwind сам справляется с цветами, кастомные стили не нужны */
</style>
