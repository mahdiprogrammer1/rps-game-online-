class SoundEffects {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.muted = localStorage.getItem('rps_muted') === 'true';
    }
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('rps_muted', String(this.muted));
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, startVol: number, endVol: number, delay = 0) {
    if (this.muted) return;
    try {
      const ctx = this.init();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      
      gain.gain.setValueAtTime(startVol, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(endVol || 0.0001, ctx.currentTime + delay + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    } catch (e) {
      // AudioContext might be blocked or not supported
    }
  }

  playClick() {
    this.playTone(800, 'sine', 0.08, 0.1, 0.01);
  }

  playTick() {
    this.playTone(600, 'triangle', 0.05, 0.05, 0.01);
  }

  playCountdown() {
    this.playTone(440, 'square', 0.15, 0.15, 0.01);
  }

  playCountdownStart() {
    this.playTone(880, 'square', 0.3, 0.2, 0.01);
  }

  playChat() {
    this.playTone(987.77, 'sine', 0.06, 0.1, 0.01);
    this.playTone(1318.51, 'sine', 0.08, 0.1, 0.01, 0.04);
  }

  playWin() {
    this.playTone(523.25, 'sine', 0.12, 0.15, 0.02, 0);      // C5
    this.playTone(659.25, 'sine', 0.12, 0.15, 0.02, 0.08);   // E5
    this.playTone(783.99, 'sine', 0.12, 0.15, 0.02, 0.16);   // G5
    this.playTone(1046.50, 'sine', 0.25, 0.2, 0.02, 0.24);   // C6
  }

  playLose() {
    try {
      if (this.muted) return;
      const ctx = this.init();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.45);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {}
  }

  playDraw() {
    this.playTone(349.23, 'triangle', 0.15, 0.15, 0.01, 0);
    this.playTone(349.23, 'triangle', 0.15, 0.15, 0.01, 0.15);
  }

  playMatchFound() {
    this.playTone(587.33, 'sine', 0.08, 0.15, 0.01, 0);
    this.playTone(880, 'sine', 0.08, 0.15, 0.01, 0.08);
    this.playTone(1174.66, 'sine', 0.3, 0.2, 0.01, 0.16);
  }
}

export const sound = new SoundEffects();
