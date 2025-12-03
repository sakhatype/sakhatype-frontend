<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { RotateCcw, Zap, Target, Gauge, AlertTriangle } from 'lucide-vue-next'
import { Card, CardContent } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'

const props = defineProps<{
  stats: {
    wpm: number
    rawWpm: number
    accuracy: number
    burstWpm: number
    totalErrors: number
    consistency: number
    testDuration: number
  }
  wpmHistory: number[]
  rawHistory: number[]
  burstHistory: number[]
  errorTimestamps: number[]
}>()

const emit = defineEmits(['restart'])
const { isDark } = useTheme()

// Ключ для принудительного перерендера графика
const chartKey = ref(0)
const chartReady = ref(false)

// Tooltip данные
const tooltipData = ref<{
  visible: boolean
  x: number
  y: number
  second: number
  wpm: number
  raw: number
  burst: number
  errors: number
}>({
  visible: false,
  x: 0,
  y: 0,
  second: 0,
  wpm: 0,
  raw: 0,
  burst: 0,
  errors: 0
})

// Подсчёт ошибок по секундам
const errorsPerSecond = computed(() => {
  const errors: Record<number, number> = {}
  if (props.errorTimestamps) {
    props.errorTimestamps.forEach(sec => {
      errors[sec] = (errors[sec] || 0) + 1
    })
  }
  return errors
})

// Кумулятивные ошибки
const cumulativeErrors = computed(() => {
  const result: number[] = []
  let total = 0
  const len = props.wpmHistory?.length || 0
  for (let i = 0; i < len; i++) {
    total += errorsPerSecond.value[i + 1] || 0
    result.push(total)
  }
  return result
})

// Данные для графика
const chartData = computed(() => {
  if (!props.wpmHistory || props.wpmHistory.length === 0) {
    return []
  }
  
  return props.wpmHistory.map((wpm, index) => ({
    second: index + 1,
    wpm: wpm || 0,
    raw: props.rawHistory?.[index] || 0,
    burst: props.burstHistory?.[index] || 0,
    errors: cumulativeErrors.value[index] || 0,
    hasError: (errorsPerSecond.value[index + 1] || 0) > 0
  }))
})

// SVG размеры
const svgWidth = 800
const svgHeight = 300
const padding = { top: 30, right: 60, bottom: 50, left: 60 }
const chartWidth = svgWidth - padding.left - padding.right
const chartHeight = svgHeight - padding.top - padding.bottom

// Максимальные значения
const maxWpmValue = computed(() => {
  if (chartData.value.length === 0) return 100
  const allValues = chartData.value.flatMap(d => [d.wpm, d.raw, d.burst])
  return Math.max(...allValues, 50) * 1.1
})

const maxErrorsValue = computed(() => {
  if (cumulativeErrors.value.length === 0) return 10
  const max = Math.max(...cumulativeErrors.value, 1)
  return Math.ceil(max * 1.2)
})

// Цвета
const colors = computed(() => ({
  wpm: isDark.value ? 'rgba(156, 163, 175, 0.8)' : 'rgba(107, 114, 128, 0.8)',
  wpmFill: isDark.value ? 'rgba(156, 163, 175, 0.2)' : 'rgba(107, 114, 128, 0.2)',
  raw: isDark.value ? 'rgba(107, 114, 128, 0.6)' : 'rgba(156, 163, 175, 0.6)',
  burst: 'rgba(34, 211, 238, 0.5)',
  burstFill: 'rgba(34, 211, 238, 0.1)',
  errors: '#ef4444',
  grid: isDark.value ? '#374151' : '#e5e7eb',
  text: isDark.value ? '#9ca3af' : '#6b7280',
}))

// Функции для преобразования координат
const xScale = (index: number) => {
  const length = chartData.value.length || 1
  return padding.left + (index / Math.max(length - 1, 1)) * chartWidth
}

const yScaleWpm = (value: number) => {
  return padding.top + chartHeight - (value / maxWpmValue.value) * chartHeight
}

const yScaleErrors = (value: number) => {
  return padding.top + chartHeight - (value / maxErrorsValue.value) * chartHeight
}

// Генерация путей для линий
const wpmPath = computed(() => {
  if (chartData.value.length === 0) return ''
  return chartData.value.map((d, i) => 
    `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScaleWpm(d.wpm)}`
  ).join(' ')
})

const wpmAreaPath = computed(() => {
  if (chartData.value.length === 0) return ''
  const linePath = chartData.value.map((d, i) => 
    `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScaleWpm(d.wpm)}`
  ).join(' ')
  return `${linePath} L ${xScale(chartData.value.length - 1)} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`
})

const rawPath = computed(() => {
  if (chartData.value.length === 0) return ''
  return chartData.value.map((d, i) => 
    `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScaleWpm(d.raw)}`
  ).join(' ')
})

const burstPath = computed(() => {
  if (chartData.value.length === 0) return ''
  return chartData.value.map((d, i) => 
    `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScaleWpm(d.burst)}`
  ).join(' ')
})

const burstAreaPath = computed(() => {
  if (chartData.value.length === 0) return ''
  const linePath = chartData.value.map((d, i) => 
    `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScaleWpm(d.burst)}`
  ).join(' ')
  return `${linePath} L ${xScale(chartData.value.length - 1)} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`
})

// Точки ошибок
const errorPoints = computed(() => {
  return chartData.value
    .map((d, i) => ({
      x: xScale(i),
      y: yScaleErrors(d.errors),
      errors: errorsPerSecond.value[d.second] || 0,
      cumulative: d.errors,
      second: d.second,
      index: i
    }))
    .filter(p => p.errors > 0)
})

// Оси Y
const yAxisWpmTicks = computed(() => {
  const ticks = []
  const step = Math.ceil(maxWpmValue.value / 5 / 50) * 50 || 50
  for (let i = 0; i <= maxWpmValue.value; i += step) {
    ticks.push(i)
  }
  return ticks
})

const yAxisErrorsTicks = computed(() => {
  const ticks = []
  const max = maxErrorsValue.value
  const step = Math.max(1, Math.ceil(max / 5))
  for (let i = 0; i <= max; i += step) {
    ticks.push(Math.round(i))
  }
  return ticks
})

// Ось X
const xAxisTicks = computed(() => {
  const length = chartData.value.length
  if (length === 0) return []
  if (length <= 15) {
    return chartData.value.map(d => d.second)
  }
  const step = Math.ceil(length / 10)
  return chartData.value.filter((_, i) => i % step === 0).map(d => d.second)
})

// Обработка hover
const chartContainer = ref<HTMLDivElement | null>(null)

const handleMouseMove = (event: MouseEvent) => {
  if (!chartContainer.value || chartData.value.length === 0) return
  
  const rect = chartContainer.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const svgRect = chartContainer.value.querySelector('svg')?.getBoundingClientRect()
  if (!svgRect) return
  
  const scaleX = svgWidth / svgRect.width
  const scaledMouseX = mouseX * scaleX
  
  const relativeX = scaledMouseX - padding.left
  const index = Math.round((relativeX / chartWidth) * (chartData.value.length - 1))
  
  if (index >= 0 && index < chartData.value.length) {
    const data = chartData.value[index]
    if (data) {
      tooltipData.value = {
        visible: true,
        x: xScale(index),
        y: 80,
        second: data.second,
        wpm: data.wpm,
        raw: data.raw,
        burst: data.burst,
        errors: data.errors
      }
    }
  }
}

const handleMouseLeave = () => {
  tooltipData.value.visible = false
}

// Следим за изменением данных и перерендериваем график
watch(
  () => [props.wpmHistory, props.rawHistory, props.burstHistory, props.errorTimestamps],
  async () => {
    chartReady.value = false
    await nextTick()
    chartKey.value++
    await nextTick()
    chartReady.value = true
  },
  { deep: true }
)

onMounted(async () => {
  await nextTick()
  chartKey.value++
  chartReady.value = true
})

const restart = () => {
  emit('restart')
}
</script>

<template>
  <div class="w-full max-w-4xl mx-auto animate-fadeIn">
    <!-- Статистика - 4 карточки -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <!-- WPM -->
      <Card>
        <CardContent class="p-4 text-center">
          <div class="flex items-center justify-center gap-2 mb-2">
            <Zap :size="18" class="text-yellow-500" />
            <span :class="['text-sm', isDark ? 'text-gray-400' : 'text-neutral-600']">WPM</span>
          </div>
          <div :class="['text-3xl font-bold', isDark ? 'text-white' : 'text-gray-900']">
            {{ stats.wpm }}
          </div>
        </CardContent>
      </Card>

      <!-- Точность -->
      <Card>
        <CardContent class="p-4 text-center">
          <div class="flex items-center justify-center gap-2 mb-2">
            <Target :size="18" class="text-green-500" />
            <span :class="['text-sm', isDark ? 'text-gray-400' : 'text-neutral-600']">Точность</span>
          </div>
          <div :class="['text-3xl font-bold', isDark ? 'text-white' : 'text-gray-900']">
            {{ stats.accuracy }}%
          </div>
        </CardContent>
      </Card>

      <!-- Raw WPM -->
      <Card>
        <CardContent class="p-4 text-center">
          <div class="flex items-center justify-center gap-2 mb-2">
            <Gauge :size="18" class="text-blue-500" />
            <span :class="['text-sm', isDark ? 'text-gray-400' : 'text-neutral-600']">Raw</span>
          </div>
          <div :class="['text-3xl font-bold', isDark ? 'text-white' : 'text-gray-900']">
            {{ stats.rawWpm }}
          </div>
        </CardContent>
      </Card>

      <!-- Ошибки -->
      <Card>
        <CardContent class="p-4 text-center">
          <div class="flex items-center justify-center gap-2 mb-2">
            <AlertTriangle :size="18" class="text-red-500" />
            <span :class="['text-sm', isDark ? 'text-gray-400' : 'text-neutral-600']">Ошибки</span>
          </div>
          <div :class="['text-3xl font-bold', isDark ? 'text-white' : 'text-gray-900']">
            {{ stats.totalErrors }}
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- График -->
    <Card class="mb-8">
      <CardContent class="p-4">
        <!-- Легенда -->
        <div class="flex flex-wrap items-center justify-center gap-6 mb-4">
          <div class="flex items-center gap-2">
            <div class="w-6 h-3 bg-gray-400 rounded opacity-50"></div>
            <span :class="['text-sm', isDark ? 'text-gray-400' : 'text-neutral-600']">wpm</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-6 h-0.5 border-t-2 border-dashed border-gray-500"></div>
            <span :class="['text-sm', isDark ? 'text-gray-400' : 'text-neutral-600']">raw</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-6 h-3 bg-cyan-400 rounded opacity-30 border border-cyan-400"></div>
            <span :class="['text-sm', isDark ? 'text-gray-400' : 'text-neutral-600']">burst</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-red-500 rounded-full"></div>
            <span :class="['text-sm', isDark ? 'text-gray-400' : 'text-neutral-600']">Ошибки</span>
          </div>
        </div>

        <!-- SVG График -->
        <div 
          ref="chartContainer"
          :key="chartKey"
          class="relative w-full overflow-x-auto"
          @mousemove="handleMouseMove"
          @mouseleave="handleMouseLeave"
        >
          <template v-if="chartData.length > 0 && chartReady">
            <svg
              :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
              class="w-full h-auto"
              preserveAspectRatio="xMidYMid meet"
            >
              <!-- Сетка -->
              <g class="grid">
                <line
                  v-for="tick in yAxisWpmTicks"
                  :key="`h-${tick}`"
                  :x1="padding.left"
                  :y1="yScaleWpm(tick)"
                  :x2="svgWidth - padding.right"
                  :y2="yScaleWpm(tick)"
                  :stroke="colors.grid"
                  stroke-width="1"
                />
              </g>

              <!-- Ось Y слева (WPM) -->
              <g class="y-axis-left">
                <text
                  :x="15"
                  :y="svgHeight / 2"
                  :fill="colors.text"
                  font-size="11"
                  text-anchor="middle"
                  transform="rotate(-90, 15, 150)"
                >
                  Скорость набора (слов/мин.)
                </text>
                <text
                  v-for="tick in yAxisWpmTicks"
                  :key="`y-${tick}`"
                  :x="padding.left - 10"
                  :y="yScaleWpm(tick) + 4"
                  :fill="colors.text"
                  font-size="11"
                  text-anchor="end"
                >
                  {{ tick }}
                </text>
              </g>

              <!-- Ось Y справа (Ошибки) -->
              <g class="y-axis-right">
                <text
                  :x="svgWidth - 15"
                  :y="svgHeight / 2"
                  fill="#ef4444"
                  font-size="11"
                  text-anchor="middle"
                  transform="rotate(90, 785, 150)"
                >
                  Количество ошибок
                </text>
                <text
                  v-for="tick in yAxisErrorsTicks"
                  :key="`yr-${tick}`"
                  :x="svgWidth - padding.right + 10"
                  :y="yScaleErrors(tick) + 4"
                  fill="#ef4444"
                  font-size="11"
                  text-anchor="start"
                >
                  {{ tick }}
                </text>
              </g>

              <!-- Ось X -->
              <g class="x-axis">
                <text
                  :x="svgWidth / 2"
                  :y="svgHeight - 10"
                  :fill="colors.text"
                  font-size="12"
                  text-anchor="middle"
                >
                  Время (секунды)
                </text>
                <text
                  v-for="tick in xAxisTicks"
                  :key="`x-${tick}`"
                  :x="xScale(tick - 1)"
                  :y="svgHeight - padding.bottom + 20"
                  :fill="colors.text"
                  font-size="11"
                  text-anchor="middle"
                >
                  {{ tick }}
                </text>
              </g>

              <!-- WPM область (заливка) -->
              <path
                :d="wpmAreaPath"
                :fill="colors.wpmFill"
              />

              <!-- WPM линия -->
              <path
                :d="wpmPath"
                fill="none"
                :stroke="colors.wpm"
                stroke-width="2"
              />

              <!-- Raw линия (пунктирная) -->
              <path
                :d="rawPath"
                fill="none"
                :stroke="colors.raw"
                stroke-width="2"
                stroke-dasharray="5,5"
              />

              <!-- Burst область (заливка) -->
              <path
                :d="burstAreaPath"
                :fill="colors.burstFill"
              />

              <!-- Burst линия -->
              <path
                :d="burstPath"
                fill="none"
                :stroke="colors.burst"
                stroke-width="1"
              />

              <!-- Точки ошибок -->
              <g class="error-points">
                <circle
                  v-for="(point, i) in errorPoints"
                  :key="`err-${i}`"
                  :cx="point.x"
                  :cy="point.y"
                  :r="Math.min(8, 4 + point.errors)"
                  :fill="colors.errors"
                  opacity="0.8"
                />
              </g>

              <!-- Вертикальная линия при hover -->
              <line
                v-if="tooltipData.visible"
                :x1="tooltipData.x"
                :y1="padding.top"
                :x2="tooltipData.x"
                :y2="svgHeight - padding.bottom"
                :stroke="colors.grid"
                stroke-width="1"
                stroke-dasharray="3,3"
              />
            </svg>

            <!-- Tooltip -->
            <div
              v-if="tooltipData.visible"
              :class="[
                'absolute pointer-events-none px-3 py-2 rounded-lg shadow-lg text-sm z-10 border',
                isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
              ]"
              :style="{
                left: `${Math.min((tooltipData.x / svgWidth) * 100, 80)}%`,
                top: '60px'
              }"
            >
              <div :class="['font-bold mb-1', isDark ? 'text-white' : 'text-gray-900']">
                Секунда {{ tooltipData.second }}
              </div>
              <div class="flex items-center gap-2 mb-0.5">
                <div class="w-3 h-3 bg-gray-500 rounded"></div>
                <span :class="isDark ? 'text-gray-300' : 'text-gray-700'">wpm: {{ tooltipData.wpm }}</span>
              </div>
              <div class="flex items-center gap-2 mb-0.5">
                <div class="w-3 h-0.5 border-t-2 border-dashed border-gray-400"></div>
                <span :class="isDark ? 'text-gray-300' : 'text-gray-700'">raw: {{ tooltipData.raw }}</span>
              </div>
              <div class="flex items-center gap-2 mb-0.5">
                <div class="w-3 h-3 bg-cyan-400 rounded opacity-50"></div>
                <span :class="isDark ? 'text-gray-300' : 'text-gray-700'">burst: {{ tooltipData.burst }}</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                <span :class="isDark ? 'text-gray-300' : 'text-gray-700'">Ошибки: {{ tooltipData.errors }}</span>
              </div>
            </div>
          </template>
          
          <!-- Fallback когда нет данных -->
          <div v-else class="flex items-center justify-center h-[300px]">
            <p :class="['text-sm', isDark ? 'text-gray-500' : 'text-gray-400']">
              Загрузка графика...
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Кнопка рестарта -->
    <div class="flex justify-center">
      <Button
        @click="restart"
        variant="outline"
        class="flex items-center gap-2"
      >
        <RotateCcw :size="20" />
        <span>Tab для рестарта</span>
      </Button>
    </div>
  </div>
</template>

<style scoped>
.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>