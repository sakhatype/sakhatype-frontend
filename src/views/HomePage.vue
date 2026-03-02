<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { RotateCcw } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import { useSound } from '@/shared/composables/useSound'
import { useControlStore } from '@/stores/control'
import { useTypingStore } from '@/stores/typingStore.ts'
import { useYakutKeyBindings } from '@/composables/useYakutKeyBindings'
import Control from '@/components/Control.vue'
import ResultsView from '@/components/ResultsView.vue'
import Kbd from '@/components/Kbd.vue'

const { isDark } = useTheme()
const { playKeypress, playCorrect, playIncorrect } = useSound()
const control = useControlStore()
const store = useTypingStore()

// Используем composable для биндов клавиш
const { yakutKeyMap, getLetterForKey } = useYakutKeyBindings()

const selectedTime = ref(control.selectedTime)
const displayTime = ref(control.selectedTime)
const isAnimating = ref(false)
const hiddenInput = ref<HTMLInputElement | null>(null)
const inputValue = ref('')
const hasFocus = ref(false)
const showResults = ref(false)
const currentLineIndex = ref(0)
const textDisplayRef = ref<HTMLDivElement | null>(null)
const lineOffset = ref(0)

// Функция анимации чисел как в GTA
const animateNumber = (from: number, to: number) => {
  if (from === to) return
  isAnimating.value = true
  const duration = 200
  const steps = 30
  const increment = (to - from) / steps
  let current = from
  let step = 0
  const timer = setInterval(() => {
    step++
    current += increment
    if (step >= steps) {
      displayTime.value = to
      isAnimating.value = false
      clearInterval(timer)
    } else {
      displayTime.value = Math.round(current)
    }
  }, duration / steps)
}

// 🧩 следим за изменениями store → родитель с анимацией
watch(
  () => control.selectedTime,
  (newVal, oldVal) => {
    if (newVal !== undefined && oldVal !== undefined) {
      selectedTime.value = newVal
      animateNumber(oldVal, newVal)
      setTime(newVal)
    }
  },
)

// 🔁 следим за изменениями родителя → store
watch(selectedTime, (val) => {
  if (val !== undefined) {
    control.setTime(val)
  }
})

// Отображаемое время (таймер или выбранное)
const timeDisplay = computed(() => {
  return store.isTestActive ? store.timeLeft : displayTime.value
})

const setTime = (time: number) => {
  store.setTime(time)
  restartTest()
}

const restartTest = async () => {
  showResults.value = false
  lineOffset.value = 0
  inputValue.value = ''
  await store.initTest()
}

const focusInput = () => {
  hiddenInput.value?.focus()
  hasFocus.value = true
}

const handleFocus = () => {
  hasFocus.value = true
}

const handleBlur = () => {
  hasFocus.value = false
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!store.isTestActive && !store.isEnding) {
    store.startTimer()
    if (!hasFocus.value) {
      hasFocus.value = true
    }
  }

  const prevWordIndex = store.currentWordIndex
  const prevInputLength = store.inputValue.length
  const newInput = target.value
  
  // Определяем, был ли добавлен символ
  if (newInput.length > prevInputLength) {
    playKeypress()
    
    // Проверяем правильность последнего введенного символа
    const lastChar = newInput[newInput.length - 1]
    const currentWord = store.words[store.currentWordIndex]
    
    if (currentWord) {
      const expectedChar = currentWord[newInput.length - 1]
      
      if (lastChar === expectedChar) {
        playCorrect()
      } else {
        playIncorrect()
      }
    }
  }
  
  store.processInput(target.value)
  inputValue.value = store.inputValue

  // Проверяем, перешли ли мы на новое слово
  if (store.currentWordIndex > prevWordIndex) {
    updateLineOffset()
  }
}

const updateLineOffset = () => {
  // Получаем все слова до текущего
  const wordsBeforeCurrent = store.words.slice(0, store.currentWordIndex + 1).join(' ')

  // Создаём временный элемент для измерения
  const tempDiv = document.createElement('div')
  tempDiv.style.cssText = `
    position: absolute;
    visibility: hidden;
    width: ${textDisplayRef.value?.offsetWidth || 800}px;
    font-size: 1.875rem;
    font-family: monospace;
    line-height: 2.5rem;
  `
  tempDiv.textContent = wordsBeforeCurrent
  document.body.appendChild(tempDiv)

  const height = tempDiv.offsetHeight
  document.body.removeChild(tempDiv)

  // Высота одной строки примерно 2.5rem (40px)
  const lineHeight = 40
  const currentLine = Math.floor(height / lineHeight)

  // Смещаем так, чтобы текущая строка была на второй позиции (в центре)
  lineOffset.value = -(currentLine - 1) * lineHeight
}

// ИСПРАВЛЕННАЯ ФУНКЦИЯ getCharClass
const getCharClass = (wordIdx: number, charIdx: number): string => {
  // Если нет фокуса и тест не активен - не показываем статус
  if (!hasFocus.value && !store.isTestActive) {
    return ''
  }
  
  // Проверяем что слово существует
  const currentWord = store.words[wordIdx]
  if (!currentWord) {
    return ''
  }
  
  // Для завершенных слов берем из истории
  if (wordIdx < store.currentWordIndex) {
    const historyClass = store.wordHistory[wordIdx]?.[charIdx]
    return historyClass || ''
  } 
  // Для текущего слова
  else if (wordIdx === store.currentWordIndex) {
    // Если символ уже напечатан
    if (charIdx < store.inputValue.length) {
      const typedChar = store.inputValue[charIdx]
      const expectedChar = currentWord[charIdx]
      return typedChar === expectedChar ? 'correct' : 'incorrect'
    } 
    // Если это позиция курсора
    else if (charIdx === store.inputValue.length && hasFocus.value && store.isTestActive) {
      return 'current'
    }
  }
  
  return ''
}

// Обработка нажатия клавиш для замены цифр на якутские буквы
const handleBeforeInput = (event: InputEvent) => {
  const data = event.data
  if (data) {
    const yakutLetter = getLetterForKey(data)
    if (yakutLetter) {
      event.preventDefault()
      const input = event.target as HTMLInputElement
      const start = input.selectionStart || 0
      const end = input.selectionEnd || 0
      const newValue = input.value.substring(0, start) + yakutLetter + input.value.substring(end)
      input.value = newValue
      input.setSelectionRange(start + 1, start + 1)
      
      // Триггерим событие input вручную
      const inputEvent = new Event('input', { bubbles: true })
      input.dispatchEvent(inputEvent)
    }
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  // Проверяем, нужно ли заменить цифру на якутскую букву
  const yakutLetter = getLetterForKey(e.key)
  if (yakutLetter && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault()
    focusInput()
    
    if (hiddenInput.value) {
      const input = hiddenInput.value
      const start = input.selectionStart || 0
      const end = input.selectionEnd || 0
      const newValue = input.value.substring(0, start) + yakutLetter + input.value.substring(end)
      input.value = newValue
      input.setSelectionRange(start + 1, start + 1)
      
      // Триггерим событие input
      const inputEvent = new Event('input', { bubbles: true })
      input.dispatchEvent(inputEvent)
    }
    return
  }
  
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    focusInput()
  }
  if (e.ctrlKey && e.key === 'Backspace') {
    e.preventDefault()
    inputValue.value = ''
    store.inputValue = ''
  }
  if ((e.key === 'Tab' || e.key === 'Escape') && !showResults.value) {
    e.preventDefault()
    restartTest()
  }
  // Также добавляем возможность рестарта из результатов
  if ((e.key === 'Tab' || e.key === 'Escape') && showResults.value) {
    e.preventDefault()
    restartTest()
  }
}

// Исправленная типизация для обработчика действий store
const unsubscribe = store.$onAction(
  ({ name, after }: { name: string; after: (callback: () => void) => void }) => {
    if (name === 'endTest') {
      after(() => {
        showResults.value = true
      })
    }
  },
)

onMounted(() => {
  store.initTest()
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  unsubscribe()
})
</script>

<template>
  <div>
    <main class="flex-1 flex flex-col items-center justify-center py-6 sm:py-16">
      <!-- Controls (только когда не активен тест и нет результатов) -->
      <div v-if="!store.isTestActive && !showResults" class="flex items-center gap-3 mb-8 sm:mb-20">
        <Control v-model="selectedTime" />
      </div>

      <!-- Typing Container -->
      <div v-if="!showResults" class="w-full">
        <!-- Timer -->
        <div
          :class="[
            'text-3xl sm:text-4xl font-bold mb-4 sm:mb-6 transition-all duration-300 select-none text-left benzin',
            isDark ? 'text-[#2a2a2a]' : 'text-gray-300',
          ]"
          :style="{
            transform: isAnimating ? 'translateY(-5px)' : 'translateY(0)',
            opacity: isAnimating ? '0.7' : '1',
          }"
        >
          {{ timeDisplay }}
        </div>

        <!-- Text Display (Monkeytype-style) -->
        <div class="text-display-wrapper overflow-hidden relative mb-4" style="height: 10rem">
          <div
            ref="textDisplayRef"
            @click="focusInput"
            tabindex="0"
            :class="[
              'benzin text-lg sm:text-2xl leading-relaxed cursor-text select-none font-mono transition-transform duration-100',
              isDark ? 'text-neutral-500' : 'text-neutral-600',
            ]"
            :style="{
              transform: `translateY(${lineOffset}px)`,
            }"
          >
            <span
              v-for="(word, wordIdx) in store.words"
              :key="wordIdx"
              :class="[
                'word inline-block relative',
                wordIdx === store.currentWordIndex && hasFocus && store.isTestActive ? 'word-active' : ''
              ]"
              :style="{ marginRight: '0.3rem' }"
            >
              <span
                v-for="(char, charIdx) in word"
                :key="charIdx"
                :class="[
                  'char relative inline-block transition-all duration-75',
                  {
                    [isDark ? 'text-white' : 'text-gray-900']:
                      getCharClass(wordIdx, charIdx) === 'correct',
                    'text-red-500 char-incorrect': getCharClass(wordIdx, charIdx) === 'incorrect',
                    'char-cursor': getCharClass(wordIdx, charIdx) === 'current',
                  }
                ]"
              >
                {{ char }}
              </span>
              <span
                v-if="wordIdx === store.currentWordIndex && store.inputValue.length > word.length"
                v-for="extraIdx in store.inputValue.length - word.length"
                :key="`extra-${extraIdx}`"
                class="char relative inline-block text-red-500 extra-char"
              >
                {{ store.inputValue[word.length + extraIdx - 1] }}
              </span>
            </span>
          </div>
        </div>

        <!-- Mobile Input -->
        <div class="sm:hidden mb-4">
          <input
            type="text"
            :class="[
              'w-full px-4 py-3 rounded-xl border text-base outline-none transition-all',
              isDark
                ? 'bg-[#1a1a1a] border-neutral-700 text-white placeholder-neutral-600 focus:border-neutral-500'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400'
            ]"
            v-model="inputValue"
            @input="handleInput"
            @focus="handleFocus"
            @blur="handleBlur"
            @beforeinput="handleBeforeInput"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder="Начните печатать здесь..."
          />
        </div>

        <!-- Focus Message & Restart -->
        <div class="text-center">
          <p
            :class="[
              'text-xs mb-4 sm:mb-6 select-none transition-opacity duration-300',
              isDark ? 'text-neutral-700' : 'text-neutral-400',
              { 'opacity-0': hasFocus || store.isTestActive },
            ]"
          >
            <span class="hidden sm:inline">Нажмите на текст и начните печатать</span>
            <span class="sm:hidden">Нажмите на поле ввода ниже</span>
          </p>
          <div
            @click="restartTest"
            :class="[
              'inline-flex justify-center cursor-pointer rotate-icon',
              isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-neutral-900',
            ]"
          >
            <RotateCcw :size="24" />
          </div>
        </div>

        <!-- Hidden Input (desktop) -->
        <input
          ref="hiddenInput"
          type="text"
          class="hidden sm:block absolute opacity-0 pointer-events-none"
          v-model="inputValue"
          @input="handleInput"
          @focus="handleFocus"
          @blur="handleBlur"
          @beforeinput="handleBeforeInput"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
        />
      </div>

      <!-- Results View -->
      <ResultsView
        v-if="showResults"
        :stats="store.finalStats"
        :wpm-history="store.wpmHistory"
        :raw-history="store.rawHistory"
        :burst-history="store.burstHistory"
        :error-timestamps="store.errorTimestamps"
        @restart="restartTest"
      />
    </main>
  </div>

  <!-- Kbd hints only on desktop -->
  <div class="hidden sm:block">
    <Kbd></Kbd>
  </div>
</template>

<style scoped>
.rotate-icon {
  transition: transform 0.3s ease;
}
.rotate-icon:hover {
  transform: rotate(-260deg);
}

/* Monkeytype-style cursor */
.char-cursor::before {
  content: '';
  position: absolute;
  left: -2px;
  top: 2px;
  bottom: 2px;
  width: 2.5px;
  background: currentColor;
  animation: blink-smooth 1s infinite;
  border-radius: 2px;
}

@keyframes blink-smooth {
  0%, 49% {
    opacity: 1;
  }
  50%, 100% {
    opacity: 0;
  }
}

/* Active word styling (like monkeytype) */
.word-active {
  opacity: 1;
}

.word {
  margin-bottom: 10px;
  position: relative;
}

/* Incorrect character wobble */
.char-incorrect {
  animation: wobble 0.1s ease-in-out;
}

@keyframes wobble {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  75% {
    transform: translateX(2px);
  }
}

/* Extra characters styling */
.extra-char {
  opacity: 0.8;
  background: rgba(239, 68, 68, 0.2);
  border-radius: 2px;
}

.char {
  letter-spacing: 0.05em;
  position: relative;
  padding: 2px 0;
}

/* Smooth scrolling for text */
.text-display-wrapper {
  position: relative;
}
</style>