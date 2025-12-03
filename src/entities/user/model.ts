export interface User {
  username: string
  total_tests: number
  total_time_seconds: number
  best_wpm: number
  best_accuracy: number
  total_experience: number
  level: number
  created_at: string
}

export function calculateLevel(experience: number): number {
  return 1 + Math.floor(experience / 1000)
}

export function getExperienceForNextLevel(level: number): number {
  return level * 1000
}

export function getExperienceProgress(user: User): number {
  const currentLevelExp = (user.level - 1) * 1000
  const nextLevelExp = user.level * 1000
  const progress = user.total_experience - currentLevelExp
  return (progress / (nextLevelExp - currentLevelExp)) * 100
}
