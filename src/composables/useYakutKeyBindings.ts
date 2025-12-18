import { ref, watch, computed } from 'vue'

// Дефолтные бинды
const DEFAULT_YAKUT_KEY_MAP: Record<string, string> = {
  '4': 'ҥ',
  '5': 'ҕ',
  '6': 'ө',
  '7': 'һ',
  '8': 'ү',
}

// Доступные якутские буквы для выбора
export const YAKUT_LETTERS = ['ҥ', 'ҕ', 'ө', 'һ', 'ү', 'дь', 'нь'] as const

const STORAGE_KEY = 'sakhatype-key-bindings'

// Загрузка из localStorage
function loadFromStorage(): Record<string, string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Валидация структуры
      if (typeof parsed === 'object' && parsed !== null) {
        return { ...DEFAULT_YAKUT_KEY_MAP, ...parsed }
      }
    }
  } catch (e) {
    console.warn('Не удалось загрузить настройки клавиш:', e)
  }
  return { ...DEFAULT_YAKUT_KEY_MAP }
}

// Сохранение в localStorage
function saveToStorage(keyMap: Record<string, string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keyMap))
  } catch (e) {
    console.warn('Не удалось сохранить настройки клавиш:', e)
  }
}

// Реактивное состояние (singleton)
const yakutKeyMap = ref<Record<string, string>>(loadFromStorage())

// Следим за изменениями и сохраняем
watch(
  yakutKeyMap,
  (newValue) => {
    saveToStorage(newValue)
  },
  { deep: true }
)

export function useYakutKeyBindings() {
  // Получить все используемые буквы
  const usedLetters = computed(() => {
    return new Set(Object.values(yakutKeyMap.value))
  })

  // Получить доступные буквы (не занятые)
  const availableLetters = computed(() => {
    return YAKUT_LETTERS.filter(letter => !usedLetters.value.has(letter))
  })

  // Проверить, используется ли буква
  const isLetterUsed = (letter: string, excludeKey?: string): boolean => {
    return Object.entries(yakutKeyMap.value).some(
      ([key, l]) => l === letter && key !== excludeKey
    )
  }

  // Установить бинд для клавиши (с проверкой на дубликат буквы)
  const setKeyBinding = (key: string, letter: string, force = false): boolean => {
    // Проверяем, не занята ли уже эта буква другой клавишей
    if (!force && isLetterUsed(letter, key)) {
      return false
    }
    
    yakutKeyMap.value = {
      ...yakutKeyMap.value,
      [key]: letter,
    }
    return true
  }

  // Удалить бинд для клавиши
  const removeKeyBinding = (key: string) => {
    const newMap = { ...yakutKeyMap.value }
    delete newMap[key]
    yakutKeyMap.value = newMap
  }

  // Сбросить к дефолтным настройкам
  const resetToDefaults = () => {
    yakutKeyMap.value = { ...DEFAULT_YAKUT_KEY_MAP }
  }

  // Получить букву для клавиши
  const getLetterForKey = (key: string): string | undefined => {
    return yakutKeyMap.value[key]
  }

  // Получить клавишу для буквы (обратный поиск)
  const getKeyForLetter = (letter: string): string | undefined => {
    return Object.entries(yakutKeyMap.value).find(([_, l]) => l === letter)?.[0]
  }

  // Проверить, есть ли бинд для клавиши
  const hasBinding = (key: string): boolean => {
    return key in yakutKeyMap.value
  }

  // Получить все активные бинды как массив для отображения
  const bindingsArray = computed(() => {
    return Object.entries(yakutKeyMap.value)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([key, letter]) => ({ key, letter }))
  })

  // Проверить, отличаются ли текущие настройки от дефолтных
  const isModified = computed(() => {
    const defaultKeys = Object.keys(DEFAULT_YAKUT_KEY_MAP)
    const currentKeys = Object.keys(yakutKeyMap.value)
    
    if (defaultKeys.length !== currentKeys.length) return true
    
    return defaultKeys.some(
      key => yakutKeyMap.value[key] !== DEFAULT_YAKUT_KEY_MAP[key]
    )
  })

  return {
    // Реактивные данные
    yakutKeyMap,
    bindingsArray,
    isModified,
    usedLetters,
    availableLetters,
    
    // Методы
    setKeyBinding,
    removeKeyBinding,
    resetToDefaults,
    getLetterForKey,
    getKeyForLetter,
    hasBinding,
    isLetterUsed,
    
    // Константы
    DEFAULT_YAKUT_KEY_MAP,
    YAKUT_LETTERS,
  }
}