export interface Word {
  text: string
  status?: 'correct' | 'incorrect' | 'pending'
}

export function generateWordList(words: string[], count: number): Word[] {
  // Guard against empty array
  if (words.length === 0) {
    return []
  }
  
  const result: Word[] = []
  for (let i = 0; i < count; i++) {
    const word = words[i % words.length]
    // Additional safety check (shouldn't be needed with the guard above, but TypeScript likes it)
    if (word !== undefined) {
      result.push({
        text: word,
        status: 'pending',
      })
    }
  }
  return result
}