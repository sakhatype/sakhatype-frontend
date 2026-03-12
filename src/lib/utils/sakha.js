/**
 * Sakha (Yakut) keyboard bindings.
 * Maps number keys to Sakha-specific Unicode characters.
 */
export const DEFAULT_SAKHA_BINDS = {
  '4': 'ҥ', // U+04A5
  '5': 'ҕ', // U+0493
  '6': 'ө', // U+04E9
  '7': 'ү', // U+04AF
  '8': 'һ', // U+04BB
};

/**
 * Checks if a character is a Sakha-specific character
 * @param {string} char
 * @returns {boolean}
 */
export function isSakhaChar(char) {
  return Object.values(DEFAULT_SAKHA_BINDS).includes(char);
}

/**
 * Gets the hint text for a Sakha character based on custom bindings
 * @param {string} char
 * @param {Object} customBindings
 * @returns {string|null}
 */
export function getSakhaHint(char, customBindings = {}) {
  const bindings = { ...DEFAULT_SAKHA_BINDS, ...customBindings };
  for (const [key, value] of Object.entries(bindings)) {
    if (value === char) {
      return `${key}→${char}`;
    }
  }
  return null;
}

/**
 * Maps a keyboard event key to Sakha character if applicable
 * @param {string} key
 * @param {Object} customBindings
 * @returns {string|null}
 */
export function mapToSakha(key, customBindings = {}) {
  const bindings = { ...DEFAULT_SAKHA_BINDS, ...customBindings };
  return bindings[key] || null;
}
