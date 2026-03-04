<script setup lang="ts">
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTheme } from '@/composables/useTheme'
import { useControlStore } from '@/stores/control'
import { computed, ref, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import { Alert } from '@/components/ui/alert'
import { Clock5, Languages } from 'lucide-vue-next'

// Stores
const control = useControlStore()
const { selectedTime, selectedDifficulty } = storeToRefs(control)

// Theme
const { isDark } = useTheme()

// Опции времени
const timeOptions = [15, 30, 60, 120]

// Опции сложности
const difficultyOptions = [
  { value: 'normal', label: 'Обычная' },
  { value: 'high', label: 'Якутская' },
]

// Тип всегда "Время"
const currentType = ref<'Время'>('Время')

// Значение времени для ToggleGroup
const currentValue = computed<string>({
  get: () => String(selectedTime.value),
  set: (value: string) => {
    const num = Number(value)
    if (!isNaN(num)) control.setTime(num)
  },
})

// Значение сложности для ToggleGroup
const currentDifficulty = computed<string>({
  get: () => selectedDifficulty.value,
  set: (value: string) => {
    if (value === 'normal' || value === 'high') {
      control.setDifficulty(value)
    }
  },
})

// Чтобы выделение "Время" всегда было
const forceHighlight = ref(true)
watchEffect(() => {
  forceHighlight.value = true
})
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
    <!-- Difficulty selector -->
    <Alert class="flex items-center gap-1 sm:gap-2 p-1 px-2 sm:px-3">
      <ToggleGroup type="single" v-model="currentDifficulty" class="flex gap-1">
        <ToggleGroupItem
          v-for="opt in difficultyOptions"
          :key="opt.value"
          :value="opt.value"
          :class="[
            'px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all select-none cursor-pointer',
            isDark
              ? 'data-[state=on]:bg-[#2a2a2a] data-[state=on]:text-white text-neutral-500 hover:bg-[#1a1a1a]'
              : 'data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 text-neutral-500 hover:bg-gray-100',
          ]"
        >
          <Languages v-if="opt.value === 'high'" :size="14" class="mr-1 hidden sm:inline-block" />
          {{ opt.label }}
        </ToggleGroupItem>
      </ToggleGroup>
    </Alert>

    <!-- Time selector -->
    <Alert class="flex items-center gap-1 sm:gap-2 p-1 px-2 sm:px-3">
      <!-- Тип выбора -->
      <ToggleGroup type="single" v-model="currentType" class="flex gap-1">
        <ToggleGroupItem
          value="Время"
          :data-state="forceHighlight ? 'on' : 'off'"
          class="select-none cursor-pointer px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all dark:data-[state=on]:bg-[#2a2a2a] dark:data-[state=on]:text-white data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 text-neutral-500 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
        >
          <Clock5 :size="14" class="mr-1 hidden sm:inline-block" />Время
        </ToggleGroupItem>
      </ToggleGroup>

      <span class="text-neutral-500 select-none">|</span>

      <!-- Опции времени -->
      <ToggleGroup type="single" v-model="currentValue" class="flex gap-1">
        <ToggleGroupItem
          v-for="opt in timeOptions"
          :key="opt"
          :value="String(opt)"
          :aria-label="opt"
          :class="[
            'px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all select-none cursor-pointer',
            isDark
              ? 'data-[state=on]:bg-[#2a2a2a] data-[state=on]:text-white text-neutral-500 hover:bg-[#1a1a1a]'
              : 'data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 text-neutral-500 hover:bg-gray-100',
          ]"
        >
          {{ opt }}
        </ToggleGroupItem>
      </ToggleGroup>
    </Alert>
  </div>
</template>
