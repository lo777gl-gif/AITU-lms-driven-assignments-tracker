/**
 * Procedural Audio Synthesizer using Web Audio API
 * Provides instant sound feedback for RPG actions (clicks, EXP gains, Level Up fanfares)
 * No external mp3 files required.
 */

class SoundEffects {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialized lazily on first user interaction
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Short gentle tick for checking a subquest
   */
  public playSubquestCheck() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08); // A5

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch {
      // Ignore audio policy errors
    }
  }

  /**
   * Harmonious sparkle chime for gaining EXP
   */
  public playExpChime() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.05);

        gain.gain.setValueAtTime(0.1, this.ctx!.currentTime + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.05 + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + idx * 0.05);
        osc.stop(this.ctx!.currentTime + idx * 0.05 + 0.22);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Triumphant Level Up Fanfare
   */
  public playLevelUpFanfare() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // Chord sequence: G4 -> C5 -> E5 -> G5 -> C6 (bright triumph)
      const chord = [
        { f: 392.0, delay: 0, dur: 0.15 },
        { f: 523.25, delay: 0.1, dur: 0.18 },
        { f: 659.25, delay: 0.2, dur: 0.2 },
        { f: 783.99, delay: 0.3, dur: 0.25 },
        { f: 1046.5, delay: 0.45, dur: 0.6 },
      ];

      chord.forEach(({ f, delay, dur }) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, this.ctx!.currentTime + delay);

        // Lowpass filter for warm retro sound
        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, this.ctx!.currentTime + delay);

        gain.gain.setValueAtTime(0.15, this.ctx!.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + delay + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + delay);
        osc.stop(this.ctx!.currentTime + delay + dur + 0.05);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Quest complete flourish
   */
  public playQuestComplete() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [
        { f: 440, delay: 0 },
        { f: 554.37, delay: 0.08 },
        { f: 659.25, delay: 0.16 },
        { f: 880, delay: 0.24 },
      ];

      notes.forEach(({ f, delay }) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.ctx!.currentTime + delay);

        gain.gain.setValueAtTime(0.12, this.ctx!.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + delay + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + delay);
        osc.stop(this.ctx!.currentTime + delay + 0.27);
      });
    } catch {
      // Ignore
    }
  }
}

export const soundEffects = new SoundEffects();
