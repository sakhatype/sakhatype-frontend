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

    const ctx = this.audioContext;
    const run = () => {
      try {
        const t0 = ctx.currentTime;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        const v = Math.max(volume, 0.0001);
        gainNode.gain.setValueAtTime(v, t0);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

        oscillator.start(t0);
        oscillator.stop(t0 + duration);
      } catch (e) {
        console.warn('Failed to play sound:', e);
      }
    };

    // Каждый вызов — отдельный осциллятор: звуки накладываются (спам по вводу).
    if (ctx.state === 'suspended') void ctx.resume().then(run);
    else run();
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
