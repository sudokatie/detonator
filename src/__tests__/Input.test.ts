/**
 * @jest-environment jsdom
 */
import { InputHandler } from '../game/Input';
import { Direction } from '../game/types';

describe('InputHandler', () => {
  let input: InputHandler;

  beforeEach(() => {
    input = new InputHandler();
  });

  describe('constructor', () => {
    it('should initialize with no direction', () => {
      expect(input.getDirection(0)).toBe(Direction.None);
      expect(input.getDirection(1)).toBe(Direction.None);
    });
  });

  describe('getDirection', () => {
    it('should return None for invalid player', () => {
      expect(input.getDirection(99)).toBe(Direction.None);
    });
  });

  describe('isKeyPressed', () => {
    it('should return false for unpressed keys', () => {
      expect(input.isKeyPressed('w')).toBe(false);
      expect(input.isKeyPressed('ArrowUp')).toBe(false);
    });
  });

  describe('reset', () => {
    it('should clear all state', () => {
      input.reset();
      expect(input.getDirection(0)).toBe(Direction.None);
      expect(input.isKeyPressed('w')).toBe(false);
    });
  });

  describe('setCallback', () => {
    it('should accept callback without error', () => {
      const callback = jest.fn();
      expect(() => input.setCallback(callback)).not.toThrow();
    });
  });

  describe('attach/detach', () => {
    it('should not throw in non-browser environment', () => {
      expect(() => input.attach()).not.toThrow();
      expect(() => input.detach()).not.toThrow();
    });
  });

  describe('touch input for player 0', () => {
    beforeEach(() => {
      input.attach();
    });

    afterEach(() => {
      input.detach();
    });

    function createTouchEvent(type: string, x: number, y: number): TouchEvent {
      const touch = {
        clientX: x,
        clientY: y,
        identifier: 0,
        target: document.body,
      } as Touch;
      
      return new TouchEvent(type, {
        touches: type === 'touchstart' ? [touch] : [],
        changedTouches: [touch],
      });
    }

    it('should handle swipe right', () => {
      window.dispatchEvent(createTouchEvent('touchstart', 100, 100));
      window.dispatchEvent(createTouchEvent('touchend', 200, 100));
      expect(input.getDirection(0)).toBe(Direction.Right);
    });

    it('should handle swipe left', () => {
      window.dispatchEvent(createTouchEvent('touchstart', 200, 100));
      window.dispatchEvent(createTouchEvent('touchend', 100, 100));
      expect(input.getDirection(0)).toBe(Direction.Left);
    });

    it('should handle swipe up', () => {
      window.dispatchEvent(createTouchEvent('touchstart', 100, 200));
      window.dispatchEvent(createTouchEvent('touchend', 100, 100));
      expect(input.getDirection(0)).toBe(Direction.Up);
    });

    it('should handle swipe down', () => {
      window.dispatchEvent(createTouchEvent('touchstart', 100, 100));
      window.dispatchEvent(createTouchEvent('touchend', 100, 200));
      expect(input.getDirection(0)).toBe(Direction.Down);
    });

    it('should call bomb callback on tap', () => {
      const callback = jest.fn();
      input.setCallback(callback);
      
      window.dispatchEvent(createTouchEvent('touchstart', 100, 100));
      window.dispatchEvent(createTouchEvent('touchend', 105, 105));
      
      expect(callback).toHaveBeenCalledWith(0, 'bomb');
    });
  });
});
