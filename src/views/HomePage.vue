<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed, type Ref } from 'vue'
import { RotateCcw } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import { useControlStore } from '@/stores/control'
import { useTypingStore } from '@/stores/typingStore'
import Control from '@/components/Control.vue'
import ResultsView from '@/components/ResultsView.vue'

const { isDark } = useTheme()
const control = useControlStore()
const store = useTypingStore()

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

const restartTest = () => {
  store.initTest()
  inputValue.value = ''
  showResults.value = false
  lineOffset.value = 0
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
  if (!store.isTestActive) {
    store.startTimer()
    if (!hasFocus.value) {
      hasFocus.value = true
    }
  }

  const prevWordIndex = store.currentWordIndex
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

const getCharClass = (wordIdx: number, charIdx: number): string => {
  if (!hasFocus.value && !store.isTestActive) {
    return ''
  }

  if (wordIdx < store.currentWordIndex) {
    return store.wordHistory[wordIdx]?.[charIdx] || ''
  } else if (wordIdx === store.currentWordIndex) {
    if (charIdx < store.inputValue.length)
      return store.inputValue[charIdx] === store.words[wordIdx][charIdx] ? 'correct' : 'incorrect'
    else if (charIdx === store.inputValue.length && hasFocus.value && store.isTestActive)
      return 'current'
  }
  return ''
}

const handleKeyDown = (e: KeyboardEvent) => {
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
}

// Исправленная типизация для обработчика действий store
const unsubscribe = store.$onAction(
  ({ name, after }: { name: string; after: (callback: () => void) => void }) => {
    if (name === 'endTest') after(() => (showResults.value = true))
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
    <main class="flex-1 flex flex-col items-center justify-center py-16">
      <!-- Controls (только когда не активен тест и нет результатов) -->
      <div v-if="!store.isTestActive && !showResults" class="flex items-center gap-3 mb-20">
        <Control v-model="selectedTime" />
      </div>

      <!-- Typing Container -->
      <div v-if="!showResults" class="w-full">
        <!-- Timer -->
        <div
          :class="[
            'text-7xl font-bold mb-6 transition-all duration-300 select-none text-left',
            isDark ? 'text-[#2a2a2a]' : 'text-gray-300',
          ]"
          :style="{
            transform: isAnimating ? 'translateY(-5px)' : 'translateY(0)',
            opacity: isAnimating ? '0.7' : '1',
          }"
        >
          {{ timeDisplay }}
        </div>

        <!-- Text Display -->
        <div class="text-display-wrapper overflow-hidden relative mb-4" style="height: 8rem">
          <div
            ref="textDisplayRef"
            @click="focusInput"
            tabindex="0"
            :class="[
              'text-3xl leading-relaxed cursor-text select-none font-mono transition-transform duration-300',
              isDark ? 'text-gray-500' : 'text-gray-400',
            ]"
            :style="{
              transform: `translateY(${lineOffset}px)`,
            }"
          >
            <span
              v-for="(word, wordIdx) in store.words"
              :key="wordIdx"
              class="word inline-block mr-2 relative"
            >
              <span
                v-for="(char, charIdx) in word"
                :key="charIdx"
                class="char relative inline-block transition-colors duration-100"
                :class="{
                  [isDark ? 'text-white' : 'text-gray-900']:
                    getCharClass(wordIdx, charIdx) === 'correct',
                  'text-red-500': getCharClass(wordIdx, charIdx) === 'incorrect',
                  'char-current': getCharClass(wordIdx, charIdx) === 'current',
                }"
              >
                {{ char }}
              </span>
            </span>
          </div>
        </div>

        <!-- Focus Message & Restart -->
        <div class="text-center">
          <p
            :class="[
              'text-xs mb-6 select-none transition-opacity duration-300',
              isDark ? 'text-gray-500' : 'text-gray-600',
              { 'opacity-0': hasFocus || store.isTestActive },
            ]"
          >
            Нажмите на текст и начните печатать
          </p>
          <div
            @click="restartTest"
            :class="[
              'inline-flex justify-center cursor-pointer rotate-icon',
              isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900',
            ]"
          >
            <RotateCcw :size="24" />
          </div>
        </div>

        <!-- Hidden Input -->
        <input
          ref="hiddenInput"
          type="text"
          class="absolute opacity-0 pointer-events-none"
          v-model="inputValue"
          @input="handleInput"
          @focus="handleFocus"
          @blur="handleBlur"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
        />
      </div>

      <!-- Results View -->
      <ResultsView
        v-else
        :stats="store.finalStats"
        :wpm-history="store.wpmHistory"
        :raw-history="store.rawHistory"
        :burst-history="store.burstHistory"
        :error-timestamps="store.errorTimestamps"
        @restart="restartTest"
      />
    </main>
  </div>
</template>

<style scoped>
.rotate-icon {
  transition: transform 0.3s ease;
}
.rotate-icon:hover {
  transform: rotate(-260deg);
}

.char-current::after {
  content: '';
  position: absolute;
  left: -1px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: currentColor;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}

.word {
  margin-bottom: 8px;
}

.char {
  letter-spacing: 0.05em;
}
</style>
