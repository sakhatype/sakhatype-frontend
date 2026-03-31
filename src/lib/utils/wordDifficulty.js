/** Нормализация длины и веса по схеме: длина / 15 и доля «якутских» букв. */
const MAX_LENGTH = 15;
const WEIGHT_LENGTH = 0.4;
const WEIGHT_DENSITY = 0.6;

/**
 * Буквы, которые учитываются как «якутский спецсимвол» для плотности (как в примерах: ү, ө, һ, ҥ, ҕ).
 * «дь» и «нь» в плотность не входят, но для длины слова считаются одной буквой — как в разборе «Дьүһүн» = 5 букв.
 */
const YAKUT_SPECIAL = new Set(['ҕ', 'ҥ', 'ө', 'ү', 'һ']);

/**
 * Число позиций в слове: дь/нь → одна позиция (чтобы score совпадал с ручным подсчётом).
 * @param {string} word
 * @returns {number}
 */
function effectiveLetterCount(word) {
  const lower = (word || '').toLowerCase().trim();
  if (!lower) return 0;
  let n = 0;
  let i = 0;
  while (i < lower.length) {
    const c0 = lower[i];
    const c1 = lower[i + 1];
    if ((c0 === 'д' || c0 === 'н') && c1 === 'ь') {
      n += 1;
      i += 2;
      continue;
    }
    const cp = lower.codePointAt(i);
    n += 1;
    i += cp !== undefined && cp > 0xffff ? 2 : 1;
  }
  return n;
}

/** Запас слов офлайн: разная длина и плотность спецбукв */
const FALLBACK_WORD_POOL = [
  'эйэ',
  'кини',
  'тыл',
  'сурук',
  'саха',
  'орто',
  'кэм',
  'тыа',
  'үлэ',
  'уол',
  'ийэ',
  'аҕа',
  'ойоҥ',
  'тургэнник',
  'сахалыы',
  'суруйҕу',
  'үөрэх',
  'дьүһүн',
  'ҥайыах',
  'һырыдыктарбыт',
  'дойду',
  'олуҥҥа',
  'ыһыы',
  'сүрэх',
];

/**
 * @param {string} word
 * @returns {number}
 */
export function countYakutSpecialChars(word) {
  if (!word) return 0;
  let n = 0;
  for (const ch of word.toLowerCase()) {
    if (YAKUT_SPECIAL.has(ch)) n += 1;
  }
  return n;
}

/**
 * Score = (length/15) * 0.4 + (yakutCount/length) * 0.6
 * @param {string} word
 * @returns {number}
 */
export function wordDifficultyScore(word) {
  const w = typeof word === 'string' ? word.trim() : '';
  const len = effectiveLetterCount(w);
  if (!len) return 0;
  const yak = countYakutSpecialChars(w);
  const normLength = len / MAX_LENGTH;
  const density = yak / len;
  return normLength * WEIGHT_LENGTH + density * WEIGHT_DENSITY;
}

/**
 * @param {string} word
 * @returns {'very_easy' | 'easy' | 'medium' | 'hard'}
 */
export function wordDifficultyLabel(word) {
  const s = wordDifficultyScore(word);
  if (s < 0.1) return 'very_easy';
  if (s < 0.3) return 'easy';
  if (s <= 0.4) return 'medium';
  return 'hard';
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Отбор слов под режим тренажёра: normal без hard, expert со сдвигом в сторону более высокого score.
 * @param {string[]} words
 * @param {'normal' | 'expert'} gameDifficulty
 * @param {number} count
 * @returns {string[]}
 */
export function pickWordsForGameDifficulty(words, gameDifficulty, count) {
  const list = (words || []).filter((w) => typeof w === 'string' && w.trim().length > 0);
  if (!list.length || count <= 0) return [];

  const scored = list.map((w) => ({
    w: w.trim(),
    score: wordDifficultyScore(w),
    label: wordDifficultyLabel(w),
  }));

  /** @type {typeof scored} */
  let pool;
  if (gameDifficulty === 'expert') {
    pool = scored.filter((x) => x.score >= 0.25);
    if (pool.length < count) pool = scored.filter((x) => x.label !== 'very_easy');
    if (pool.length < count) pool = [...scored];
  } else {
    pool = scored.filter((x) => x.label !== 'hard');
    if (pool.length < count) pool = [...scored];
  }

  shuffleInPlace(pool);
  return pool.slice(0, count).map((x) => x.w);
}

/**
 * Слова, когда API недоступен: пул размечен скорингом и фильтруется по сложности.
 * Добирает до count (повторы из пула), чтобы режим «время» хватало на длину сессии.
 * @param {'normal' | 'expert'} gameDifficulty
 * @param {number} count
 * @returns {string[]}
 */
export function getOfflineWords(gameDifficulty, count) {
  const pool = FALLBACK_WORD_POOL;
  const out = [];
  while (out.length < count) {
    const batch = pickWordsForGameDifficulty(pool, gameDifficulty, count - out.length);
    if (!batch.length) break;
    out.push(...batch);
  }
  return out;
}
