// stores/typingStore.js
import { defineStore } from 'pinia'

export const useTypingStore = defineStore('typing', {
  state: () => ({
    texts: [
      'мир место друг путь слёзы страна тень море глаз глаз вода ночь место вода они память женщина камень. слово мама дом слёзы река дорога сон время время день сердце слёзы, свет солнце мама смех взгляд земля работа сердце земля город год сила человек камень мы море человек солнце мысль мама.',
      'Якутия - удивительный край вечной мерзлоты и белых ночей. Здесь живут сильные и добрые люди, которые любят свою землю.',
      'Саха сирэ айыл5а кыра туймаада. Бу олох уонна дойду сайдыытын туһунан. Биһиги атыыбыт дойдубуту таптыыбыт.',
      'Программирование открывает безграничные возможности для творчества и инноваций. Каждая строка кода может изменить мир к лучшему.',
      'Северное сияние танцует в небе озаряя бескрайние просторы тайги и тундры. Это магическое явление природы завораживает своей красотой.',
    ],
    currentText: '',
    words: [],
    currentWordIndex: 0,
    currentCharIndex: 0,
    startTime: null,
    wordStartTime: null,
    selectedTime: 15,
    timeLeft: 15,
    isTestActive: false,
    correctChars: 0,
    totalChars: 0,
    totalErrors: 0,
    currentErrors: 0,
    inputValue: '',
    wordHistory: [],
    wpmHistory: [],
    rawHistory: [],
    burstHistory: [],
    errorsHistory: [],
    correctPerSecond: {},
    totalPerSecond: {},
    errorsPerSecond: {},
    burstWpm: 0,
    errorTimestamps: [],
    timerInterval: null,
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
      // Учитываем, что пробелы тоже считаются символами
      return state.totalChars > 0 ? Math.round((state.correctChars / state.totalChars) * 100) : 100
    },

    finalStats: (state) => {
      const elapsedMinutes =
        state.startTime && !state.isTestActive
          ? (Date.now() - state.startTime) / 60000
          : state.selectedTime / 60

      const wordsTyped = state.correctChars / 5
      const wpm = Math.round(wordsTyped / elapsedMinutes) || 0
      const rawWpm = Math.round(state.totalChars / 5 / elapsedMinutes) || 0
      const accuracy =
        state.totalChars > 0 ? Math.round((state.correctChars / state.totalChars) * 100) : 100

      return {
        wpm,
        rawWpm,
        accuracy,
        burstWpm: state.burstWpm,
        totalErrors: state.totalErrors,
      }
    },
  },

  actions: {
    initTest() {
      this.currentText = this.texts[Math.floor(Math.random() * this.texts.length)]
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

      if (this.timerInterval) {
        clearInterval(this.timerInterval)
        this.timerInterval = null
      }
    },

    startTimer() {
      if (this.isTestActive) return
      this.isTestActive = true
      this.startTime = Date.now()
      this.wordStartTime = Date.now()

      // Инициализация пустых массивов без начальных нулей
      this.wpmHistory = []
      this.rawHistory = []
      this.errorsHistory = []
      this.burstHistory = []

      this.timerInterval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000)

        const windowSize = Math.min(3, elapsedSeconds + 1) // Уменьшаем окно для первых секунд
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

        // Добавляем данные только если есть ненулевые значения
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

    endTest() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval)
        this.timerInterval = null
      }
      this.isTestActive = false
    },

    processInput(newValue) {
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

        // Учитываем пробел как символ
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
          this.currentText = this.texts[Math.floor(Math.random() * this.texts.length)]
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

          // Проверяем, был ли удаленный символ правильным
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
              // Удаляем последний timestamp ошибки, если он соответствует текущей секунде
              if (this.errorTimestamps[this.errorTimestamps.length - 1] === sec) {
                this.errorTimestamps.pop()
              }
            }
          }
        }

        this.inputValue = newValue
      }
    },

    setTime(time) {
      this.selectedTime = time
      this.timeLeft = time
    },
  },
})
