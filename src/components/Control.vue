<script setup lang="ts">
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTheme } from '@/composables/useTheme'
import { useControlStore } from '@/stores/control'
import { computed, ref, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import { Alert } from '@/components/ui/alert'
import { Clock5 } from 'lucide-vue-next'

// Stores
const control = useControlStore()
const { selectedTime } = storeToRefs(control)

// Theme
const { isDark } = useTheme()

// Опции времени
const timeOptions = [15, 30, 60, 120]

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

// Чтобы выделение "Время" всегда было
const forceHighlight = ref(true)
watchEffect(() => {
  forceHighlight.value = true
})
</script>

<template>
  <div class="flex items-center">
    <Alert class="flex items-center gap-2 p-1 px-3">
      <!-- Тип выбора -->
      <ToggleGroup type="single" v-model="currentType" class="flex gap-1">
        <ToggleGroupItem
          value="Время"
          :data-state="forceHighlight ? 'on' : 'off'"
          class="select-none cursor-pointer px-3 rounded-lg text-sm font-medium transition-all dark:data-[state=on]:bg-[#2a2a2a] dark:data-[state=on]:text-white data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
        >
          <Clock5 :size="16" />Время
        </ToggleGroupItem>
      </ToggleGroup>

      <span class="text-gray-500 select-none">|</span>

      <!-- Опции времени -->
      <ToggleGroup type="single" v-model="currentValue" class="flex gap-1">
        <ToggleGroupItem
          v-for="opt in timeOptions"
          :key="opt"
          :value="String(opt)"
          :aria-label="opt"
          :class="[
            'px-3 rounded-lg text-sm font-medium transition-all select-none cursor-pointer',
            isDark
              ? 'data-[state=on]:bg-[#2a2a2a] data-[state=on]:text-white text-gray-500 hover:bg-[#1a1a1a]'
              : 'data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 text-gray-500 hover:bg-gray-100',
          ]"
        >
          {{ opt }}
        </ToggleGroupItem>
      </ToggleGroup>
    </Alert>
  </div>
</template>
