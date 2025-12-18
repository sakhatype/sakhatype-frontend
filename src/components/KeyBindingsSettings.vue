<template>
  <div class="key-bindings-settings">
    <div class="flex items-center justify-between mb-4">
      <h3 :class="['text-sm font-medium', isDark ? 'text-neutral-300' : 'text-neutral-700']">
        Настройки клавиш
      </h3>
      <button
        v-if="isModified"
        @click="resetToDefaults"
        :class="[
          'text-xs px-2 py-1 rounded transition-colors',
          isDark 
            ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' 
            : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
        ]"
      >
        Сбросить
      </button>
    </div>

    <div class="space-y-2">
      <div
        v-for="{ key, letter } in bindingsArray"
        :key="key"
        :class="[
          'flex items-center gap-3 p-2 rounded-lg transition-colors',
          isDark ? 'bg-neutral-900/50' : 'bg-neutral-50'
        ]"
      >
        <!-- Поле ввода клавиши -->
        <input
          :value="key"
          @keydown="handleKeyChange($event, key)"
          readonly
          :class="[
            'w-12 h-8 text-center rounded text-sm font-mono font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1',
            isDark 
              ? 'bg-neutral-800 text-neutral-300 border border-neutral-700 focus:ring-neutral-500 focus:ring-offset-neutral-900' 
              : 'bg-white text-neutral-700 border border-neutral-200 shadow-sm focus:ring-neutral-400 focus:ring-offset-white'
          ]"
          title="Нажмите и введите новую клавишу"
        />

        <span :class="['text-xs', isDark ? 'text-neutral-500' : 'text-neutral-400']">→</span>

        <!-- Выбор буквы -->
        <select
          :value="letter"
          @change="handleLetterChange(key, ($event.target as HTMLSelectElement).value)"
          :class="[
            'flex-1 px-3 py-1.5 rounded text-sm font-medium appearance-none cursor-pointer transition-colors',
            isDark 
              ? 'bg-neutral-800 text-white border border-neutral-700 hover:border-neutral-600' 
              : 'bg-white text-neutral-900 border border-neutral-200 hover:border-neutral-300 shadow-sm'
          ]"
        >
          <!-- Текущая буква всегда доступна -->
          <option :value="letter">{{ letter }}</option>
          <!-- Остальные доступные буквы -->
          <option 
            v-for="availableLetter in getAvailableLettersFor(key)" 
            :key="availableLetter" 
            :value="availableLetter"
          >
            {{ availableLetter }}
          </option>
        </select>

        <!-- Кнопка удаления -->
        <button
          @click="removeKeyBinding(key)"
          :class="[
            'w-8 h-8 flex items-center justify-center rounded transition-colors',
            isDark 
              ? 'text-neutral-500 hover:text-red-400 hover:bg-neutral-800' 
              : 'text-neutral-400 hover:text-red-500 hover:bg-neutral-100'
          ]"
          title="Удалить бинд"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Добавить новый бинд -->
    <div 
      v-if="availableLetters.length > 0"
      :class="[
        'mt-3 p-3 rounded-lg border-2 border-dashed transition-colors',
        isDark ? 'border-neutral-800' : 'border-neutral-200'
      ]"
    >
      <div class="flex items-center gap-2">
        <!-- Поле для ввода новой клавиши -->
        <input
          ref="newKeyInput"
          :value="newKey"
          @keydown="handleNewKeyInput"
          @focus="newKeyFocused = true"
          @blur="newKeyFocused = false"
          readonly
          :placeholder="newKeyFocused ? 'Нажмите...' : 'Клавиша'"
          :class="[
            'w-20 px-2 py-1.5 rounded text-sm font-mono text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1',
            isDark 
              ? 'bg-neutral-800 text-white border border-neutral-700 placeholder-neutral-500 focus:ring-neutral-500 focus:ring-offset-neutral-900' 
              : 'bg-white text-neutral-900 border border-neutral-200 placeholder-neutral-400 focus:ring-neutral-400 focus:ring-offset-white'
          ]"
        />

        <span :class="['text-xs', isDark ? 'text-neutral-500' : 'text-neutral-400']">→</span>

        <select
          v-model="newLetter"
          :class="[
            'flex-1 px-2 py-1.5 rounded text-sm appearance-none cursor-pointer',
            isDark 
              ? 'bg-neutral-800 text-white border border-neutral-700' 
              : 'bg-white text-neutral-900 border border-neutral-200'
          ]"
        >
          <option value="" disabled>Буква</option>
          <option v-for="letter in availableLetters" :key="letter" :value="letter">
            {{ letter }}
          </option>
        </select>

        <button
          @click="addBinding"
          :disabled="!newKey || !newLetter"
          :class="[
            'px-3 py-1.5 rounded text-sm font-medium transition-colors',
            newKey && newLetter
              ? isDark 
                ? 'bg-neutral-700 text-white hover:bg-neutral-600' 
                : 'bg-neutral-900 text-white hover:bg-neutral-800'
              : isDark
                ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
          ]"
        >
          Добавить
        </button>
      </div>
      
      <!-- Предупреждение о занятой клавише -->
      <p 
        v-if="keyConflict" 
        :class="['text-xs mt-2', isDark ? 'text-amber-400' : 'text-amber-600']"
      >
        Клавиша "{{ keyConflict }}" уже используется
      </p>
    </div>
    
    <!-- Сообщение если все буквы заняты -->
    <p 
      v-else 
      :class="['text-xs mt-3 text-center', isDark ? 'text-neutral-500' : 'text-neutral-400']"
    >
      Все буквы назначены
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useYakutKeyBindings, YAKUT_LETTERS } from '@/composables/useYakutKeyBindings'
import { useTheme } from '@/composables/useTheme'

const { isDark } = useTheme()
const { 
  bindingsArray, 
  isModified, 
  setKeyBinding, 
  removeKeyBinding, 
  resetToDefaults,
  yakutKeyMap,
  availableLetters,
  isLetterUsed
} = useYakutKeyBindings()

const newKey = ref('')
const newLetter = ref('')
const newKeyFocused = ref(false)
const newKeyInput = ref<HTMLInputElement | null>(null)
const keyConflict = ref('')

// Получить доступные буквы для конкретной клавиши (текущая + незанятые)
const getAvailableLettersFor = (currentKey: string) => {
  const currentLetter = yakutKeyMap.value[currentKey]
  return YAKUT_LETTERS.filter(letter => 
    letter !== currentLetter && !isLetterUsed(letter, currentKey)
  )
}

// Обработка изменения буквы
const handleLetterChange = (key: string, letter: string) => {
  setKeyBinding(key, letter)
}

// Обработка изменения клавиши (для существующего бинда)
const handleKeyChange = (event: KeyboardEvent, oldKey: string) => {
  event.preventDefault()
  
  // Игнорируем модификаторы и специальные клавиши
  if (['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'Escape', 'Enter', 'Backspace', 'Delete'].includes(event.key)) {
    return
  }
  
  const newKeyValue = event.key
  
  // Если клавиша не изменилась
  if (newKeyValue === oldKey) return
  
  // Проверяем, не занята ли уже эта клавиша
  if (yakutKeyMap.value[newKeyValue]) {
    return
  }
  
  // Получаем текущую букву
  const letter = yakutKeyMap.value[oldKey]
  if (!letter) return
  
  // Удаляем старый бинд и создаём новый
  removeKeyBinding(oldKey)
  setKeyBinding(newKeyValue, letter)
}

// Обработка ввода новой клавиши
const handleNewKeyInput = (event: KeyboardEvent) => {
  event.preventDefault()
  
  // Игнорируем модификаторы и специальные клавиши
  if (['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'Escape', 'Enter', 'Backspace', 'Delete'].includes(event.key)) {
    return
  }
  
  const key = event.key
  
  // Проверяем, не занята ли уже эта клавиша
  if (yakutKeyMap.value[key]) {
    keyConflict.value = key
    setTimeout(() => { keyConflict.value = '' }, 2000)
    return
  }
  
  newKey.value = key
  keyConflict.value = ''
}

// Добавление нового бинда
const addBinding = () => {
  if (newKey.value && newLetter.value) {
    const success = setKeyBinding(newKey.value, newLetter.value)
    if (success) {
      newKey.value = ''
      newLetter.value = ''
    }
  }
}
</script>

<style scoped>
select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

input[readonly] {
  cursor: pointer;
}
</style>