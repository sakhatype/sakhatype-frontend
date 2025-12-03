import { defineStore } from 'pinia'
import { apiService } from '@/services/api'
import { useAuthStore } from './auth'

export const useTypingStore = defineStore('typing', {
  state: () => ({
    serverWords: [] as string[], // Слова с сервера
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
    isEnding: false, // Флаг для предотвращения повторного завершения
    testEndTime: null as number | null, // Время завершения теста
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
      // Используем сохранённое время завершения или текущее время
      const endTime = state.testEndTime || Date.now()
      const elapsedMinutes = state.startTime
        ? (endTime - state.startTime) / 60000
        : state.selectedTime / 60

      const wordsTyped = state.correctChars / 5
      const wpm = elapsedMinutes > 0 ? Math.round(wordsTyped / elapsedMinutes) : 0
      const rawWpm = elapsedMinutes > 0 ? Math.round(state.totalChars / 5 / elapsedMinutes) : 0
      const accuracy =
        state.totalChars > 0 ? Math.round((state.correctChars / state.totalChars) * 100) : 100

      // Расчет консистентности (насколько стабильно печатает пользователь)
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
      try {
        const words = await apiService.getWords(200)
        this.serverWords = words
      } catch (error) {
        console.error('Failed to load words from server:', error)
        // Fallback к локальным словам если не удалось загрузить с сервера
        this.serverWords = [
          'саха',
          'дойду',
          'киһи',
          'сир',
          'ыал',
          'олох',
          'үлэ',
          'кыра',
          'улахан',
          'мир',
          'человек',
          'дом',
          'земля',
          'вода',
        ]
      }
    },

    generateText() {
      if (this.serverWords.length === 0) {
        // Используем fallback слова
        this.serverWords = [
          'саха',
          'дойду',
          'киһи',
          'сир',
          'ыал',
          'олох',
          'үлэ',
          'кыра',
          'улахан',
          'мир',
          'человек',
          'дом',
        ]
      }

      // Генерируем случайный текст из 80-100 слов
      const wordCount = 80 + Math.floor(Math.random() * 20)
      const selectedWords = []
      for (let i = 0; i < wordCount; i++) {
        const randomIndex = Math.floor(Math.random() * this.serverWords.length)
        selectedWords.push(this.serverWords[randomIndex])
      }
      return selectedWords.join(' ')
    },

    async initTest() {
      // Сначала останавливаем таймер если он есть
      if (this.timerInterval) {
        clearInterval(this.timerInterval)
        this.timerInterval = null
      }
      
      // Сбрасываем флаги
      this.isEnding = false
      this.testEndTime = null
      
      // Загружаем слова с сервера если еще не загружены
      if (this.serverWords.length === 0) {
        await this.loadWords()
      }

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
        // Проверяем, не завершается ли уже тест
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
      // Предотвращаем повторное завершение
      if (this.isEnding) return
      this.isEnding = true
      
      // Сохраняем время завершения ДО остановки таймера
      this.testEndTime = Date.now()
      
      // Немедленно останавливаем таймер
      if (this.timerInterval) {
        clearInterval(this.timerInterval)
        this.timerInterval = null
      }
      
      this.isTestActive = false

      // Собираем финальную статистику ДО асинхронной операции
      const stats = { ...this.finalStats }

      // Сохраняем результаты на сервер если пользователь авторизован
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
          })
          console.log('Test result saved successfully')
        } catch (error) {
          console.error('Failed to save test result:', error)
        }
      }
    },

    processInput(newValue: string) {
      // Не обрабатываем ввод если тест завершается или уже завершён
      if (this.isEnding) {
        return
      }
      
      // Если тест не активен и уже был начат - не обрабатываем
      if (!this.isTestActive && this.testEndTime !== null) {
        return
      }
      
      const oldLength = this.inputValue.length
      const sec = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0

      if (newValue.endsWith(' ')) {
        const typedWord = this.inputValue.trim()
        const currentWord = this.words[this.currentWordIndex]

        this.wordHistory[this.currentWordIndex] = []
        const now = Date.now()

        if (this.wordStartTime) {
          const wordTimeMin = (now - this.wordStartTime) / 60000
          const burstNow = Math.round(typedWord.length / 5 / wordTimeMin)
          if (burstNow > this.burstWpm) this.burstWpm = burstNow
        }
        this.wordStartTime = now

        this.totalChars++
        this.totalPerSecond[sec] = (this.totalPerSecond[sec] || 0) + 1
        this.correctChars++
        this.correctPerSecond[sec] = (this.correctPerSecond[sec] || 0) + 1

        for (let i = 0; i < Math.max(typedWord.length, currentWord.length); i++) {
          this.totalChars++
          this.totalPerSecond[sec] = (this.totalPerSecond[sec] || 0) + 1

          if (i < typedWord.length && i < currentWord.length && typedWord[i] === currentWord[i]) {
            this.correctChars++
            this.correctPerSecond[sec] = (this.correctPerSecond[sec] || 0) + 1
            this.wordHistory[this.currentWordIndex][i] = 'correct'
          } else {
            this.wordHistory[this.currentWordIndex][i] = 'incorrect'
            this.currentErrors++
            this.totalErrors++
            this.errorsPerSecond[sec] = (this.errorsPerSecond[sec] || 0) + 1
            this.errorTimestamps.push(sec)
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
        const currentWord = this.words[this.currentWordIndex]
        const currentCharIdx = newValue.length - 1

        if (newValue.length > oldLength) {
          this.totalChars++
          this.totalPerSecond[sec] = (this.totalPerSecond[sec] || 0) + 1

          if (
            currentCharIdx < currentWord.length &&
            newValue[currentCharIdx] === currentWord[currentCharIdx]
          ) {
            this.correctChars++
            this.correctPerSecond[sec] = (this.correctPerSecond[sec] || 0) + 1
          } else {
            this.currentErrors++
            this.totalErrors++
            this.errorsPerSecond[sec] = (this.errorsPerSecond[sec] || 0) + 1
            this.errorTimestamps.push(sec)
          }
        } else if (newValue.length < oldLength) {
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
          } else {
            if (this.currentErrors > 0) {
              this.currentErrors--
              this.totalErrors = Math.max(this.totalErrors - 1, 0)
              this.errorsPerSecond[sec] = Math.max((this.errorsPerSecond[sec] || 1) - 1, 0)
              if (this.errorTimestamps[this.errorTimestamps.length - 1] === sec) {
                this.errorTimestamps.pop()
              }
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