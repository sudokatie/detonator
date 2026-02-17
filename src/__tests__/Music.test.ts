import { Music } from '../game/Music';

// Mock AudioContext
const mockOscillator = {
  type: 'sine' as OscillatorType,
  frequency: { value: 440 },
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
};

const mockGain = {
  gain: {
    value: 1,
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
  },
  connect: jest.fn(),
};

const mockAudioContext = {
  createOscillator: jest.fn(() => ({ ...mockOscillator })),
  createGain: jest.fn(() => ({ ...mockGain })),
  destination: {},
  currentTime: 0,
  state: 'running',
  resume: jest.fn().mockResolvedValue(undefined),
};

// Mock window.AudioContext
(global as any).window = {
  AudioContext: jest.fn(() => mockAudioContext),
};

describe('Music System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Music.stop();
    Music.setEnabled(true);
    Music.setVolume(0.15);
  });

  afterEach(() => {
    Music.stop();
  });

  describe('singleton pattern', () => {
    it('returns the same instance', () => {
      const instance1 = Music;
      const instance2 = Music;
      expect(instance1).toBe(instance2);
    });
  });

  describe('enabled state', () => {
    it('can be enabled and disabled', () => {
      Music.setEnabled(false);
      expect(Music.isEnabled()).toBe(false);
      Music.setEnabled(true);
      expect(Music.isEnabled()).toBe(true);
    });

    it('stops music when disabled', () => {
      Music.play();
      Music.setEnabled(false);
      expect(Music.isCurrentlyPlaying()).toBe(false);
    });
  });

  describe('volume control', () => {
    it('can get and set volume', () => {
      expect(Music.getVolume()).toBe(0.15);
      Music.setVolume(0.5);
      expect(Music.getVolume()).toBe(0.5);
    });

    it('clamps volume to valid range', () => {
      Music.setVolume(-1);
      expect(Music.getVolume()).toBe(0);
      Music.setVolume(2);
      expect(Music.getVolume()).toBe(1);
    });
  });

  describe('playback control', () => {
    it('can play and stop', () => {
      expect(Music.isCurrentlyPlaying()).toBe(false);
      Music.play();
      expect(Music.isCurrentlyPlaying()).toBe(true);
      Music.stop();
      expect(Music.isCurrentlyPlaying()).toBe(false);
    });

    it('can toggle playback', () => {
      expect(Music.isCurrentlyPlaying()).toBe(false);
      Music.toggle();
      expect(Music.isCurrentlyPlaying()).toBe(true);
      Music.toggle();
      expect(Music.isCurrentlyPlaying()).toBe(false);
    });

    it('does not play when disabled', () => {
      Music.setEnabled(false);
      Music.play();
      expect(Music.isCurrentlyPlaying()).toBe(false);
    });
  });

  describe('audio context', () => {
    it('creates oscillators when playing', () => {
      Music.play();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });
  });
});
