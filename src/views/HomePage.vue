<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { RotateCcw } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import { useSound } from '@/shared/composables/useSound'
import { useControlStore } from '@/stores/control'
import { useTypingStore } from '@/stores/typingStore'
import { useYakutKeyBindings } from '@/composables/useYakutKeyBindings'
import Control from '@/components/Control.vue'
import ResultsView from '@/components/ResultsView.vue'
import Kbd from '@/components/Kbd.vue'

const { isDark } = useTheme()
const { playKeypress, playCorrect, playIncorrect } = useSound()
const control = useControlStore()
const store = useTypingStore()

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

// Анимация чисел
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

watch(selectedTime, (val) => {
  if (val !== undefined) {
    control.setTime(val)
  }
})

// При смене сложности — перезагрузить слова
watch(
  () => control.selectedDifficulty,
  () => {
    restartTest()
  },
)

// Отображаемое время
const timeDisplay = computed(() => {
  return store.isTestActive ? store.timeLeft : displayTime.value
})

// Live WPM для отображения во время теста
const liveWpm = computed(() => {
  return store.isTestActive ? store.wpm : 0
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

  if (newInput.length > prevInputLength) {
    playKeypress()

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

  if (store.currentWordIndex > prevWordIndex) {
    updateLineOffset()
  }
}

const getLineHeight = (): number => {
  if (!textDisplayRef.value) return 40
  // Динамически вычисляем высоту строки из CSS
  const computed = window.getComputedStyle(textDisplayRef.value)
  const lh = parseFloat(computed.lineHeight)
  return isNaN(lh) ? 40 : lh
}

const updateLineOffset = () => {
  const wordsBeforeCurrent = store.words.slice(0, store.currentWordIndex + 1).join(' ')

  const tempDiv = document.createElement('div')
  const displayEl = textDisplayRef.value
  const width = displayEl?.offsetWidth || 800

  tempDiv.style.cssText = `
    position: absolute;
    visibility: hidden;
    width: ${width}px;
    font-size: ${window.getComputedStyle(displayEl!).fontSize};
    font-family: monospace;
    line-height: ${window.getComputedStyle(displayEl!).lineHeight};
    letter-spacing: 0.05em;
  `
  tempDiv.textContent = wordsBeforeCurrent
  document.body.appendChild(tempDiv)

  const height = tempDiv.offsetHeight
  document.body.removeChild(tempDiv)

  const lineHeight = getLineHeight()
  const currentLine = Math.floor(height / lineHeight)

  lineOffset.value = -(currentLine - 1) * lineHeight
}

const getCharClass = (wordIdx: number, charIdx: number): string => {
  if (!hasFocus.value && !store.isTestActive) return ''

  const currentWord = store.words[wordIdx]
  if (!currentWord) return ''

  if (wordIdx < store.currentWordIndex) {
    const historyClass = store.wordHistory[wordIdx]?.[charIdx]
    return historyClass || ''
  } else if (wordIdx === store.currentWordIndex) {
    if (charIdx < store.inputValue.length) {
      const typedChar = store.inputValue[charIdx]
      const expectedChar = currentWord[charIdx]
      return typedChar === expectedChar ? 'correct' : 'incorrect'
    } else if (charIdx === store.inputValue.length && hasFocus.value && store.isTestActive) {
      return 'current'
    }
  }

  return ''
}

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

      const inputEvent = new Event('input', { bubbles: true })
      input.dispatchEvent(inputEvent)
    }
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
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
  if ((e.key === 'Tab' || e.key === 'Escape') && showResults.value) {
    e.preventDefault()
    restartTest()
  }
}

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
    <main class="flex-1 flex flex-col items-center justify-center py-4 sm:py-6 md:py-16">
      <!-- Controls (только когда не активен тест и нет результатов) -->
      <div v-if="!store.isTestActive && !showResults" class="flex items-center gap-3 mb-6 sm:mb-8 md:mb-20">
        <Control v-model="selectedTime" />
      </div>

      <!-- Typing Container -->
      <div v-if="!showResults" class="w-full">
        <!-- Timer + Live WPM -->
        <div class="flex items-baseline gap-3 sm:gap-4 mb-3 sm:mb-4 md:mb-6">
          <div
            :class="[
              'text-2xl sm:text-3xl md:text-4xl font-bold transition-all duration-300 select-none benzin',
              isDark ? 'text-[#2a2a2a]' : 'text-gray-300',
            ]"
            :style="{
              transform: isAnimating ? 'translateY(-5px)' : 'translateY(0)',
              opacity: isAnimating ? '0.7' : '1',
            }"
          >
            {{ timeDisplay }}
          </div>
          <!-- Live WPM во время теста -->
          <div
            v-if="store.isTestActive && liveWpm > 0"
            :class="[
              'text-sm sm:text-base font-medium transition-opacity duration-300 select-none',
              isDark ? 'text-neutral-600' : 'text-neutral-400',
            ]"
          >
            {{ liveWpm }} wpm
          </div>
        </div>

        <!-- Text Display -->
        <div class="text-display-wrapper overflow-hidden relative mb-3 sm:mb-4 h-32 sm:h-40">
          <div
            ref="textDisplayRef"
            @click="focusInput"
            tabindex="0"
            :class="[
              'benzin text-base sm:text-lg md:text-2xl leading-relaxed cursor-text select-none font-mono transition-transform duration-100',
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
                v-for="extraIdx in Math.min(store.inputValue.length - word.length, store.maxExtraChars)"
                :key="`extra-${extraIdx}`"
                class="char relative inline-block text-red-500 extra-char"
              >
                {{ store.inputValue[word.length + extraIdx - 1] }}
              </span>
            </span>
          </div>
        </div>

        <!-- Mobile Input -->
        <div class="sm:hidden mb-3">
          <input
            type="text"
            :class="[
              'w-full px-3 py-2.5 rounded-xl border text-base outline-none transition-all',
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
              'text-xs mb-3 sm:mb-4 md:mb-6 select-none transition-opacity duration-300',
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
  <div class="hidden md:block">
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
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

.word-active { opacity: 1; }
.word { margin-bottom: 10px; position: relative; }

.char-incorrect {
  animation: wobble 0.1s ease-in-out;
}

@keyframes wobble {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

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

.text-display-wrapper { position: relative; }
</style>
