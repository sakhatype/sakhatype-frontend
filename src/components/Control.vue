<script setup lang="ts">
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTheme } from '@/composables/useTheme'
import { useControlStore } from '@/stores/control'
import { computed, ref, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import { Alert } from '@/components/ui/alert'
import { Clock5 } from 'lucide-vue-next'

const control = useControlStore()
const { selectedTime, selectedDifficulty } = storeToRefs(control)
const { isDark } = useTheme()

const timeOptions = [15, 30, 60, 120]
const currentType = ref<'Время'>('Время')

const currentValue = computed<string>({
  get: () => String(selectedTime.value),
  set: (v: string) => { const n = Number(v); if (!isNaN(n)) control.setTime(n) },
})

const currentDiff = computed<string>({
  get: () => selectedDifficulty.value,
  set: (v: string) => { if (v === 'normal' || v === 'high') control.setDifficulty(v) },
})

const forceHighlight = ref(true)
watchEffect(() => { forceHighlight.value = true })

const itemClass = computed(() => [
  'px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all select-none cursor-pointer',
  isDark.value
    ? 'data-[state=on]:bg-[#2a2a2a] data-[state=on]:text-white text-neutral-500 hover:bg-[#1a1a1a]'
    : 'data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 text-neutral-500 hover:bg-gray-100',
])
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center gap-2">
    <!-- Difficulty -->
    <Alert class="flex items-center gap-1 p-1 px-2 sm:px-3">
      <ToggleGroup type="single" v-model="currentDiff" class="flex gap-1">
        <ToggleGroupItem value="normal" :class="itemClass">Обычная</ToggleGroupItem>
        <ToggleGroupItem value="high" :class="itemClass">Якутская</ToggleGroupItem>
      </ToggleGroup>
    </Alert>

    <!-- Time -->
    <Alert class="flex items-center gap-1 p-1 px-2 sm:px-3">
      <ToggleGroup type="single" v-model="currentType" class="flex gap-1">
        <ToggleGroupItem value="Время" :data-state="forceHighlight ? 'on' : 'off'" class="select-none cursor-pointer px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all dark:data-[state=on]:bg-[#2a2a2a] dark:data-[state=on]:text-white data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 text-neutral-500 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]">
          <Clock5 :size="14" class="mr-0.5" />Время
        </ToggleGroupItem>
      </ToggleGroup>
      <span class="text-neutral-500 select-none">|</span>
      <ToggleGroup type="single" v-model="currentValue" class="flex gap-1">
        <ToggleGroupItem v-for="opt in timeOptions" :key="opt" :value="String(opt)" :class="itemClass">{{ opt }}</ToggleGroupItem>
      </ToggleGroup>
    </Alert>
  </div>
</template>
