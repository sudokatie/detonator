import { Direction } from './types';
import { PLAYER_CONTROLS } from './constants';

export type InputCallback = (playerId: number, action: 'move' | 'bomb', direction?: Direction) => void;

// Minimum swipe distance in pixels
const SWIPE_THRESHOLD = 30;

export class InputHandler {
  private keyStates: Map<string, boolean>;
  private playerDirections: Direction[];
  private callback: InputCallback | null;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;

  // Touch tracking for player 0 on mobile
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;

  constructor() {
    this.keyStates = new Map();
    this.playerDirections = [Direction.None, Direction.None, Direction.None, Direction.None];
    this.callback = null;
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
  }

  setCallback(callback: InputCallback): void {
    this.callback = callback;
  }

  attach(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.boundKeyDown);
      window.addEventListener('keyup', this.boundKeyUp);
      window.addEventListener('touchstart', this.handleTouchStart, { passive: false });
      window.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    }
  }

  detach(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.boundKeyDown);
      window.removeEventListener('keyup', this.boundKeyUp);
      window.removeEventListener('touchstart', this.handleTouchStart);
      window.removeEventListener('touchend', this.handleTouchEnd);
    }
  }

  private handleTouchStart = (event: TouchEvent): void => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
    event.preventDefault();
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    if (event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;
    const deltaTime = Date.now() - this.touchStartTime;
    event.preventDefault();

    // Quick tap = place bomb for player 0
    if (Math.abs(deltaX) < SWIPE_THRESHOLD && Math.abs(deltaY) < SWIPE_THRESHOLD && deltaTime < 200) {
      if (this.callback) {
        this.callback(0, 'bomb');
      }
      return;
    }

    // Swipe = movement for player 0
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > SWIPE_THRESHOLD) {
        this.playerDirections[0] = Direction.Right;
      } else if (deltaX < -SWIPE_THRESHOLD) {
        this.playerDirections[0] = Direction.Left;
      }
    } else {
      // Vertical swipe
      if (deltaY > SWIPE_THRESHOLD) {
        this.playerDirections[0] = Direction.Down;
      } else if (deltaY < -SWIPE_THRESHOLD) {
        this.playerDirections[0] = Direction.Up;
      }
    }
    
    // Clear direction after a short delay for continuous movement
    setTimeout(() => {
      this.playerDirections[0] = Direction.None;
    }, 150);
  };

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.keyStates.get(e.key)) return; // Already pressed
    this.keyStates.set(e.key, true);

    for (let playerId = 0; playerId < PLAYER_CONTROLS.length; playerId++) {
      const controls = PLAYER_CONTROLS[playerId];
      
      // Check movement
      const direction = this.keyToDirection(e.key, controls);
      if (direction !== Direction.None) {
        this.playerDirections[playerId] = direction;
        e.preventDefault();
      }

      // Check bomb
      if (e.key === controls.bomb) {
        if (this.callback) {
          this.callback(playerId, 'bomb');
        }
        e.preventDefault();
      }
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keyStates.set(e.key, false);

    for (let playerId = 0; playerId < PLAYER_CONTROLS.length; playerId++) {
      const controls = PLAYER_CONTROLS[playerId];
      
      // Check if released key was a movement key
      const releasedDirection = this.keyToDirection(e.key, controls);
      if (releasedDirection !== Direction.None) {
        // Check if any other direction is still pressed
        const newDirection = this.getCurrentDirection(controls);
        this.playerDirections[playerId] = newDirection;
      }
    }
  }

  private keyToDirection(key: string, controls: typeof PLAYER_CONTROLS[0]): Direction {
    if (key === controls.up) return Direction.Up;
    if (key === controls.down) return Direction.Down;
    if (key === controls.left) return Direction.Left;
    if (key === controls.right) return Direction.Right;
    return Direction.None;
  }

  private getCurrentDirection(controls: typeof PLAYER_CONTROLS[0]): Direction {
    // Priority: last pressed direction among those still held
    if (this.keyStates.get(controls.up)) return Direction.Up;
    if (this.keyStates.get(controls.down)) return Direction.Down;
    if (this.keyStates.get(controls.left)) return Direction.Left;
    if (this.keyStates.get(controls.right)) return Direction.Right;
    return Direction.None;
  }

  getDirection(playerId: number): Direction {
    return this.playerDirections[playerId] || Direction.None;
  }

  isKeyPressed(key: string): boolean {
    return this.keyStates.get(key) || false;
  }

  reset(): void {
    this.keyStates.clear();
    this.playerDirections = [Direction.None, Direction.None, Direction.None, Direction.None];
  }
}
