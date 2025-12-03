import { apiClient } from './client'
import type { UserResponse } from './auth'

export interface LeaderboardEntry {
  username: string
  wpm?: number
  accuracy?: number
  total_tests: number
  best_wpm: number
  best_accuracy: number
  level: number
}

export const userApi = {
  async getUserProfile(username: string): Promise<UserResponse> {
    return apiClient.request<UserResponse>(`/api/profile/${username}`)
  },
}

export const leaderboardApi = {
  async getLeaderboardWpm(limit: number = 100): Promise<LeaderboardEntry[]> {
    return apiClient.request<LeaderboardEntry[]>(`/api/leaderboard/wpm?limit=${limit}`)
  },

  async getLeaderboardAccuracy(limit: number = 100): Promise<LeaderboardEntry[]> {
    return apiClient.request<LeaderboardEntry[]>(`/api/leaderboard/accuracy?limit=${limit}`)
  },
}
