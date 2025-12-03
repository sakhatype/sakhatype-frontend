const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

class ApiService {
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

  // Words
  async getWords(limit: number = 100) {
    return this.request(`/api/words?limit=${limit}`)
  }

  // Test Results
  async saveTestResult(result: any) {
    return this.request('/api/results', {
      method: 'POST',
      body: JSON.stringify(result),
    })
  }

  async getUserResults(username: string, limit: number = 50) {
    return this.request(`/api/results/user/${username}?limit=${limit}`)
  }

  async getUserProfile(username: string) {
    return this.request(`/api/profile/${username}`)
  }

  // Leaderboard
  async getLeaderboardWpm(limit: number = 100) {
    return this.request(`/api/leaderboard/wpm?limit=${limit}`)
  }

  async getLeaderboardAccuracy(limit: number = 100) {
    return this.request(`/api/leaderboard/accuracy?limit=${limit}`)
  }
}

export const apiService = new ApiService()
