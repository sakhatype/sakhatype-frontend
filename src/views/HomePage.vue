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
const { getLetterForKey } = useYakutKeyBindings()

const selectedTime = ref(control.selectedTime)
const displayTime = ref(control.selectedTime)
const isAnimating = ref(false)
const hiddenInput = ref<HTMLInputElement | null>(null)
const inputValue = ref('')
const hasFocus = ref(false)
const showResults = ref(false)
const textDisplayRef = ref<HTMLDivElement | null>(null)
const lineOffset = ref(0)

const animateNumber = (from: number, to: number) => {
  if (from === to) return
  isAnimating.value = true
  const steps = 30; let current = from; let step = 0
  const inc = (to - from) / steps
  const timer = setInterval(() => {
    step++; current += inc
    if (step >= steps) { displayTime.value = to; isAnimating.value = false; clearInterval(timer) }
    else displayTime.value = Math.round(current)
  }, 200 / steps)
}

watch(() => control.selectedTime, (n, o) => {
  if (n !== undefined && o !== undefined) { selectedTime.value = n; animateNumber(o, n); setTime(n) }
})
watch(selectedTime, (v) => { if (v !== undefined) control.setTime(v) })
watch(() => control.selectedDifficulty, () => restartTest())

const timeDisplay = computed(() => store.isTestActive ? store.timeLeft : displayTime.value)
const liveWpm = computed(() => store.isTestActive ? store.wpm : 0)

const setTime = (t: number) => { store.setTime(t); restartTest() }
const restartTest = async () => { showResults.value = false; lineOffset.value = 0; inputValue.value = ''; await store.initTest() }
const focusInput = () => { hiddenInput.value?.focus(); hasFocus.value = true }
const handleFocus = () => { hasFocus.value = true }
const handleBlur = () => { hasFocus.value = false }

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!store.isTestActive && !store.isEnding) { store.startTimer(); if (!hasFocus.value) hasFocus.value = true }
  const prevIdx = store.currentWordIndex
  const prevLen = store.inputValue.length
  const newInput = target.value
  if (newInput.length > prevLen) {
    playKeypress()
    const ch = newInput[newInput.length - 1]
    const w = store.words[store.currentWordIndex]
    if (w) { if (ch === w[newInput.length - 1]) playCorrect(); else playIncorrect() }
  }
  store.processInput(target.value)
  inputValue.value = store.inputValue
  if (store.currentWordIndex > prevIdx) updateLineOffset()
}

const updateLineOffset = () => {
  const el = textDisplayRef.value
  if (!el) return
  const text = store.words.slice(0, store.currentWordIndex + 1).join(' ')
  const tmp = document.createElement('div')
  const cs = window.getComputedStyle(el)
  tmp.style.cssText = `position:absolute;visibility:hidden;width:${el.offsetWidth}px;font-size:${cs.fontSize};font-family:monospace;line-height:${cs.lineHeight};letter-spacing:0.05em;`
  tmp.textContent = text
  document.body.appendChild(tmp)
  const h = tmp.offsetHeight
  document.body.removeChild(tmp)
  const lh = parseFloat(cs.lineHeight) || 40
  lineOffset.value = -(Math.floor(h / lh) - 1) * lh
}

const getCharClass = (wi: number, ci: number): string => {
  if (!hasFocus.value && !store.isTestActive) return ''
  const w = store.words[wi]
  if (!w) return ''
  if (wi < store.currentWordIndex) return store.wordHistory[wi]?.[ci] || ''
  if (wi === store.currentWordIndex) {
    if (ci < store.inputValue.length) return store.inputValue[ci] === w[ci] ? 'correct' : 'incorrect'
    if (ci === store.inputValue.length && hasFocus.value && store.isTestActive) return 'current'
  }
  return ''
}

const handleBeforeInput = (event: InputEvent) => {
  const data = event.data
  if (data) {
    const yl = getLetterForKey(data)
    if (yl) {
      event.preventDefault()
      const inp = event.target as HTMLInputElement
      const s = inp.selectionStart || 0, e = inp.selectionEnd || 0
      inp.value = inp.value.substring(0, s) + yl + inp.value.substring(e)
      inp.setSelectionRange(s + 1, s + 1)
      inp.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  const yl = getLetterForKey(e.key)
  if (yl && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault(); focusInput()
    if (hiddenInput.value) {
      const inp = hiddenInput.value
      const s = inp.selectionStart || 0, en = inp.selectionEnd || 0
      inp.value = inp.value.substring(0, s) + yl + inp.value.substring(en)
      inp.setSelectionRange(s + 1, s + 1)
      inp.dispatchEvent(new Event('input', { bubbles: true }))
    }
    return
  }
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) focusInput()
  if (e.ctrlKey && e.key === 'Backspace') { e.preventDefault(); inputValue.value = ''; store.inputValue = '' }
  if (e.key === 'Tab' || e.key === 'Escape') { e.preventDefault(); restartTest() }
}

const unsubscribe = store.$onAction(({ name, after }: { name: string; after: (cb: () => void) => void }) => {
  if (name === 'endTest') after(() => { showResults.value = true })
})

onMounted(() => { store.initTest(); document.addEventListener('keydown', handleKeyDown) })
onUnmounted(() => { document.removeEventListener('keydown', handleKeyDown); unsubscribe() })
</script>

<template>
  <div>
    <main class="flex-1 flex flex-col items-center justify-center py-4 sm:py-8 md:py-16">
      <!-- Controls -->
      <div v-if="!store.isTestActive && !showResults" class="flex items-center gap-3 mb-4 sm:mb-8 md:mb-20">
        <Control v-model="selectedTime" />
      </div>

      <!-- Typing -->
      <div v-if="!showResults" class="w-full">
        <!-- Timer + live WPM -->
        <div class="flex items-baseline gap-3 mb-2 sm:mb-4 md:mb-6">
          <div :class="['text-2xl sm:text-3xl md:text-4xl font-bold transition-all duration-300 select-none benzin', isDark ? 'text-[#2a2a2a]' : 'text-gray-300']"
               :style="{ transform: isAnimating ? 'translateY(-5px)' : 'translateY(0)', opacity: isAnimating ? '0.7' : '1' }">
            {{ timeDisplay }}
          </div>
          <div v-if="store.isTestActive && liveWpm > 0" :class="['text-sm font-medium select-none', isDark ? 'text-neutral-600' : 'text-neutral-400']">
            {{ liveWpm }} wpm
          </div>
        </div>

        <!-- Text display -->
        <div class="text-display-wrapper overflow-hidden relative mb-2 sm:mb-4 h-28 sm:h-36 md:h-40">
          <div ref="textDisplayRef" @click="focusInput" tabindex="0"
               :class="['benzin text-sm sm:text-lg md:text-2xl leading-relaxed cursor-text select-none font-mono transition-transform duration-100', isDark ? 'text-neutral-500' : 'text-neutral-600']"
               :style="{ transform: `translateY(${lineOffset}px)` }">
            <span v-for="(word, wi) in store.words" :key="wi"
                  :class="['word inline-block relative', wi === store.currentWordIndex && hasFocus && store.isTestActive ? 'word-active' : '']"
                  :style="{ marginRight: '0.3rem' }">
              <span v-for="(char, ci) in word" :key="ci"
                    :class="['char relative inline-block transition-all duration-75', {
                      [isDark ? 'text-white' : 'text-gray-900']: getCharClass(wi, ci) === 'correct',
                      'text-red-500 char-incorrect': getCharClass(wi, ci) === 'incorrect',
                      'char-cursor': getCharClass(wi, ci) === 'current',
                    }]">{{ char }}</span>
              <span v-if="wi === store.currentWordIndex && store.inputValue.length > word.length"
                    v-for="ei in Math.min(store.inputValue.length - word.length, store.maxExtraChars)" :key="`e-${ei}`"
                    class="char relative inline-block text-red-500 extra-char">{{ store.inputValue[word.length + ei - 1] }}</span>
            </span>
          </div>
        </div>

        <!-- Mobile input -->
        <div class="sm:hidden mb-2">
          <input type="text"
                 :class="['w-full px-3 py-2.5 rounded-xl border text-base outline-none transition-all', isDark ? 'bg-[#1a1a1a] border-neutral-700 text-white placeholder-neutral-600 focus:border-neutral-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-400']"
                 v-model="inputValue" @input="handleInput" @focus="handleFocus" @blur="handleBlur" @beforeinput="handleBeforeInput"
                 autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Начните печатать..." />
        </div>

        <!-- Focus hint + restart -->
        <div class="text-center">
          <p :class="['text-xs mb-2 sm:mb-4 select-none transition-opacity duration-300', isDark ? 'text-neutral-700' : 'text-neutral-400', { 'opacity-0': hasFocus || store.isTestActive }]">
            <span class="hidden sm:inline">Нажмите на текст и начните печатать</span>
            <span class="sm:hidden">Нажмите на поле ввода</span>
          </p>
          <div @click="restartTest" :class="['inline-flex justify-center cursor-pointer rotate-icon', isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-neutral-900']">
            <RotateCcw :size="22" />
          </div>
        </div>

        <!-- Hidden desktop input -->
        <input ref="hiddenInput" type="text" class="hidden sm:block absolute opacity-0 pointer-events-none"
               v-model="inputValue" @input="handleInput" @focus="handleFocus" @blur="handleBlur" @beforeinput="handleBeforeInput"
               autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
      </div>

      <!-- Results -->
      <ResultsView v-if="showResults" :stats="store.finalStats" :wpm-history="store.wpmHistory" :raw-history="store.rawHistory" :burst-history="store.burstHistory" :error-timestamps="store.errorTimestamps" @restart="restartTest" />
    </main>
  </div>
  <div class="hidden md:block"><Kbd /></div>
</template>

<style scoped>
.rotate-icon { transition: transform 0.3s ease }
.rotate-icon:hover { transform: rotate(-260deg) }
.char-cursor::before { content:''; position:absolute; left:-2px; top:2px; bottom:2px; width:2.5px; background:currentColor; animation:blink 1s infinite; border-radius:2px }
@keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
.word-active { opacity:1 }
.word { margin-bottom:8px; position:relative }
.char-incorrect { animation:wobble .1s ease-in-out }
@keyframes wobble { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-2px)} 75%{transform:translateX(2px)} }
.extra-char { opacity:.8; background:rgba(239,68,68,.2); border-radius:2px }
.char { letter-spacing:.05em; position:relative; padding:2px 0 }
.text-display-wrapper { position:relative }
</style>
