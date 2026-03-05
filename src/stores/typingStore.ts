import { defineStore } from 'pinia'
import { apiService } from '@/services/api'
import { useAuthStore } from './auth'
import { useControlStore } from './control'

export const useTypingStore = defineStore('typing', {
  state: () => ({
    serverWords: [] as string[],
    currentText: '',
    words: [] as string[],
    currentWordIndex: 0,
    currentCharIndex: 0,
    startTime: null as number | null,
    wordStartTime: null as number | null,
    selectedTime: 15,
    timeLeft: 15,
    isTestActive: false,
    correctChars: 0,
    totalChars: 0,
    totalErrors: 0,
    currentErrors: 0,
    inputValue: '',
    wordHistory: [] as any[],
    wpmHistory: [] as number[],
    rawHistory: [] as number[],
    burstHistory: [] as number[],
    errorsHistory: [] as number[],
    correctPerSecond: {} as Record<number, number>,
    totalPerSecond: {} as Record<number, number>,
    errorsPerSecond: {} as Record<number, number>,
    burstWpm: 0,
    errorTimestamps: [] as number[],
    timerInterval: null as ReturnType<typeof setInterval> | null,
    isEnding: false,
    testEndTime: null as number | null,
    maxExtraChars: 10,
    // Сложность на момент старта теста
    testDifficulty: 'normal' as string,
  }),

  getters: {
    wpm: (state) => {
      if (!state.startTime) return 0
      const m = (Date.now() - state.startTime) / 60000
      return m > 0 ? Math.round((state.correctChars / 5) / m) || 0 : 0
    },
    rawWpm: (state) => {
      if (!state.startTime) return 0
      const m = (Date.now() - state.startTime) / 60000
      return m > 0 ? Math.round((state.totalChars / 5) / m) || 0 : 0
    },
    accuracy: (state) => {
      return state.totalChars > 0 ? Math.round((state.correctChars / state.totalChars) * 100) : 100
    },
    finalStats: (state) => {
      const end = state.testEndTime || Date.now()
      const m = state.startTime ? (end - state.startTime) / 60000 : state.selectedTime / 60
      const wpm = m > 0 ? Math.round((state.correctChars / 5) / m) : 0
      const rawWpm = m > 0 ? Math.round((state.totalChars / 5) / m) : 0
      const accuracy = state.totalChars > 0 ? Math.round((state.correctChars / state.totalChars) * 100) : 100

      let consistency = 0
      if (state.wpmHistory.length > 1) {
        const avg = state.wpmHistory.reduce((a, b) => a + b, 0) / state.wpmHistory.length
        if (avg > 0) {
          const variance = state.wpmHistory.reduce((s, v) => s + (v - avg) ** 2, 0) / state.wpmHistory.length
          consistency = Math.max(0, Math.round(100 - (Math.sqrt(variance) / avg) * 100))
        }
      }

      return { wpm, rawWpm, accuracy, burstWpm: state.burstWpm, totalErrors: state.totalErrors, consistency, testDuration: state.selectedTime }
    },
  },

  actions: {
    async loadWords() {
      const control = useControlStore()
      try {
        this.serverWords = await apiService.getWords(control.selectedDifficulty, 200)
      } catch (error) {
        console.error('Failed to load words:', error)
        this.serverWords = ['саха','дойду','киһи','сир','ыал','олох','үлэ','кыра','улахан','мир','человек','дом','земля','вода']
      }
    },

    generateText() {
      if (this.serverWords.length === 0) {
        this.serverWords = ['саха','дойду','киһи','сир','ыал','олох','үлэ','кыра','улахан','мир','человек','дом']
      }
      const count = 80 + Math.floor(Math.random() * 20)
      const words = []
      for (let i = 0; i < count; i++) {
        words.push(this.serverWords[Math.floor(Math.random() * this.serverWords.length)])
      }
      return words.join(' ')
    },

    async initTest() {
      if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null }
      this.isEnding = false
      this.testEndTime = null

      const control = useControlStore()
      this.testDifficulty = control.selectedDifficulty

      await this.loadWords()

      this.currentText = this.generateText()
      this.words = this.currentText.split(' ')
      this.currentWordIndex = 0
      this.currentCharIndex = 0
      this.correctChars = 0
      this.totalChars = 0
      this.timeLeft = this.selectedTime
      this.isTestActive = false
      this.startTime = null
      this.wordStartTime = null
      this.inputValue = ''
      this.wordHistory = []
      this.wpmHistory = []
      this.rawHistory = []
      this.burstHistory = []
      this.errorsHistory = []
      this.correctPerSecond = {}
      this.totalPerSecond = {}
      this.errorsPerSecond = {}
      this.burstWpm = 0
      this.totalErrors = 0
      this.currentErrors = 0
      this.errorTimestamps = []
    },

    startTimer() {
      if (this.isTestActive) return
      this.isTestActive = true
      this.isEnding = false
      this.startTime = Date.now()
      this.wordStartTime = Date.now()
      this.wpmHistory = []; this.rawHistory = []; this.errorsHistory = []; this.burstHistory = []

      this.timerInterval = setInterval(() => {
        if (this.isEnding || !this.isTestActive) {
          if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null }
          return
        }
        const elapsed = Math.floor((Date.now() - this.startTime!) / 1000)
        const ws = Math.min(3, elapsed + 1)
        let cS = 0, tS = 0, eS = 0
        for (let i = elapsed - ws + 1; i <= elapsed; i++) {
          cS += this.correctPerSecond[i] || 0
          tS += this.totalPerSecond[i] || 0
          eS += this.errorsPerSecond[i] || 0
        }
        const wN = Math.round((cS / ws / 5) * 60)
        const rN = Math.round((tS / ws / 5) * 60)
        if (cS > 0 || tS > 0) {
          this.wpmHistory.push(wN)
          this.rawHistory.push(rN)
          this.errorsHistory.push(eS)
          const bN = Math.max(...this.wpmHistory.slice(-ws))
          this.burstHistory.push(bN)
          if (bN > this.burstWpm) this.burstWpm = bN
        }
        this.timeLeft--
        if (this.timeLeft <= 0) this.endTest()
      }, 1000)
    },

    async endTest() {
      if (this.isEnding) return
      this.isEnding = true
      this.testEndTime = Date.now()
      if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null }
      this.isTestActive = false

      const stats = { ...this.finalStats }
      const authStore = useAuthStore()

      if (authStore.isAuthenticated && this.startTime) {
        try {
          await apiService.saveTestResult({
            difficulty: this.testDifficulty,
            time_mode: this.selectedTime,
            test_duration: this.selectedTime,
            wpm: stats.wpm,
            raw_wpm: stats.rawWpm,
            burst_wpm: stats.burstWpm,
            accuracy: stats.accuracy,
            consistency: stats.consistency,
            total_errors: stats.totalErrors,
          })
          console.log('Test result saved!')
          // Уведомляем Header обновить уровень
          window.dispatchEvent(new Event('sakhatype:test-saved'))
        } catch (error) {
          console.error('Failed to save result:', error)
        }
      }
    },

    processInput(newValue: string) {
      if (this.isEnding) return
      if (!this.isTestActive && this.testEndTime !== null) return

      const oldLen = this.inputValue.length
      const sec = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0
      const word = this.words[this.currentWordIndex]
      if (!word) return

      // Лимит ввода
      if (newValue.length > word.length + this.maxExtraChars && newValue.length > oldLen && !newValue.endsWith(' ')) return

      if (newValue.endsWith(' ')) {
        const typed = this.inputValue.trim()
        this.wordHistory[this.currentWordIndex] = []
        const now = Date.now()

        if (this.wordStartTime) {
          const wm = (now - this.wordStartTime) / 60000
          if (wm > 0) {
            const b = Math.round(typed.length / 5 / wm)
            if (b > this.burstWpm) this.burstWpm = b
          }
        }
        this.wordStartTime = now

        // Пробел = 1 корректный символ
        this.totalChars++
        this.totalPerSecond[sec] = (this.totalPerSecond[sec] || 0) + 1
        this.correctChars++
        this.correctPerSecond[sec] = (this.correctPerSecond[sec] || 0) + 1

        // Записываем историю слова
        for (let i = 0; i < Math.max(typed.length, word.length); i++) {
          if (i < typed.length && i < word.length && typed[i] === word[i]) {
            this.wordHistory[this.currentWordIndex][i] = 'correct'
          } else {
            this.wordHistory[this.currentWordIndex][i] = 'incorrect'
          }
        }

        this.currentWordIndex++
        this.inputValue = ''
        if (this.currentWordIndex >= this.words.length) {
          this.currentText = this.generateText()
          this.words = this.currentText.split(' ')
          this.currentWordIndex = 0
          this.wordHistory = []
        }
      } else {
        const ci = newValue.length - 1
        if (newValue.length > oldLen) {
          this.totalChars++
          this.totalPerSecond[sec] = (this.totalPerSecond[sec] || 0) + 1
          if (ci < word.length && newValue[ci] === word[ci]) {
            this.correctChars++
            this.correctPerSecond[sec] = (this.correctPerSecond[sec] || 0) + 1
          } else {
            this.currentErrors++
            this.totalErrors++
            this.errorsPerSecond[sec] = (this.errorsPerSecond[sec] || 0) + 1
            this.errorTimestamps.push(sec)
          }
        } else if (newValue.length < oldLen) {
          // Backspace: корректируем totalChars/correctChars для WPM, но totalErrors НЕ уменьшаем
          if (this.totalChars > 0) {
            this.totalChars--
            this.totalPerSecond[sec] = Math.max((this.totalPerSecond[sec] || 1) - 1, 0)
          }
          const di = oldLen - 1
          if (di < word.length && this.inputValue[di] === word[di]) {
            if (this.correctChars > 0) {
              this.correctChars--
              this.correctPerSecond[sec] = Math.max((this.correctPerSecond[sec] || 1) - 1, 0)
            }
          }
        }
        this.inputValue = newValue
      }
    },

    setTime(time: number) {
      this.selectedTime = time
      this.timeLeft = time
    },
  },
})
