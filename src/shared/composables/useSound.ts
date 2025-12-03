import { ref, watch } from 'vue'

// Sound URLs - пользователь добавит их позже
export const SOUND_URLS = {
  keypress: '/sounds/keypress.mp3',
  correct: '/sounds/correct.mp3',
  incorrect: '/sounds/incorrect.mp3',
  complete: '/sounds/complete.mp3',
}

const soundEnabled = ref(loadSoundPreference())

function loadSoundPreference(): boolean {
  const saved = localStorage.getItem('soundEnabled')
  return saved !== 'false' // По умолчанию включен
}

watch(soundEnabled, (newVal) => {
  localStorage.setItem('soundEnabled', String(newVal))
})

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map()

  constructor() {
    // Предзагрузка звуков
    Object.entries(SOUND_URLS).forEach(([key, url]) => {
      const audio = new Audio(url)
      audio.preload = 'auto'
      // Игнорируем ошибки загрузки (пока файлов нет)
      audio.addEventListener('error', () => {
        console.warn(`Sound file not found: ${url}`)
      })
      this.sounds.set(key, audio)
    })
  }

  play(soundKey: keyof typeof SOUND_URLS) {
    if (!soundEnabled.value) return

    const sound = this.sounds.get(soundKey)
    if (sound) {
      // Клонируем для возможности одновременного воспроизведения
      const clone = sound.cloneNode() as HTMLAudioElement
      clone.volume = 0.5
      clone.play().catch(() => {
        // Игнорируем ошибки воспроизведения
      })
    }
  }
}

const soundManager = new SoundManager()

export function useSound() {
  const toggleSound = () => {
    soundEnabled.value = !soundEnabled.value
  }

  const playKeypress = () => soundManager.play('keypress')
  const playCorrect = () => soundManager.play('correct')
  const playIncorrect = () => soundManager.play('incorrect')
  const playComplete = () => soundManager.play('complete')

  return {
    soundEnabled,
    toggleSound,
    playKeypress,
    playCorrect,
    playIncorrect,
    playComplete,
  }
}
