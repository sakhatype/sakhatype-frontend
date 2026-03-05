import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useControlStore = defineStore('control', () => {
  const selectedTime = ref(Number(localStorage.getItem('selectedTime')) || 30)
  const selectedDifficulty = ref<'normal' | 'high'>(
    (localStorage.getItem('selectedDifficulty') as 'normal' | 'high') || 'normal'
  )

  watch(selectedTime, (v) => localStorage.setItem('selectedTime', v.toString()))
  watch(selectedDifficulty, (v) => localStorage.setItem('selectedDifficulty', v))

  function setTime(value: number) {
    selectedTime.value = value
  }

  function setDifficulty(value: 'normal' | 'high') {
    selectedDifficulty.value = value
  }

  return { selectedTime, selectedDifficulty, setTime, setDifficulty }
})
