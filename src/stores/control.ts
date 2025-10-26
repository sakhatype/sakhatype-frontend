import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useControlStore = defineStore('control', () => {
  const selectedTime = ref(Number(localStorage.getItem('selectedTime')) || 30)

  watch(selectedTime, (newValue) => {
    localStorage.setItem('selectedTime', newValue.toString())
  })

  function setTime(value: number) {
    selectedTime.value = value
  }

  return { selectedTime, setTime }
})
