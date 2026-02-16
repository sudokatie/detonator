import { Sound } from '../game/Sound';

// Mock AudioContext
const mockOscillator = {
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  type: 'sine',
  frequency: {
    value: 0,
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
  },
};

const mockGain = {
  connect: jest.fn(),
  gain: {
    value: 0,
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
  },
};

const mockFilter = {
  connect: jest.fn(),
  type: 'lowpass',
  frequency: {
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
  },
};

const mockBufferSource = {
  buffer: null,
  connect: jest.fn(),
  start: jest.fn(),
};

const mockAudioContext = {
  currentTime: 0,
  state: 'running',
  sampleRate: 44100,
  resume: jest.fn().mockResolvedValue(undefined),
  createOscillator: jest.fn(() => ({ ...mockOscillator })),
  createGain: jest.fn(() => ({ ...mockGain })),
  createBiquadFilter: jest.fn(() => ({ ...mockFilter })),
  createBufferSource: jest.fn(() => ({ ...mockBufferSource })),
  createBuffer: jest.fn((channels, length, sampleRate) => ({
    getChannelData: jest.fn(() => new Float32Array(length)),
  })),
  destination: {},
};

// Mock window.AudioContext
(global as any).window = {
  AudioContext: jest.fn(() => mockAudioContext),
};

describe('Sound System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Sound.setEnabled(true);
    Sound.setVolume(0.3);
  });

  describe('singleton pattern', () => {
    it('returns the same instance', () => {
      const instance1 = Sound;
      const instance2 = Sound;
      expect(instance1).toBe(instance2);
    });
  });

  describe('enabled state', () => {
    it('can be enabled and disabled', () => {
      Sound.setEnabled(false);
      expect(Sound.isEnabled()).toBe(false);
      
      Sound.setEnabled(true);
      expect(Sound.isEnabled()).toBe(true);
    });

    it('does not play sounds when disabled', () => {
      Sound.setEnabled(false);
      Sound.play('explosion');
      
      // AudioContext should not be created when disabled
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe('volume control', () => {
    it('can set and get volume', () => {
      Sound.setVolume(0.5);
      expect(Sound.getVolume()).toBe(0.5);
    });

    it('clamps volume to 0-1 range', () => {
      Sound.setVolume(-0.5);
      expect(Sound.getVolume()).toBe(0);
      
      Sound.setVolume(1.5);
      expect(Sound.getVolume()).toBe(1);
    });
  });

  describe('sound playback', () => {
    it('plays bombPlace sound', () => {
      Sound.play('bombPlace');
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('plays explosion sound', () => {
      Sound.play('explosion');
      expect(mockAudioContext.createBuffer).toHaveBeenCalled();
    });

    it('plays death sound', () => {
      Sound.play('death');
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('plays powerUp sound', () => {
      Sound.play('powerUp');
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('plays roundStart sound', () => {
      Sound.play('roundStart');
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('plays roundEnd sound', () => {
      Sound.play('roundEnd');
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('plays victory sound', () => {
      Sound.play('victory');
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it('plays blockBreak sound', () => {
      Sound.play('blockBreak');
      expect(mockAudioContext.createBuffer).toHaveBeenCalled();
    });
  });
});
