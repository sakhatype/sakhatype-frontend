<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { RotateCcw, Share2, Check, X } from 'lucide-vue-next'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useTheme } from '@/composables/useTheme'
import { useAuthStore } from '@/stores/auth'
import { typingApi } from '@/shared/api'
import { useSound } from '@/shared/composables/useSound'
import html2canvas from 'html2canvas'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface Props {
  stats: {
    wpm: number
    rawWpm: number
    accuracy: number
    burstWpm: number
    totalErrors: number
    consistency: number
    timeMode: number
    testDuration: number
  }
  wpmHistory: number[]
  rawHistory: number[]
  burstHistory: number[]
  errorTimestamps: number[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  restart: []
}>()

const { isDark } = useTheme()
const authStore = useAuthStore()
const router = useRouter()
const { playComplete } = useSound()
const resultsRef = ref<HTMLElement | null>(null)
const isSaving = ref(false)

onMounted(() => {
  playComplete()
  saveResult()
})

async function saveResult() {
  if (!authStore.isAuthenticated) return

  try {
    await typingApi.saveTestResult({
      wpm: props.stats.wpm,
      raw_wpm: props.stats.rawWpm,
      accuracy: props.stats.accuracy,
      burst_wpm: props.stats.burstWpm,
      total_errors: props.stats.totalErrors,
      time_mode: props.stats.timeMode,
      test_duration: props.stats.testDuration,
      consistency: props.stats.consistency
    })
  } catch (error) {
    console.error('Failed to save result:', error)
  }
}

const wpmChartData = computed(() => ({
  labels: props.wpmHistory.map((_, i) => `${i}s`),
  datasets: [
    {
      label: 'WPM',
      data: props.wpmHistory,
      borderColor: isDark.value ? 'rgb(59, 130, 246)' : 'rgb(37, 99, 235)',
      backgroundColor: isDark.value ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.1)',
      tension: 0.4,
      fill: true,
      pointRadius: 0,
      borderWidth: 2,
    },
    {
      label: 'Raw WPM',
      data: props.rawHistory,
      borderColor: isDark.value ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)',
      backgroundColor: 'transparent',
      tension: 0.4,
      fill: false,
      pointRadius: 0,
      borderWidth: 1.5,
      borderDash: [5, 5],
    }
  ]
}))

const accuracyChartData = computed(() => {
  const accuracyOverTime = props.wpmHistory.map((_, i) => {
    const totalChars = (i + 1) * (props.stats.wpm / 5)
    const errors = props.errorTimestamps.filter(t => t <= i + 1).length
    return Math.max(0, ((totalChars - errors) / totalChars) * 100)
  })

  return {
    labels: accuracyOverTime.map((_, i) => `${i}s`),
    datasets: [
      {
        label: 'Точность (%)',
        data: accuracyOverTime,
        borderColor: isDark.value ? 'rgb(34, 197, 94)' : 'rgb(22, 163, 74)',
        backgroundColor: isDark.value ? 'rgba(34, 197, 94, 0.1)' : 'rgba(22, 163, 74, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      labels: {
        color: isDark.value ? '#9ca3af' : '#6b7280',
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
    }
  },
  scales: {
    x: {
      grid: {
        color: isDark.value ? '#374151' : '#e5e7eb',
        display: false
      },
      ticks: {
        color: isDark.value ? '#9ca3af' : '#6b7280',
      }
    },
    y: {
      grid: {
        color: isDark.value ? '#374151' : '#e5e7eb',
      },
      ticks: {
        color: isDark.value ? '#9ca3af' : '#6b7280',
      }
    }
  }
}))

async function saveScreenshot() {
  if (!resultsRef.value) return

  try {
    isSaving.value = true
    const canvas = await html2canvas(resultsRef.value, {
      backgroundColor: isDark.value ? '#1f2937' : '#ffffff',
      scale: 2
    })

    const now = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
    const fileName = `Sakhatype - ${dateStr} ${timeStr}.png`

    const link = document.createElement('a')
    link.href = canvas.toDataURL()
    link.download = fileName
    link.click()
  } catch (error) {
    console.error('Failed to save screenshot:', error)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div ref="resultsRef" class="w-full max-w-6xl mx-auto space-y-6">
    <!-- Stats Grid -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card>
        <CardContent class="pt-6">
          <div class="text-center">
            <div :class="['text-4xl font-bold mb-1', isDark ? 'text-white' : 'text-gray-900']">
              {{ Math.round(stats.wpm) }}
            </div>
            <div :class="['text-sm', isDark ? 'text-gray-400' : 'text-neutral-600']">WPM</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-6">
          <div class="text-center">
            <div :class="['text-4xl font-bold mb-1', isDark ? 'text-white' : 'text-gray-900']">
              {{ Math.round(stats.accuracy) }}%
            </div>
            <div :class="['text-sm', isDark ? 'text-gray-400' : 'text-neutral-600']">Точность</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-6">
          <div class="text-center">
            <div :class="['text-4xl font-bold mb-1', isDark ? 'text-white' : 'text-gray-900']">
              {{ Math.round(stats.rawWpm) }}
            </div>
            <div :class="['text-sm', isDark ? 'text-gray-400' : 'text-neutral-600']">Raw</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-6">
          <div class="text-center">
            <div :class="['text-4xl font-bold mb-1', isDark ? 'text-white' : 'text-gray-900']">
              {{ Math.round(stats.burstWpm) }}
            </div>
            <div :class="['text-sm', isDark ? 'text-gray-400' : 'text-neutral-600']">Burst</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="pt-6">
          <div class="text-center">
            <div :class="['text-4xl font-bold mb-1', isDark ? 'text-white' : 'text-gray-900']">
              {{ stats.totalErrors }}
            </div>
            <div :class="['text-sm', isDark ? 'text-gray-400' : 'text-neutral-600']">Ошибки</div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- WPM Chart -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">График WPM</CardTitle>
        </CardHeader>
        <CardContent>
          <div style="height: 250px">
            <Line :data="wpmChartData" :options="chartOptions" />
          </div>
        </CardContent>
      </Card>

      <!-- Accuracy Chart -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">График точности</CardTitle>
        </CardHeader>
        <CardContent>
          <div style="height: 250px">
            <Line :data="accuracyChartData" :options="chartOptions" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-center gap-3">
      <Button @click="emit('restart')" size="lg" class="flex items-center gap-2">
        <RotateCcw :size="18" />
        <span>Еще раз</span>
      </Button>
      <Button
        @click="saveScreenshot"
        variant="outline"
        size="lg"
        class="flex items-center gap-2"
        :disabled="isSaving"
      >
        <Share2 :size="18" />
        <span>{{ isSaving ? 'Сохранение...' : 'Скриншот' }}</span>
      </Button>
    </div>
  </div>
</template>
