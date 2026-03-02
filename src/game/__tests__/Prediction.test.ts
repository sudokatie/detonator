import {
  PredictionSystem,
  DEFAULT_PREDICTION_CONFIG,
  smoothstep,
  expInterp,
} from '../Prediction';
import type { GameState } from '../Multiplayer';

const createGameState = (players: Array<{ slot: number; x: number; y: number }>): GameState => ({
  tick: 0,
  arena: { width: 15, height: 13, tiles: [] },
  players: players.map((p) => ({
    ...p,
    alive: true,
    bombs: 1,
    fire: 1,
    speed: 1,
    animationFrame: 0,
  })),
  bombs: [],
  explosions: [],
  powerUps: [],
  roundTime: 180,
  scores: [0, 0],
  round: 1,
  maxRounds: 3,
});

describe('PredictionSystem', () => {
  let prediction: PredictionSystem;

  beforeEach(() => {
    prediction = new PredictionSystem(0);
  });

  describe('configuration', () => {
    it('should use default config', () => {
      expect(prediction['config']).toEqual(DEFAULT_PREDICTION_CONFIG);
    });

    it('should allow custom config', () => {
      const custom = new PredictionSystem(0, { enabled: false, interpolationDelay: 50 });
      expect(custom['config'].enabled).toBe(false);
      expect(custom['config'].interpolationDelay).toBe(50);
    });

    it('should update config', () => {
      prediction.setConfig({ enabled: false });
      expect(prediction['config'].enabled).toBe(false);
    });
  });

  describe('input recording', () => {
    it('should record inputs with sequence numbers', () => {
      const seq1 = prediction.recordInput('up', false);
      const seq2 = prediction.recordInput('down', false);
      const seq3 = prediction.recordInput(null, true);

      expect(seq1).toBe(1);
      expect(seq2).toBe(2);
      expect(seq3).toBe(3);
    });

    it('should track sequence number', () => {
      prediction.recordInput('up', false);
      prediction.recordInput('down', false);
      expect(prediction.getSequenceNumber()).toBe(2);
    });

    it('should clean up old inputs', () => {
      jest.useFakeTimers();
      
      prediction.recordInput('up', false);
      
      // Advance time past cleanup threshold
      jest.advanceTimersByTime(1100);
      
      prediction.recordInput('down', false);
      
      // Old input should be cleaned up
      expect(prediction['inputHistory'].length).toBe(1);
      
      jest.useRealTimers();
    });
  });

  describe('movement prediction', () => {
    it('should predict movement up', () => {
      const pos = { x: 5, y: 5 };
      const result = prediction.predictMovement(pos, 'up', 3, 0.016);
      expect(result.y).toBeLessThan(5);
      expect(result.x).toBe(5);
    });

    it('should predict movement down', () => {
      const pos = { x: 5, y: 5 };
      const result = prediction.predictMovement(pos, 'down', 3, 0.016);
      expect(result.y).toBeGreaterThan(5);
    });

    it('should predict movement left', () => {
      const pos = { x: 5, y: 5 };
      const result = prediction.predictMovement(pos, 'left', 3, 0.016);
      expect(result.x).toBeLessThan(5);
    });

    it('should predict movement right', () => {
      const pos = { x: 5, y: 5 };
      const result = prediction.predictMovement(pos, 'right', 3, 0.016);
      expect(result.x).toBeGreaterThan(5);
    });

    it('should not move when direction is null', () => {
      const pos = { x: 5, y: 5 };
      const result = prediction.predictMovement(pos, null, 3, 0.016);
      expect(result.x).toBe(5);
      expect(result.y).toBe(5);
    });

    it('should accumulate movement over frames', () => {
      let pos = { x: 5, y: 5 };
      pos = prediction.predictMovement(pos, 'right', 3, 0.016);
      pos = prediction.predictMovement(pos, 'right', 3, 0.016);
      pos = prediction.predictMovement(pos, 'right', 3, 0.016);
      expect(pos.x).toBeGreaterThan(5.1);
    });

    it('should not predict when disabled', () => {
      prediction.setConfig({ enabled: false });
      const pos = { x: 5, y: 5 };
      const result = prediction.predictMovement(pos, 'right', 3, 0.016);
      expect(result.x).toBe(5);
      expect(result.y).toBe(5);
    });
  });

  describe('server reconciliation', () => {
    it('should accept server state', () => {
      const state = createGameState([
        { slot: 0, x: 5, y: 5 },
        { slot: 1, x: 10, y: 10 },
      ]);
      const result = prediction.receiveServerState(state);
      expect(result).toBe(state);
    });

    it('should snap to server position when difference is large', () => {
      // Predict ahead
      prediction.predictMovement({ x: 5, y: 5 }, 'right', 3, 1); // Move 3 tiles
      
      // Server says we're back at 5,5
      const state = createGameState([{ slot: 0, x: 5, y: 5 }]);
      prediction.receiveServerState(state);
      
      // Predicted position should snap back
      expect(prediction['predictedPosition']?.x).toBe(5);
    });

    it('should buffer states for interpolation', () => {
      prediction.receiveServerState(createGameState([{ slot: 0, x: 1, y: 1 }]));
      prediction.receiveServerState(createGameState([{ slot: 0, x: 2, y: 2 }]));
      prediction.receiveServerState(createGameState([{ slot: 0, x: 3, y: 3 }]));
      
      expect(prediction['stateBuffer'].length).toBe(3);
    });
  });

  describe('interpolation', () => {
    it('should return null when no states', () => {
      const result = prediction.getInterpolatedState();
      expect(result).toBeNull();
    });

    it('should return single state when only one available', () => {
      const state = createGameState([{ slot: 0, x: 5, y: 5 }]);
      prediction.receiveServerState(state);
      const result = prediction.getInterpolatedState();
      expect(result).toEqual(state);
    });

    it('should interpolate between states', () => {
      jest.useFakeTimers();
      
      const state1 = createGameState([
        { slot: 0, x: 0, y: 0 },
        { slot: 1, x: 0, y: 0 },
      ]);
      prediction.receiveServerState(state1);
      
      jest.advanceTimersByTime(50);
      
      const state2 = createGameState([
        { slot: 0, x: 10, y: 10 },
        { slot: 1, x: 10, y: 10 },
      ]);
      prediction.receiveServerState(state2);
      
      // Get interpolated state (other player should be between states)
      const result = prediction.getInterpolatedState();
      expect(result).not.toBeNull();
      
      jest.useRealTimers();
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      prediction.recordInput('up', false);
      prediction.receiveServerState(createGameState([{ slot: 0, x: 5, y: 5 }]));
      prediction.predictMovement({ x: 5, y: 5 }, 'right', 3, 0.016);
      
      prediction.reset();
      
      expect(prediction['inputHistory'].length).toBe(0);
      expect(prediction['stateBuffer'].length).toBe(0);
      expect(prediction.getSequenceNumber()).toBe(0);
      expect(prediction['predictedPosition']).toBeNull();
    });
  });
});

describe('interpolation helpers', () => {
  describe('smoothstep', () => {
    it('should return 0 at t=0', () => {
      expect(smoothstep(0)).toBe(0);
    });

    it('should return 1 at t=1', () => {
      expect(smoothstep(1)).toBe(1);
    });

    it('should return 0.5 at t=0.5', () => {
      expect(smoothstep(0.5)).toBe(0.5);
    });

    it('should ease in and out', () => {
      // At t=0.25, should be less than 0.25 (easing in)
      expect(smoothstep(0.25)).toBeLessThan(0.25);
      // At t=0.75, should be greater than 0.75 (easing out)
      expect(smoothstep(0.75)).toBeGreaterThan(0.75);
    });
  });

  describe('expInterp', () => {
    it('should approach target over time', () => {
      let value = 0;
      value = expInterp(value, 10, 5, 0.1);
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThan(10);
      
      // Continue interpolating
      for (let i = 0; i < 50; i++) {
        value = expInterp(value, 10, 5, 0.1);
      }
      expect(value).toBeCloseTo(10, 1);
    });

    it('should not overshoot target', () => {
      let value = 0;
      for (let i = 0; i < 100; i++) {
        value = expInterp(value, 10, 10, 0.1);
      }
      expect(value).toBeLessThanOrEqual(10);
    });
  });
});
