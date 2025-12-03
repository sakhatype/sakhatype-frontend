import { apiClient } from './client'

export interface UserCreate {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  username: string
}

export interface UserResponse {
  username: string
  total_tests: number
  total_time_seconds: number
  best_wpm: number
  best_accuracy: number
  total_experience: number
  level: number
  created_at: string
}

export const authApi = {
  async register(username: string, password: string): Promise<UserResponse> {
    return apiClient.request<UserResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },

  async login(username: string, password: string): Promise<TokenResponse> {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)

    const response = await fetch(`${apiClient['API_URL'] || 'http://localhost:8080'}/api/auth/login`, {
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
    apiClient.setToken(data.access_token)
    localStorage.setItem('username', data.username)
    return data
  },

  async getCurrentUser(): Promise<UserResponse> {
    return apiClient.request<UserResponse>('/api/users/me')
  },
}
