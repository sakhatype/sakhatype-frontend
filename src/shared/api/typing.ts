import { apiClient } from './client'

export interface TestResultCreate {
  wpm: number
  raw_wpm: number
  accuracy: number
  burst_wpm: number
  total_errors: number
  time_mode: number
  test_duration: number
  consistency: number
}

export interface TestResultResponse extends TestResultCreate {
  id: number
  username: string
  created_at: string
}

export const typingApi = {
  async getWords(limit: number = 100): Promise<string[]> {
    return apiClient.request<string[]>(`/api/words?limit=${limit}`)
  },

  async saveTestResult(result: TestResultCreate): Promise<TestResultResponse> {
    return apiClient.request<TestResultResponse>('/api/results', {
      method: 'POST',
      body: JSON.stringify(result),
    })
  },

  async getUserResults(username: string, limit: number = 50): Promise<TestResultResponse[]> {
    return apiClient.request<TestResultResponse[]>(`/api/results/user/${username}?limit=${limit}`)
  },
}
