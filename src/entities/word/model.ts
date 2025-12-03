export interface Word {
  text: string
  status?: 'correct' | 'incorrect' | 'pending'
}

export function generateWordList(words: string[], count: number): Word[] {
  const result: Word[] = []
  for (let i = 0; i < count; i++) {
    result.push({
      text: words[i % words.length],
      status: 'pending',
    })
  }
  return result
}
