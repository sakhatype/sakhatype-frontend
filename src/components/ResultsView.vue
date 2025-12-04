<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
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

// Анимация графика
const animationProgress = ref(0)
const animationDuration = 1500 // ms
let animationFrame: number | null = null
let animationStartTime: number | null = null

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

// Индекс текущей точки для hover эффектов
const hoveredIndex = ref<number | null>(null)

// Подсчёт ошибок по секундам (как в старом файле - ошибки только там где они есть)
const errorsPerSecond = computed(() => {
  const errors: Record<number, number> = {}
  if (props.errorTimestamps) {
    props.errorTimestamps.forEach(sec => {
      // sec - это секунда когда была ошибка (0-based из store)
      // Преобразуем в 1-based для отображения
      const second = sec + 1
      errors[second] = (errors[second] || 0) + 1
    })
  }
  return errors
})

// Точки ошибок - только там где реально были ошибки (как в старом файле)
const errorPoints = computed(() => {
  if (!props.wpmHistory || props.wpmHistory.length === 0) return []
  
  return props.wpmHistory.map((_, index) => {
    const second = index + 1
    const errorsAtThisSecond = errorsPerSecond.value[second] || 0
    return errorsAtThisSecond > 0 ? errorsAtThisSecond : null
  })
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
    errors: errorPoints.value[index]
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
  const errors = errorPoints.value.filter(e => e !== null) as number[]
  if (errors.length === 0) return 5
  return Math.max(...errors, 1) + 2
})

// Цвета
const colors = computed(() => ({
  wpm: isDark.value ? 'rgba(156, 163, 175, 0.9)' : 'rgba(0, 0, 0, 0.8)',
  wpmFill: isDark.value ? 'rgba(156, 163, 175, 0.15)' : 'rgba(0, 0, 0, 0.1)',
  raw: isDark.value ? 'rgba(107, 114, 128, 0.7)' : 'rgba(102, 102, 102, 0.8)',
  rawFill: isDark.value ? 'rgba(107, 114, 128, 0.05)' : 'rgba(102, 102, 102, 0.05)',
  burst: isDark.value ? 'rgba(132, 165, 169, 0.8)' : 'rgba(132, 165, 169, 0.9)',
  burstFill: isDark.value ? 'rgba(132, 165, 169, 0.15)' : 'rgba(132, 165, 169, 0.15)',
  errors: '#ff0000',
  grid: isDark.value ? '#374151' : '#e0e0e0',
  text: isDark.value ? '#9ca3af' : '#666666',
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

// Вычисляем длину пути для анимации
const getPathLength = (pathData: string): number => {
  if (!pathData) return 0
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', pathData)
  return path.getTotalLength()
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

// Точки ошибок для отображения - только где есть ошибки
const errorPointsForDisplay = computed(() => {
  return chartData.value
    .map((d, i) => ({
      x: xScale(i),
      y: d.errors != null && d.errors > 0 ? yScaleErrors(d.errors) : 0,
      errors: d.errors ?? 0,
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
      hoveredIndex.value = index
      tooltipData.value = {
        visible: true,
        x: xScale(index),
        y: yScaleWpm(data.wpm),
        second: data.second,
        wpm: data.wpm,
        raw: data.raw,
        burst: data.burst,
        errors: data.errors || 0
      }
    }
  }
}

const handleMouseLeave = () => {
  tooltipData.value.visible = false
  hoveredIndex.value = null
}

// Функция анимации
const animate = (timestamp: number) => {
  if (!animationStartTime) {
    animationStartTime = timestamp
  }
  
  const elapsed = timestamp - animationStartTime
  const progress = Math.min(elapsed / animationDuration, 1)
  
  // Easing функция для плавности
  animationProgress.value = easeOutCubic(progress)
  
  if (progress < 1) {
    animationFrame = requestAnimationFrame(animate)
  }
}

// Easing функция
const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3)
}

// Запуск анимации
const startAnimation = () => {
  animationProgress.value = 0
  animationStartTime = null
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
  animationFrame = requestAnimationFrame(animate)
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
    startAnimation()
  },
  { deep: true }
)

onMounted(async () => {
  await nextTick()
  chartKey.value++
  chartReady.value = true
  startAnimation()
})

onUnmounted(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
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
            <span :class="['text-sm', isDark ? 'text-neutral-400' : 'text-neutral-600']">WPM</span>
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
            <span :class="['text-sm', isDark ? 'text-neutral-400' : 'text-neutral-600']">Точность</span>
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
            <span :class="['text-sm', isDark ? 'text-neutral-400' : 'text-neutral-600']">Raw</span>
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
            <span :class="['text-sm', isDark ? 'text-neutral-400' : 'text-neutral-600']">Ошибки</span>
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
            <div :class="['w-6 h-3 rounded', isDark ? 'bg-gray-400' : 'bg-black']" style="opacity: 0.8"></div>
            <span :class="['text-sm', isDark ? 'text-neutral-400' : 'text-neutral-600']">wpm</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-6 h-0.5 border-t-2 border-dashed border-gray-500"></div>
            <span :class="['text-sm', isDark ? 'text-neutral-400' : 'text-neutral-600']">raw</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-6 h-3 rounded" style="background-color: rgba(132, 165, 169, 0.8)"></div>
            <span :class="['text-sm', isDark ? 'text-neutral-400' : 'text-neutral-600']">burst</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-red-500 rounded-full"></div>
            <span :class="['text-sm', isDark ? 'text-neutral-400' : 'text-neutral-600']">Ошибки</span>
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
                  fill="#ff0000"
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
                  fill="#ff0000"
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

              <!-- WPM область (заливка) с анимацией -->
              <path
                :d="wpmAreaPath"
                :fill="colors.wpmFill"
                class="chart-area"
                :style="{ opacity: animationProgress * 0.8 }"
              />

              <!-- WPM линия с анимацией -->
              <path
                :d="wpmPath"
                fill="none"
                :stroke="colors.wpm"
                stroke-width="2"
                class="chart-line"
                :stroke-dasharray="1000"
                :stroke-dashoffset="1000 - (1000 * animationProgress)"
              />

              <!-- Raw линия (пунктирная) с анимацией -->
              <path
                :d="rawPath"
                fill="none"
                :stroke="colors.raw"
                stroke-width="2"
                class="chart-line"
                :stroke-dasharray="`5,5`"
                :style="{ opacity: animationProgress }"
              />

              <!-- Burst линия с анимацией -->
              <path
                :d="burstPath"
                fill="none"
                :stroke="colors.burst"
                stroke-width="2"
                class="chart-line"
                :stroke-dasharray="1000"
                :stroke-dashoffset="1000 - (1000 * animationProgress)"
              />

              <!-- Точки ошибок - ТОЛЬКО там где есть ошибки -->
              <g class="error-points">
                <circle
                  v-for="(point, i) in errorPointsForDisplay"
                  :key="`err-${i}`"
                  :cx="point.x"
                  :cy="point.y"
                  :r="Math.min(6, 3 + (point.errors || 0))"
                  :fill="colors.errors"
                  class="error-point"
                  :class="{ 'error-point-hovered': hoveredIndex === point.index }"
                  :style="{ 
                    opacity: animationProgress,
                    transform: `scale(${animationProgress * (hoveredIndex === point.index ? 1.5 : 1)})`,
                    transformOrigin: `${point.x}px ${point.y}px`
                  }"
                />
              </g>

              <!-- Точка на линии WPM при hover -->
              <circle
                v-if="tooltipData.visible"
                :cx="tooltipData.x"
                :cy="tooltipData.y"
                r="5"
                :fill="colors.wpm"
                class="hover-dot"
              />

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

            <!-- Tooltip с плавным перемещением -->
            <div
              v-if="tooltipData.visible"
              :class="[
                'absolute pointer-events-none px-3 py-2 rounded-lg shadow-lg text-sm z-10 border tooltip-smooth',
                isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
              ]"
              :style="{
                left: `${(tooltipData.x / svgWidth) * 100}%`,
                top: '20px',
                transform: 'translateX(-50%)'
              }"
            >
              <div :class="['font-bold mb-1', isDark ? 'text-white' : 'text-gray-900']">
                Секунда {{ tooltipData.second }}
              </div>
              <div class="flex items-center gap-2 mb-0.5">
                <div :class="['w-3 h-3 rounded', isDark ? 'bg-gray-400' : 'bg-black']"></div>
                <span :class="isDark ? 'text-gray-300' : 'text-gray-700'">wpm: {{ tooltipData.wpm }}</span>
              </div>
              <div class="flex items-center gap-2 mb-0.5">
                <div class="w-3 h-0.5 border-t-2 border-dashed border-gray-400"></div>
                <span :class="isDark ? 'text-gray-300' : 'text-gray-700'">raw: {{ tooltipData.raw }}</span>
              </div>
              <div class="flex items-center gap-2 mb-0.5">
                <div class="w-3 h-3 rounded" style="background-color: rgba(132, 165, 169, 0.8)"></div>
                <span :class="isDark ? 'text-gray-300' : 'text-gray-700'">burst: {{ tooltipData.burst }}</span>
              </div>
              <div v-if="tooltipData.errors > 0" class="flex items-center gap-2">
                <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                <span :class="isDark ? 'text-gray-300' : 'text-gray-700'">Ошибки: {{ tooltipData.errors }}</span>
              </div>
            </div>
          </template>
          
          <!-- Fallback когда нет данных -->
          <div v-else class="flex items-center justify-center h-[300px]">
            <p :class="['text-sm', isDark ? 'text-neutral-500' : 'text-neutral-400']">
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

.chart-line {
  transition: stroke-dashoffset 0.05s linear;
}

.chart-area {
  transition: opacity 0.05s linear;
}

.error-point {
  transition: transform 0.2s ease-out, opacity 0.3s ease-out;
}

.error-point-hovered {
  filter: brightness(1.2);
}

.hover-dot {
  transition: cx 0.15s ease-out, cy 0.15s ease-out;
}

.tooltip-smooth {
  transition: left 0.15s ease-out, top 0.15s ease-out;
}
</style>