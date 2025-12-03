import { ref, watch } from 'vue'

const isDark = ref(loadInitialTheme())

function loadInitialTheme() {
  // 1️⃣ Проверяем сохранённое значение
  const saved = localStorage.getItem('theme')
  if (saved === 'dark') return true
  if (saved === 'light') return false

  // 2️⃣ Если не сохранено — смотрим системные настройки
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(dark: boolean) {
  const html = document.documentElement
  if (dark) {
    html.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    html.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

// 3️⃣ Реактивно отслеживаем изменения
watch(
  isDark,
  (newVal) => {
    applyTheme(newVal)
  },
  { immediate: true },
)

export function useTheme() {
  const toggleDark = () => {
    isDark.value = !isDark.value
  }

  return { isDark, toggleDark }
}
