/**
 * Sound system for Detonator using Web Audio API.
 * Generates retro-style synthesized sounds.
 */

type SoundType =
  | 'bombPlace'
  | 'explosion'
  | 'death'
  | 'powerUp'
  | 'roundStart'
  | 'roundEnd'
  | 'victory'
  | 'blockBreak';

class SoundSystem {
  private static instance: SoundSystem;
  private context: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.3;

  private constructor() {}

  static getInstance(): SoundSystem {
    if (!SoundSystem.instance) {
      SoundSystem.instance = new SoundSystem();
    }
    return SoundSystem.instance;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    
    if (!this.context) {
      try {
        this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {
        return null;
      }
    }
    
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    
    return this.context;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  getVolume(): number {
    return this.volume;
  }

  play(sound: SoundType): void {
    if (!this.enabled) return;
    
    const ctx = this.getContext();
    if (!ctx) return;

    switch (sound) {
      case 'bombPlace':
        this.playBombPlace(ctx);
        break;
      case 'explosion':
        this.playExplosion(ctx);
        break;
      case 'death':
        this.playDeath(ctx);
        break;
      case 'powerUp':
        this.playPowerUp(ctx);
        break;
      case 'roundStart':
        this.playRoundStart(ctx);
        break;
      case 'roundEnd':
        this.playRoundEnd(ctx);
        break;
      case 'victory':
        this.playVictory(ctx);
        break;
      case 'blockBreak':
        this.playBlockBreak(ctx);
        break;
    }
  }

  private playBombPlace(ctx: AudioContext): void {
    // Short thud sound for placing a bomb
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  private playExplosion(ctx: AudioContext): void {
    // Explosive noise burst
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      // Noise with exponential decay
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 8);
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    // Low-pass filter for boom
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(ctx.currentTime);
  }

  private playDeath(ctx: AudioContext): void {
    // Descending tone for death
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4);
    
    gain.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  }

  private playPowerUp(ctx: AudioContext): void {
    // Ascending arpeggio for power-up
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'square';
      osc.frequency.value = freq;
      
      const startTime = ctx.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.3, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
      
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }

  private playRoundStart(ctx: AudioContext): void {
    // Ascending fanfare
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'square';
      osc.frequency.value = freq;
      
      const startTime = ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.35, startTime + 0.03);
      gain.gain.setValueAtTime(this.volume * 0.35, startTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  private playRoundEnd(ctx: AudioContext): void {
    // Short descending tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }

  private playVictory(ctx: AudioContext): void {
    // Victory fanfare
    const melody = [
      { freq: 523.25, time: 0, dur: 0.15 },      // C5
      { freq: 659.25, time: 0.15, dur: 0.15 },   // E5
      { freq: 783.99, time: 0.30, dur: 0.15 },   // G5
      { freq: 1046.50, time: 0.45, dur: 0.3 },   // C6
    ];
    
    melody.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'square';
      osc.frequency.value = freq;
      
      const startTime = ctx.currentTime + time;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.35, startTime + 0.02);
      gain.gain.setValueAtTime(this.volume * 0.35, startTime + dur - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + dur);
      
      osc.start(startTime);
      osc.stop(startTime + dur);
    });
  }

  private playBlockBreak(ctx: AudioContext): void {
    // Crunchy breaking sound
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 15) * Math.sin(t * 50);
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime);
    
    noise.connect(gain);
    gain.connect(ctx.destination);
    
    noise.start(ctx.currentTime);
  }
}

export const Sound = SoundSystem.getInstance();
