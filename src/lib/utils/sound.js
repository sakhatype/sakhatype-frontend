/**
 * Sound effects manager for typing
 */

class SoundManager {
  constructor() {
    this.enabled = true;
    this.audioContext = null;
    this.sounds = {};
  }

  init() {
    if (typeof window === 'undefined') return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Play a simple beep sound using Web Audio API
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in seconds
   * @param {number} volume - Volume 0-1
   */
  playBeep(frequency = 800, duration = 0.05, volume = 0.1) {
    if (!this.enabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.warn('Failed to play sound:', e);
    }
  }

  /**
   * Play keystroke sound
   */
  playKeystroke() {
    this.playBeep(600, 0.03, 0.08);
  }

  /**
   * Play correct word sound
   */
  playCorrect() {
    this.playBeep(800, 0.08, 0.12);
  }

  /**
   * Play incorrect word sound
   */
  playIncorrect() {
    this.playBeep(200, 0.15, 0.15);
  }

  /**
   * Play test complete sound
   */
  playComplete() {
    setTimeout(() => this.playBeep(600, 0.1, 0.1), 0);
    setTimeout(() => this.playBeep(800, 0.1, 0.1), 100);
    setTimeout(() => this.playBeep(1000, 0.15, 0.12), 200);
  }
}

export const soundManager = new SoundManager();

// Initialize on first import
if (typeof window !== 'undefined') {
  soundManager.init();
}
