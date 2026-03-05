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
    // Запоминаем difficulty на момент начала теста чтобы отправить при сохранении
    testDifficulty: 'normal' as 'normal' | 'high',
  }),

  getters: {
    wpm: (state) => {
      if (!state.startTime) return 0
      const elapsedMinutes = (Date.now() - state.startTime) / 60000
      if (elapsedMinutes <= 0) return 0
      const wordsTyped = state.correctChars / 5
      return Math.round(wordsTyped / elapsedMinutes) || 0
    },

    rawWpm: (state) => {
      if (!state.startTime) return 0
      const elapsedMinutes = (Date.now() - state.startTime) / 60000
      if (elapsedMinutes <= 0) return 0
      return Math.round(state.totalChars / 5 / elapsedMinutes) || 0
    },

    accuracy: (state) => {
      return state.totalChars > 0 ? Math.round((state.correctChars / state.totalChars) * 100) : 100
    },

    finalStats: (state) => {
      const endTime = state.testEndTime || Date.now()
      const elapsedMinutes = state.startTime
        ? (endTime - state.startTime) / 60000
        : state.selectedTime / 60

      const wordsTyped = state.correctChars / 5
      const wpm = elapsedMinutes > 0 ? Math.round(wordsTyped / elapsedMinutes) : 0
      const rawWpm = elapsedMinutes > 0 ? Math.round(state.totalChars / 5 / elapsedMinutes) : 0
      const accuracy =
        state.totalChars > 0 ? Math.round((state.correctChars / state.totalChars) * 100) : 100

      let consistency = 0
      if (state.wpmHistory.length > 1) {
        const avgWpm = state.wpmHistory.reduce((a, b) => a + b, 0) / state.wpmHistory.length
        if (avgWpm > 0) {
          const variance =
            state.wpmHistory.reduce((sum, val) => sum + Math.pow(val - avgWpm, 2), 0) /
            state.wpmHistory.length
          const stdDev = Math.sqrt(variance)
          consistency = Math.max(0, Math.round(100 - (stdDev / avgWpm) * 100))
        }
      }

      return {
        wpm,
        rawWpm,
        accuracy,
        burstWpm: state.burstWpm,
        totalErrors: state.totalErrors,
        consistency,
        testDuration: state.selectedTime,
      }
    },
  },

  actions: {
    async loadWords() {
      const control = useControlStore()
      try {
        const words = await apiService.getWords(control.selectedDifficulty, 200)
        this.serverWords = words
      } catch (error) {
        console.error('Failed to load words from server:', error)
        this.serverWords = [
          'саха', 'дойду', 'киһи', 'сир', 'ыал', 'олох',
          'үлэ', 'кыра', 'улахан', 'мир', 'человек', 'дом',
          'земля', 'вода',
        ]
      }
    },

    generateText() {
      if (this.serverWords.length === 0) {
        this.serverWords = [
          'саха', 'дойду', 'киһи', 'сир', 'ыал', 'олох',
          'үлэ', 'кыра', 'улахан', 'мир', 'человек', 'дом',
        ]
      }

      const wordCount = 80 + Math.floor(Math.random() * 20)
      const selectedWords = []
      for (let i = 0; i < wordCount; i++) {
        const randomIndex = Math.floor(Math.random() * this.serverWords.length)
        selectedWords.push(this.serverWords[randomIndex])
      }
      return selectedWords.join(' ')
    },

    async initTest() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval)
        this.timerInterval = null
      }

      this.isEnding = false
      this.testEndTime = null

      // Запоминаем difficulty для сохранения результата
      const control = useControlStore()
      this.testDifficulty = control.selectedDifficulty

      // Загружаем слова
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

      this.wpmHistory = []
      this.rawHistory = []
      this.errorsHistory = []
      this.burstHistory = []

      this.timerInterval = setInterval(() => {
        if (this.isEnding || !this.isTestActive) {
          if (this.timerInterval) {
            clearInterval(this.timerInterval)
            this.timerInterval = null
          }
          return
        }

        const elapsedSeconds = Math.floor((Date.now() - this.startTime!) / 1000)

        const windowSize = Math.min(3, elapsedSeconds + 1)
        let correctSum = 0
        let totalSum = 0
        let errorSum = 0
        for (let i = elapsedSeconds - windowSize + 1; i <= elapsedSeconds; i++) {
          correctSum += this.correctPerSecond[i] || 0
          totalSum += this.totalPerSecond[i] || 0
          errorSum += this.errorsPerSecond[i] || 0
        }

        const wpmNow = Math.round((correctSum / windowSize / 5) * 60)
        const rawNow = Math.round((totalSum / windowSize / 5) * 60)

        if (correctSum > 0 || totalSum > 0) {
          this.wpmHistory.push(wpmNow)
          this.rawHistory.push(rawNow)
          this.errorsHistory.push(errorSum)

          const burstNow = Math.max(...this.wpmHistory.slice(-windowSize))
          this.burstHistory.push(burstNow)
          if (burstNow > this.burstWpm) this.burstWpm = burstNow
        }

        this.timeLeft--
        if (this.timeLeft <= 0) {
          this.endTest()
        }
      }, 1000)
    },

    async endTest() {
      if (this.isEnding) return
      this.isEnding = true

      this.testEndTime = Date.now()

      if (this.timerInterval) {
        clearInterval(this.timerInterval)
        this.timerInterval = null
      }

      this.isTestActive = false

      // Собираем статистику ДО async
      const stats = { ...this.finalStats }

      // Сохраняем результат
      const authStore = useAuthStore()
      if (authStore.isAuthenticated && this.startTime) {
        try {
          await apiService.saveTestResult({
            wpm: stats.wpm,
            raw_wpm: stats.rawWpm,
            accuracy: stats.accuracy,
            burst_wpm: stats.burstWpm,
            total_errors: stats.totalErrors,
            time_mode: this.selectedTime,
            test_duration: this.selectedTime,
            consistency: stats.consistency,
            difficulty: this.testDifficulty,
          })
          console.log('Test result saved successfully')
        } catch (error) {
          console.error('Failed to save test result:', error)
        }
      }
    },

    processInput(newValue: string) {
      if (this.isEnding) return
      if (!this.isTestActive && this.testEndTime !== null) return

      const oldLength = this.inputValue.length
      const sec = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0
      const currentWord = this.words[this.currentWordIndex]

      if (!currentWord) return

      // Ограничение длины ввода
      if (
        newValue.length > currentWord.length + this.maxExtraChars &&
        newValue.length > oldLength &&
        !newValue.endsWith(' ')
      ) {
        return
      }

      if (newValue.endsWith(' ')) {
        const typedWord = this.inputValue.trim()

        this.wordHistory[this.currentWordIndex] = []
        const now = Date.now()

        // Burst WPM
        if (this.wordStartTime) {
          const wordTimeMin = (now - this.wordStartTime) / 60000
          if (wordTimeMin > 0) {
            const burstNow = Math.round(typedWord.length / 5 / wordTimeMin)
            if (burstNow > this.burstWpm) this.burstWpm = burstNow
          }
        }
        this.wordStartTime = now

        // Пробел как 1 символ (корректный, разделитель)
        this.totalChars++
        this.totalPerSecond[sec] = (this.totalPerSecond[sec] || 0) + 1
        this.correctChars++
        this.correctPerSecond[sec] = (this.correctPerSecond[sec] || 0) + 1

        // Посимвольное сравнение слова — только запись в историю
        // Символы уже были подсчитаны при вводе (в else-ветке ниже)
        for (let i = 0; i < Math.max(typedWord.length, currentWord.length); i++) {
          if (i < typedWord.length && i < currentWord.length && typedWord[i] === currentWord[i]) {
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
        const currentCharIdx = newValue.length - 1

        if (newValue.length > oldLength) {
          // Добавлен символ
          this.totalChars++
          this.totalPerSecond[sec] = (this.totalPerSecond[sec] || 0) + 1

          if (
            currentCharIdx < currentWord.length &&
            newValue[currentCharIdx] === currentWord[currentCharIdx]
          ) {
            this.correctChars++
            this.correctPerSecond[sec] = (this.correctPerSecond[sec] || 0) + 1
          } else {
            // Ошибка зафиксирована навсегда
            this.currentErrors++
            this.totalErrors++
            this.errorsPerSecond[sec] = (this.errorsPerSecond[sec] || 0) + 1
            this.errorTimestamps.push(sec)
          }
        } else if (newValue.length < oldLength) {
          // Backspace — уменьшаем totalChars/correctChars для корректного WPM
          // НО totalErrors НЕ уменьшаем
          if (this.totalChars > 0) {
            this.totalChars--
            this.totalPerSecond[sec] = Math.max((this.totalPerSecond[sec] || 1) - 1, 0)
          }

          const deletedCharIdx = oldLength - 1
          if (
            deletedCharIdx < currentWord.length &&
            this.inputValue[deletedCharIdx] === currentWord[deletedCharIdx]
          ) {
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
