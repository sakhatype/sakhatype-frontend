<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { leaderboardApi, type LeaderboardEntry } from '@/shared/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { Input } from '@/shared/ui/input'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Trophy, Zap, Target, Medal, Search, ArrowUp, ArrowDown } from 'lucide-vue-next'

const { isDark } = useTheme()

const isLoading = ref(true)
const wpmLeaderboard = ref<LeaderboardEntry[]>([])
const accuracyLeaderboard = ref<LeaderboardEntry[]>([])
const activeTab = ref('wpm')
const searchQuery = ref('')
const sortColumn = ref<'username' | 'wpm' | 'accuracy' | 'level' | 'total_tests'>('wpm')
const sortDirection = ref<'asc' | 'desc'>('desc')

onMounted(async () => {
  try {
    isLoading.value = true
    const [wpmData, accuracyData] = await Promise.all([
      leaderboardApi.getLeaderboardWpm(100),
      leaderboardApi.getLeaderboardAccuracy(100)
    ])
    wpmLeaderboard.value = wpmData
    accuracyLeaderboard.value = accuracyData
  } catch (error) {
    console.error('Failed to load leaderboard:', error)
  } finally {
    isLoading.value = false
  }
})

const filteredWpmLeaderboard = computed(() => {
  let filtered = wpmLeaderboard.value.filter(user =>
    user.username.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
  
  return sortLeaderboard(filtered, 'wpm')
})

const filteredAccuracyLeaderboard = computed(() => {
  let filtered = accuracyLeaderboard.value.filter(user =>
    user.username.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
  
  return sortLeaderboard(filtered, 'accuracy')
})

function sortLeaderboard(data: LeaderboardEntry[], defaultSort: 'wpm' | 'accuracy') {
  const sorted = [...data]
  
  sorted.sort((a, b) => {
    let aVal: string | number
    let bVal: string | number
    
    switch (sortColumn.value) {
      case 'username':
        aVal = a.username
        bVal = b.username
        break
      case 'wpm':
        aVal = a.best_wpm
        bVal = b.best_wpm
        break
      case 'accuracy':
        aVal = a.best_accuracy
        bVal = b.best_accuracy
        break
      case 'level':
        aVal = a.level
        bVal = b.level
        break
      case 'total_tests':
        aVal = a.total_tests
        bVal = b.total_tests
        break
      default:
        aVal = defaultSort === 'wpm' ? a.best_wpm : a.best_accuracy
        bVal = defaultSort === 'wpm' ? b.best_wpm : b.best_accuracy
    }
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection.value === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }
    
    // TypeScript now knows both are numbers
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection.value === 'asc' ? aVal - bVal : bVal - aVal
    }
    
    // Fallback (shouldn't happen, but TypeScript needs this)
    return 0
  })
  
  return sorted
}

function toggleSort(column: typeof sortColumn.value) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'desc'
  }
}

const getMedalColor = (index: number) => {
  if (index === 0) return 'text-yellow-500'
  if (index === 1) return 'text-neutral-400'
  if (index === 2) return 'text-orange-600'
  return 'text-neutral-500'
}

const getRankBadgeColor = (index: number) => {
  if (index === 0) return 'bg-yellow-500 text-white'
  if (index === 1) return 'bg-neutral-900 text-white'
  if (index === 2) return 'bg-orange-600 text-white'
  return ''
}
</script>

<template>
  a
</template>