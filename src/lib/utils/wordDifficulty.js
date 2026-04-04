/**
 * Индекс сложности слова — та же модель, что в backend/app/services/word_difficulty.py
 * (константы MAX_EFFECTIVE_LENGTH, W_*, D_EXPERT_* — не менять раздельно с backend).
 *
 * Формула:
 *   D(w) = clip( W_L·L̃ + W_RHO·ρ̃ + W_H·H + W_J·j , 0, 1 )
 *
 * L̃ = min(L / L_max, 1), L — эффективная длина («дь»/«нь» = одна позиция).
 * ρ̃ = min(2·S/L, 1), S — число букв из YAKUT_SPECIAL.
 * H — доля соседних пар, где ровно один символ — спецбуква.
 * j = 1, если в строке есть пробел, иначе 0.
 *
 * Лёгкий режим: L ∈ [2..7], слова длиннее 5 букв (6–7) — редко (~12%); ~⅓ со спецбуквой.
 */

const MAX_EFFECTIVE_LENGTH = 15;
const YAKUT_SPECIAL = new Set(['ҕ', 'ҥ', 'ө', 'ү', 'һ']);

const W_L = 0.32;
const W_RHO = 0.38;
const W_H = 0.22;
const W_J = 0.12;

const D_EXPERT_MIN = 0.3;
const D_EXPERT_MIN_RELAX = 0.22;
const EXPERT_WEIGHT_POWER = 2.4;

/** Лёгкий режим: L ∈ [2..7], ~⅓ слов со спецбуквой (синхронно с word_difficulty.py) */
const NORMAL_EASY_LEN_MIN = 2;
const NORMAL_EASY_LEN_MAX = 7;
const NORMAL_EASY_SHORT_LEN_MAX = 5;
const NORMAL_LONG_WORD_MAX_FRACTION = 0.12;
const NORMAL_SPECIAL_WORD_RATIO = 1 / 3;

/**
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
 * @param {string} word
 * @returns {number}
 */
function boundaryFraction(word) {
  const lower = (word || '').toLowerCase().trim();
  if (lower.length < 2) return 0;
  let transitions = 0;
  for (let i = 0; i < lower.length - 1; i++) {
    const a = lower[i];
    const b = lower[i + 1];
    const sa = YAKUT_SPECIAL.has(a);
    const sb = YAKUT_SPECIAL.has(b);
    if (sa !== sb) transitions += 1;
  }
  return transitions / (lower.length - 1);
}

/**
 * D(w) ∈ [0, 1] — см. модульный комментарий выше.
 * @param {string} word
 * @returns {number}
 */
export function wordDifficultyScore(word) {
  const w = typeof word === 'string' ? word.trim() : '';
  const len = effectiveLetterCount(w);
  if (!len) return 0;
  const specials = countYakutSpecialChars(w);
  const lTilde = Math.min(len / MAX_EFFECTIVE_LENGTH, 1);
  const rho = specials / len;
  const rhoTilde = Math.min(2 * rho, 1);
  const h = boundaryFraction(w);
  const j = w.includes(' ') ? 1 : 0;
  const raw = W_L * lTilde + W_RHO * rhoTilde + W_H * h + W_J * j;
  return Math.max(0, Math.min(1, raw));
}

/**
 * @param {string} word
 * @returns {'very_easy' | 'easy' | 'medium' | 'hard'}
 */
export function wordDifficultyLabel(word) {
  const d = wordDifficultyScore(word);
  if (d < 0.18) return 'very_easy';
  if (d < 0.32) return 'easy';
  if (d <= 0.48) return 'medium';
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
 * @param {{ w: string, hasSpec: boolean }[]} pairs
 * @param {number} count
 * @returns {string[]}
 */
function pickFromSpecPairs(pairs, count) {
  if (count <= 0 || !pairs.length) return [];
  const noSp = pairs.filter((e) => !e.hasSpec).map((e) => e.w);
  const wiSp = pairs.filter((e) => e.hasSpec).map((e) => e.w);
  shuffleInPlace(noSp);
  shuffleInPlace(wiSp);
  const specTarget = Math.min(wiSp.length, Math.max(0, Math.round(count * NORMAL_SPECIAL_WORD_RATIO)));
  const plainTarget = count - specTarget;
  const out = [];
  out.push(...wiSp.slice(0, specTarget));
  out.push(...noSp.slice(0, plainTarget));
  const used = new Set(out);
  const rest = pairs.map((e) => e.w).filter((w) => !used.has(w));
  shuffleInPlace(rest);
  for (const w of rest) {
    if (out.length >= count) break;
    out.push(w);
  }
  return out;
}

/**
 * @param {string[]} raw
 * @returns {{ shortPairs: { w: string, hasSpec: boolean }[], longPairs: { w: string, hasSpec: boolean }[] }}
 */
function buildShortLongPairs(raw) {
  /** @type {{ w: string, hasSpec: boolean }[]} */
  const shortPairs = [];
  /** @type {{ w: string, hasSpec: boolean }[]} */
  const longPairs = [];
  for (const item of raw) {
    const w = item.trim();
    if (!w || w.includes(' ')) continue;
    const ln = effectiveLetterCount(w);
    if (ln < NORMAL_EASY_LEN_MIN || ln > NORMAL_EASY_LEN_MAX) continue;
    const hasSpec = countYakutSpecialChars(w) > 0;
    if (ln <= NORMAL_EASY_SHORT_LEN_MAX) shortPairs.push({ w, hasSpec });
    else longPairs.push({ w, hasSpec });
  }
  return { shortPairs, longPairs };
}

/**
 * @param {string[]} raw
 * @param {number} count
 * @returns {string[]}
 */
function pickNormalEasyRareLong(raw, count) {
  const { shortPairs, longPairs } = buildShortLongPairs(raw);
  const longTarget = Math.min(count, Math.max(0, Math.round(count * NORMAL_LONG_WORD_MAX_FRACTION)));
  const shortTarget = count - longTarget;
  const shortWords = shortPairs.map((e) => e.w);
  const longWords = longPairs.map((e) => e.w);

  const partS = pickFromSpecPairs(shortPairs, shortTarget);
  while (partS.length < shortTarget && (shortWords.length || longWords.length)) {
    partS.push(
      shortWords.length
        ? shortWords[Math.floor(Math.random() * shortWords.length)]
        : longWords[Math.floor(Math.random() * longWords.length)],
    );
  }

  const partL = pickFromSpecPairs(longPairs, longTarget);
  while (partL.length < longTarget && (longWords.length || shortWords.length)) {
    partL.push(
      longWords.length
        ? longWords[Math.floor(Math.random() * longWords.length)]
        : shortWords[Math.floor(Math.random() * shortWords.length)],
    );
  }

  return partS.concat(partL).slice(0, count);
}

/**
 * @param {string[]} raw
 * @returns {{ sNo: string[], sYes: string[], lNo: string[], lYes: string[] }}
 */
function easyVocabSplitShortLong(raw) {
  const seen = new Set();
  const sNo = [];
  const sYes = [];
  const lNo = [];
  const lYes = [];
  for (const item of raw) {
    const w = item.trim();
    if (!w || w.includes(' ') || seen.has(w)) continue;
    const ln = effectiveLetterCount(w);
    if (ln < NORMAL_EASY_LEN_MIN || ln > NORMAL_EASY_LEN_MAX) continue;
    seen.add(w);
    const spec = countYakutSpecialChars(w) > 0;
    if (ln <= NORMAL_EASY_SHORT_LEN_MAX) {
      if (spec) sYes.push(w);
      else sNo.push(w);
    } else if (spec) lYes.push(w);
    else lNo.push(w);
  }
  return { sNo, sYes, lNo, lYes };
}

/**
 * @param {string[]} noSp
 * @param {string[]} yesSp
 * @returns {string | null}
 */
function pickSpecFromVocab(noSp, yesSp) {
  if (yesSp.length && noSp.length) {
    return Math.random() < NORMAL_SPECIAL_WORD_RATIO
      ? yesSp[Math.floor(Math.random() * yesSp.length)]
      : noSp[Math.floor(Math.random() * noSp.length)];
  }
  if (noSp.length) return noSp[Math.floor(Math.random() * noSp.length)];
  if (yesSp.length) return yesSp[Math.floor(Math.random() * yesSp.length)];
  return null;
}

/**
 * @param {string[]} picked
 * @param {string[]} raw
 * @param {number} count
 */
function padNormalEasyToCount(picked, raw, count) {
  const need = count - picked.length;
  if (need <= 0) return;
  const { sNo, sYes, lNo, lYes } = easyVocabSplitShortLong(raw);
  if (!sNo.length && !sYes.length && !lNo.length && !lYes.length) return;

  const longCap = Math.max(0, Math.round(count * NORMAL_LONG_WORD_MAX_FRACTION));
  let longInPicked = picked.reduce((n, w) => {
    const ln = effectiveLetterCount(w);
    return n + (ln > NORMAL_EASY_SHORT_LEN_MAX && ln <= NORMAL_EASY_LEN_MAX ? 1 : 0);
  }, 0);

  for (let i = 0; i < need; i++) {
    const allowLong = longInPicked < longCap && (lNo.length || lYes.length);
    const wantLong = allowLong && Math.random() < NORMAL_LONG_WORD_MAX_FRACTION;
    /** @type {string | null} */
    let w = wantLong
      ? pickSpecFromVocab(lNo, lYes) || pickSpecFromVocab(sNo, sYes)
      : pickSpecFromVocab(sNo, sYes) || pickSpecFromVocab(lNo, lYes);
    if (!w) break;
    picked.push(w);
    const ln = effectiveLetterCount(w);
    if (ln > NORMAL_EASY_SHORT_LEN_MAX && ln <= NORMAL_EASY_LEN_MAX) longInPicked += 1;
  }
}

/**
 * @param {string[]} items
 * @param {number[]} weights
 * @param {number} k
 * @returns {string[]}
 */
function weightedSampleWithoutReplacement(items, weights, k) {
  if (!items.length || k <= 0) return [];
  const poolIdx = items.map((_, i) => i);
  const w = weights.map((x) => Math.max(0.001, x));
  const out = [];
  const take = Math.min(k, items.length);
  for (let t = 0; t < take; t++) {
    let total = 0;
    for (const i of poolIdx) total += w[i];
    let r = Math.random() * total;
    let chosen = poolIdx[0];
    for (const i of poolIdx) {
      r -= w[i];
      if (r <= 0) {
        chosen = i;
        break;
      }
    }
    out.push(items[chosen]);
    const at = poolIdx.indexOf(chosen);
    poolIdx.splice(at, 1);
  }
  return out;
}

/**
 * Отбор: normal — пул с низким D; expert — взвешенный bias к высокому D (вес ∝ D^γ).
 * @param {string[]} words
 * @param {'normal' | 'expert'} gameDifficulty
 * @param {number} count
 * @returns {string[]}
 */
export function pickWordsForGameDifficulty(words, gameDifficulty, count) {
  const list = (words || []).filter((w) => typeof w === 'string' && w.trim().length > 0);
  if (!list.length || count <= 0) return [];

  if (gameDifficulty === 'expert') {
    const scored = list.map((w) => {
      const t = w.trim();
      return { w: t, score: wordDifficultyScore(t), label: wordDifficultyLabel(t) };
    });
    let pool = scored.filter((x) => x.score >= D_EXPERT_MIN);
    if (pool.length < count) pool = scored.filter((x) => x.score >= D_EXPERT_MIN_RELAX);
    if (pool.length < count) pool = [...scored];
    const wordsOnly = pool.map((x) => x.w);
    const weights = pool.map((x) => Math.max(0.001, x.score ** EXPERT_WEIGHT_POWER));
    if (!wordsOnly.length) return [];
    if (wordsOnly.length >= count) {
      return weightedSampleWithoutReplacement(wordsOnly, weights, count);
    }
    const first = weightedSampleWithoutReplacement(wordsOnly, weights, wordsOnly.length);
    const extra = [];
    while (extra.length < count - first.length) {
      let total = 0;
      for (const wt of weights) total += wt;
      let r = Math.random() * total;
      let idx = 0;
      for (let i = 0; i < wordsOnly.length; i++) {
        r -= weights[i];
        if (r <= 0) {
          idx = i;
          break;
        }
      }
      extra.push(wordsOnly[idx]);
    }
    return first.concat(extra);
  }

  const rawTrimmed = list.map((w) => w.trim());
  /** @type {string[]} */
  const picked = pickNormalEasyRareLong(rawTrimmed, count);
  padNormalEasyToCount(picked, rawTrimmed, count);
  if (picked.length < count && picked.length > 0) {
    while (picked.length < count) {
      picked.push(picked[Math.floor(Math.random() * picked.length)]);
    }
  }
  shuffleInPlace(picked);
  return picked.slice(0, count);
}

/** @type {string[]} */
const FALLBACK_WORD_POOL = [
  'эйэ',
  'кини',
  'мин',
  'эн',
  'ат',
  'от',
  'ый',
  'күн',
  'дьон',
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
