import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', () => {
  // Получаем значение темы из localStorage
  const storedTheme = localStorage.getItem('theme')
  // Если в localStorage нет значения, по умолчанию ставим true (темная)
  const isDark = ref<boolean>(storedTheme ? storedTheme === 'dark' : true)

  // Функция для переключения темы
  function toggleDark() {
    isDark.value = !isDark.value
    // Сохраняем текущее состояние темы в localStorage
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  return { isDark, toggleDark }
})
