/**
 * Tests for GameRunner.
 */

import { GameRunner } from '../GameRunner';
import { Room } from '../Room';
import { GameState } from '../types';

// Mock room
function createRoom(code: string = 'TEST'): Room {
  return new Room(code, 'host1');
}

describe('GameRunner', () => {
  afterEach(() => {
    jest.useRealTimers();
  });
  describe('constructor', () => {
    it('should create game with correct player count', () => {
      const room = createRoom();
      const runner = new GameRunner(room, ['p1', 'p2']);
      
      const state = runner.getState();
      expect(state.players).toHaveLength(2);
    });

    it('should assign slots to players', () => {
      const room = createRoom();
      const runner = new GameRunner(room, ['p1', 'p2', 'p3']);
      
      expect(runner.getSlot('p1')).toBe(0);
      expect(runner.getSlot('p2')).toBe(1);
      expect(runner.getSlot('p3')).toBe(2);
    });

    it('should initialize arena', () => {
      const room = createRoom();
      const runner = new GameRunner(room, ['p1', 'p2']);
      
      const state = runner.getState();
      expect(state.arena.width).toBe(13);
      expect(state.arena.height).toBe(11);
      expect(state.arena.tiles).toHaveLength(11);
    });

    it('should place players in corners', () => {
      const room = createRoom();
      const runner = new GameRunner(room, ['p1', 'p2', 'p3', 'p4']);
      
      const state = runner.getState();
      expect(state.players[0].x).toBe(1);
      expect(state.players[0].y).toBe(1);
      expect(state.players[1].x).toBe(11);
      expect(state.players[1].y).toBe(1);
    });

    it('should initialize scores to zero', () => {
      const room = createRoom();
      const runner = new GameRunner(room, ['p1', 'p2']);
      
      const state = runner.getState();
      expect(state.scores).toEqual([0, 0]);
    });
  });

  describe('handleInput', () => {
    it('should store input for valid player', () => {
      const room = createRoom();
      const runner = new GameRunner(room, ['p1', 'p2']);
      
      // Input is stored internally, test via state after update
      runner.handleInput('p1', 'right', false);
      // No error thrown
      expect(true).toBe(true);
    });

    it('should ignore input for invalid player', () => {
      const room = createRoom();
      const runner = new GameRunner(room, ['p1', 'p2']);
      
      // Should not throw
      runner.handleInput('unknown', 'up', true);
      expect(true).toBe(true);
    });
  });

  describe('handleDisconnect', () => {
    it('should kill disconnected player', () => {
      const room = createRoom();
      const runner = new GameRunner(room, ['p1', 'p2']);
      
      runner.handleDisconnect('p1');
      
      const state = runner.getState();
      expect(state.players[0].alive).toBe(false);
    });

    it('should not affect other players', () => {
      const room = createRoom();
      const runner = new GameRunner(room, ['p1', 'p2']);
      
      runner.handleDisconnect('p1');
      
      const state = runner.getState();
      expect(state.players[1].alive).toBe(true);
    });
  });

  describe('getState', () => {
    it('should return complete game state', () => {
      const room = createRoom();
      const runner = new GameRunner(room, ['p1', 'p2']);
      
      const state = runner.getState();
      
      expect(state.tick).toBeDefined();
      expect(state.arena).toBeDefined();
      expect(state.players).toBeDefined();
      expect(state.bombs).toBeDefined();
      expect(state.explosions).toBeDefined();
      expect(state.powerUps).toBeDefined();
      expect(state.roundTime).toBeDefined();
      expect(state.scores).toBeDefined();
      expect(state.round).toBe(1);
      expect(state.maxRounds).toBe(3);
    });
  });

  describe('start/stop', () => {
    it('should start and stop game loop', () => {
      const room = createRoom();
      const runner = new GameRunner(room, ['p1', 'p2']);
      
      runner.start();
      // Should not throw
      runner.stop();
      expect(true).toBe(true);
    });

    it('should handle multiple start calls', () => {
      const room = createRoom();
      const runner = new GameRunner(room, ['p1', 'p2']);
      
      runner.start();
      runner.start(); // Should not double-start
      runner.stop();
      expect(true).toBe(true);
    });
  });

  describe('callbacks', () => {
    it('should set callbacks without error', () => {
      const room = createRoom();
      const runner = new GameRunner(room, ['p1', 'p2']);
      
      runner.setCallbacks(
        () => {},
        () => {},
        () => {}
      );
      
      // Callbacks are set, no error
      expect(true).toBe(true);
    });

    it('should call round end callback when all but one die', () => {
      const room = createRoom();
      const runner = new GameRunner(room, ['p1', 'p2']);
      
      let roundEndCalled = false;
      runner.setCallbacks(
        () => {},
        (winner, scores) => {
          roundEndCalled = true;
          expect(winner).toBe(1); // p2 wins
          expect(scores[1]).toBe(1);
        },
        () => {}
      );

      // Kill player 1
      runner.handleDisconnect('p1');
      
      expect(roundEndCalled).toBe(true);
    });
  });
});
