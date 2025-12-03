export interface TestResult {
  id: number
  username: string
  wpm: number
  raw_wpm: number
  accuracy: number
  burst_wpm: number
  total_errors: number
  time_mode: number
  test_duration: number
  consistency: number
  created_at: string
}

export interface TestStats {
  wpm: number
  rawWpm: number
  accuracy: number
  burstWpm: number
  totalErrors: number
  consistency: number
  timeMode: number
  testDuration: number
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
