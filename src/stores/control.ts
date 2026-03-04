import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useControlStore = defineStore('control', () => {
  const selectedTime = ref(Number(localStorage.getItem('selectedTime')) || 30)
  const selectedDifficulty = ref<'normal' | 'high'>(
    (localStorage.getItem('selectedDifficulty') as 'normal' | 'high') || 'normal'
  )

  watch(selectedTime, (newValue) => {
    localStorage.setItem('selectedTime', newValue.toString())
  })

  watch(selectedDifficulty, (newValue) => {
    localStorage.setItem('selectedDifficulty', newValue)
  })

  function setTime(value: number) {
    selectedTime.value = value
  }

  function setDifficulty(value: 'normal' | 'high') {
    selectedDifficulty.value = value
  }

  return { selectedTime, selectedDifficulty, setTime, setDifficulty }
})
