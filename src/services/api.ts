const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

class ApiService {
  private token: string | null

  constructor() {
    this.token = localStorage.getItem('token')
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('token', token)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('token')
    localStorage.removeItem('username')
  }

  getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    return headers
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  // Auth
  async register(username: string, password: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  }

  async login(username: string, password: string) {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)

    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || 'Login failed')
    }

    const data = await response.json()
    this.setToken(data.access_token)
    localStorage.setItem('username', data.username)
    return data
  }

  async getCurrentUser() {
    return this.request('/api/users/me')
  }

  // Words — пробуем новый endpoint, если 404 — fallback на старый
  async getWords(difficulty: 'normal' | 'high' = 'normal', limit: number = 100) {
    try {
      // Новый endpoint: /api/words/{difficulty}
      return await this.request(`/api/words/${difficulty}?limit=${limit}`)
    } catch (error) {
      // Fallback: старый endpoint без difficulty (для необновлённого бэкенда)
      try {
        return await this.request(`/api/words?limit=${limit}`)
      } catch {
        throw error // Если и fallback не сработал — пробрасываем оригинальную ошибку
      }
    }
  }

  // Test Results — отправляем difficulty, но оборачиваем в try/catch
  async saveTestResult(result: any) {
    try {
      // Попытка с difficulty (новый бэкенд)
      return await this.request('/api/results', {
        method: 'POST',
        body: JSON.stringify(result),
      })
    } catch (error) {
      // Если бэкенд старый и не принимает difficulty — убираем его и пробуем снова
      const { difficulty, ...resultWithoutDifficulty } = result
      try {
        return await this.request('/api/results', {
          method: 'POST',
          body: JSON.stringify(resultWithoutDifficulty),
        })
      } catch {
        throw error
      }
    }
  }

  async getUserResults(username: string, limit: number = 50) {
    return this.request(`/api/results/user/${username}?limit=${limit}`)
  }

  async getUserProfile(username: string) {
    return this.request(`/api/profile/${username}`)
  }

  // Leaderboard — с фильтрами difficulty + time_mode (новый бэкенд)
  async getLeaderboard(difficulty: 'normal' | 'high', timeMode: number, limit: number = 100) {
    return this.request(`/api/leaderboard/${difficulty}/${timeMode}?limit=${limit}`)
  }

  // Глобальный лидерборд (новый бэкенд)
  async getGlobalLeaderboard(limit: number = 100) {
    return this.request(`/api/leaderboard/global?limit=${limit}`)
  }

  // Мой ранг (новый бэкенд)
  async getMyRank(difficulty: 'normal' | 'high', timeMode: number) {
    return this.request(`/api/leaderboard/rank/${difficulty}/${timeMode}`)
  }

  // Мой глобальный ранг (новый бэкенд)
  async getMyGlobalRank() {
    return this.request(`/api/leaderboard/rank/global`)
  }
}

export const apiService = new ApiService()
