<template>
  <div class="results">
    <h2>Результаты теста</h2>

    <div class="chart-container">
      <canvas ref="chartCanvas"></canvas>
    </div>

    <div class="final-stats">
      <div class="stat-item">
        <div class="stat-value">{{ stats.wpm }}</div>
        <div class="stat-label">wpm</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.accuracy }}%</div>
        <div class="stat-label">точность</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.rawWpm }}</div>
        <div class="stat-label">raw</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.burstWpm }}</div>
        <div class="stat-label">burst</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.totalErrors }}</div>
        <div class="stat-label">ошибки</div>
      </div>
    </div>

    <div class="buttons">
      <button class="btn" @click="$emit('restart')">↻ еще раз</button>
      <button class="btn" @click="saveScreenshot">Сохранить скриншот</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import html2canvas from 'html2canvas'

Chart.register(...registerables)

const props = defineProps({
  stats: { type: Object, required: true },
  wpmHistory: { type: Array, default: () => [] },
  rawHistory: { type: Array, default: () => [] },
  burstHistory: { type: Array, default: () => [] },
  errorTimestamps: { type: Array, default: () => [] },
})

defineEmits(['restart'])

const chartCanvas = ref(null)
let chartInstance = null

// Функция для сохранения скриншота
const saveScreenshot = async () => {
  try {
    const canvasEl = document.querySelector('.results')
    const screenshot = await html2canvas(canvasEl)

    // Получаем текущее время
    const now = new Date()
    const pad = (n) => n.toString().padStart(2, '0')
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`

    // Формируем динамическое имя файла
    const fileName = `Sakhatype - ${dateStr} ${timeStr}.png`

    // Создаем ссылку для загрузки файла
    const link = document.createElement('a')
    link.href = screenshot.toDataURL()
    link.download = fileName
    link.click()
  } catch (err) {
    console.error(err)
  }
}

onMounted(() => createChart())
onUnmounted(() => chartInstance?.destroy())

watch(
  () => [props.wpmHistory, props.rawHistory, props.errorTimestamps, props.burstHistory],
  () => {
    if (chartInstance) {
      chartInstance.destroy()
      nextTick(createChart)
    }
  },
  { deep: true },
)

const createChart = () => {
  if (!chartCanvas.value) return

  const ctx = chartCanvas.value.getContext('2d')
  const labels = props.wpmHistory.map((_, i) => i + 1)

  const errorPoints = labels.map((second) => {
    const errorsAtThisSecond = props.errorTimestamps.filter((t) => t === second - 1).length
    return errorsAtThisSecond > 0 ? errorsAtThisSecond : null
  })

  // Если burstHistory пуст — имитируем динамику на основе пиков WPM
  const burstData = props.burstHistory.length
    ? props.burstHistory
    : props.wpmHistory.map((v, i, arr) => {
        const prev = arr[i - 1] ?? v
        const next = arr[i + 1] ?? v
        return Math.max(v, prev, next)
      })

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'wpm',
          data: props.wpmHistory,
          borderColor: '#000000',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 1,
          pointHoverRadius: 2,
          pointBackgroundColor: '#000000',
        },
        {
          label: 'raw',
          data: props.rawHistory,
          borderColor: '#666666',
          backgroundColor: 'rgba(102, 102, 102, 0.05)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 1,
          pointHoverRadius: 2,
          pointBackgroundColor: '#666666',
          borderDash: [5, 5],
        },
        {
          label: 'burst',
          data: burstData,
          borderColor: '#84A5A9',
          backgroundColor: 'rgba(132, 165, 169, 0.15)',
          borderWidth: 2,
          tension: 0.35,
          fill: false,
          pointRadius: 1,
          pointHoverRadius: 2,
          pointBackgroundColor: '#84A5A9',
        },
        {
          label: 'Ошибки',
          data: errorPoints,
          borderColor: 'transparent',
          backgroundColor: '#ff0000',
          borderWidth: 0,
          tension: 0,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#ff0000',
          pointBorderColor: '#ff0000',
          showLine: false,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#000000',
            font: { size: 12, family: "'SF Mono', 'Monaco', monospace" },
            padding: 15,
          },
        },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#000000',
          bodyColor: '#000000',
          borderColor: '#666666',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            title: (ctx) => 'Секунда ' + ctx[0].label,
            label: (ctx) => {
              if (ctx.dataset.label === 'Ошибки') return ctx.raw ? `Ошибки: ${ctx.raw}` : null
              return ctx.dataset.label + ': ' + ctx.raw
            },
          },
          filter: (item) => (item.dataset.label === 'Ошибки' ? item.raw !== null : true),
        },
      },
      scales: {
        x: {
          grid: { color: '#e0e0e0', drawBorder: false },
          ticks: { color: '#666666', font: { size: 11 } },
          title: {
            display: true,
            text: 'Время (секунды)',
            color: '#666666',
            font: { size: 12 },
          },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: { color: '#e0e0e0', drawBorder: false },
          ticks: { color: '#666666', font: { size: 11 } },
          title: {
            display: true,
            text: 'Скорость набора (слов/мин.)',
            color: '#666666',
            font: { size: 12 },
          },
          beginAtZero: true,
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: '#ff0000', font: { size: 11 }, stepSize: 1 },
          title: {
            display: true,
            text: 'Количество ошибок',
            color: '#ff0000',
            font: { size: 12 },
          },
          beginAtZero: true,
        },
      },
    },
  })
}
</script>

<style scoped>
.results {
  text-align: center;
  padding: 40px;
  max-width: 1000px;
  width: 100%;
}

.results h2 {
  font-size: 36px;
  margin-bottom: 30px;
  color: #000000;
}

.chart-container {
  height: 300px;
  margin: 40px 0;
}

.final-stats {
  display: flex;
  justify-content: center;
  gap: 80px;
  margin: 40px 0;
}

.buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 40px;
}

.btn {
  padding: 14px 35px;
  font-size: 15px;
  border: 2px solid #666666;
  background: transparent;
  color: #000000;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  font-family: inherit;
}

.btn:hover {
  background: #000000;
  border-color: #000000;
  color: #ffffff;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 42px;
  font-weight: bold;
  color: #000000;
}

.stat-label {
  font-size: 14px;
  color: #666666;
  margin-top: 8px;
  text-transform: lowercase;
}
</style>
