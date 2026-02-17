/**
 * Music system for Detonator using Web Audio API.
 * Generates retro-style chiptune background music.
 */

type MusicTrack = 'gameplay' | 'menu' | 'victory';

interface Note {
  frequency: number;
  duration: number;
  volume?: number;
}

class MusicSystem {
  private static instance: MusicSystem;
  private context: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.15;
  private currentTrack: MusicTrack | null = null;
  private isPlaying: boolean = false;
  private scheduledNotes: number[] = [];
  private loopTimeout: ReturnType<typeof setTimeout> | null = null;

  private constructor() {}

  static getInstance(): MusicSystem {
    if (!MusicSystem.instance) {
      MusicSystem.instance = new MusicSystem();
    }
    return MusicSystem.instance;
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
    if (!enabled) {
      this.stop();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  getVolume(): number {
    return this.volume;
  }

  // Note frequencies (A4 = 440Hz based)
  private noteToFreq(note: string): number {
    const notes: Record<string, number> = {
      'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61,
      'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
      'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
      'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46,
      'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
    };
    return notes[note] || 440;
  }

  // Simple square wave oscillator
  private playNote(freq: number, startTime: number, duration: number, vol: number = 1): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(this.volume * vol * 0.5, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.9);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // Gameplay track - energetic, driving
  private getGameplayNotes(): Note[] {
    const bpm = 140;
    const beat = 60 / bpm;
    const eighth = beat / 2;
    
    // Simple catchy loop (8 bars)
    const melody = [
      // Bar 1-2: Main riff
      { note: 'E4', dur: eighth },
      { note: 'E4', dur: eighth },
      { note: 'G4', dur: eighth },
      { note: 'E4', dur: eighth },
      { note: 'D4', dur: eighth },
      { note: 'E4', dur: beat },
      { note: 'C4', dur: eighth },
      // Bar 3-4
      { note: 'E4', dur: eighth },
      { note: 'E4', dur: eighth },
      { note: 'G4', dur: eighth },
      { note: 'A4', dur: eighth },
      { note: 'G4', dur: beat },
      { note: 'E4', dur: beat },
      // Bar 5-6: Variation
      { note: 'G4', dur: eighth },
      { note: 'G4', dur: eighth },
      { note: 'A4', dur: eighth },
      { note: 'G4', dur: eighth },
      { note: 'E4', dur: eighth },
      { note: 'D4', dur: beat },
      { note: 'C4', dur: eighth },
      // Bar 7-8: Resolution
      { note: 'D4', dur: eighth },
      { note: 'E4', dur: eighth },
      { note: 'G4', dur: eighth },
      { note: 'E4', dur: eighth },
      { note: 'D4', dur: beat },
      { note: 'C4', dur: beat },
    ];
    
    return melody.map(n => ({
      frequency: this.noteToFreq(n.note),
      duration: n.dur,
    }));
  }

  private scheduleTrack(notes: Note[]): number {
    const ctx = this.getContext();
    if (!ctx) return 0;

    let time = ctx.currentTime + 0.1;
    let totalDuration = 0;

    for (const note of notes) {
      this.playNote(note.frequency, time, note.duration, note.volume ?? 1);
      time += note.duration;
      totalDuration += note.duration;
    }

    return totalDuration;
  }

  play(track: MusicTrack = 'gameplay'): void {
    if (!this.enabled) return;
    
    // Stop current track if different
    if (this.isPlaying && this.currentTrack !== track) {
      this.stop();
    }
    
    if (this.isPlaying) return;
    
    this.currentTrack = track;
    this.isPlaying = true;
    
    this.loopTrack();
  }

  private loopTrack(): void {
    if (!this.isPlaying || !this.enabled) return;

    let notes: Note[];
    switch (this.currentTrack) {
      case 'gameplay':
        notes = this.getGameplayNotes();
        break;
      default:
        notes = this.getGameplayNotes();
    }

    const duration = this.scheduleTrack(notes);
    
    // Schedule next loop
    this.loopTimeout = setTimeout(() => {
      if (this.isPlaying) {
        this.loopTrack();
      }
    }, duration * 1000 - 100); // Slight overlap to avoid gaps
  }

  stop(): void {
    this.isPlaying = false;
    this.currentTrack = null;
    
    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = null;
    }
  }

  toggle(): void {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  // For testing
  static resetInstance(): void {
    MusicSystem.instance = undefined as any;
  }
}

export const Music = MusicSystem.getInstance();
export { MusicSystem };
