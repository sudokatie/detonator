/**
 * Client-side prediction and interpolation for smooth multiplayer gameplay.
 */

import type { GameState, PlayerState, Direction } from './Multiplayer';

export interface PredictionConfig {
  enabled: boolean;
  interpolationDelay: number; // ms to buffer for interpolation
  maxPredictionFrames: number; // max frames to predict ahead
  reconciliationThreshold: number; // position difference to trigger snap
}

export const DEFAULT_PREDICTION_CONFIG: PredictionConfig = {
  enabled: true,
  interpolationDelay: 100, // 100ms interpolation buffer
  maxPredictionFrames: 10,
  reconciliationThreshold: 0.5, // half a tile
};

interface InputRecord {
  timestamp: number;
  direction: Direction | null;
  bomb: boolean;
  sequence: number;
}

interface StateSnapshot {
  timestamp: number;
  state: GameState;
}

export class PredictionSystem {
  private config: PredictionConfig;
  private inputHistory: InputRecord[] = [];
  private stateBuffer: StateSnapshot[] = [];
  private sequenceNumber = 0;
  private lastProcessedSequence = 0;
  private predictedPosition: { x: number; y: number } | null = null;
  private mySlot: number;

  constructor(mySlot: number, config: Partial<PredictionConfig> = {}) {
    this.mySlot = mySlot;
    this.config = { ...DEFAULT_PREDICTION_CONFIG, ...config };
  }

  /**
   * Record an input for prediction and reconciliation.
   */
  recordInput(direction: Direction | null, bomb: boolean): number {
    const record: InputRecord = {
      timestamp: Date.now(),
      direction,
      bomb,
      sequence: ++this.sequenceNumber,
    };
    
    this.inputHistory.push(record);
    
    // Keep only recent inputs (last 1 second)
    const cutoff = Date.now() - 1000;
    this.inputHistory = this.inputHistory.filter((r) => r.timestamp > cutoff);
    
    return record.sequence;
  }

  /**
   * Apply client-side prediction for own player movement.
   */
  predictMovement(
    currentPosition: { x: number; y: number },
    direction: Direction | null,
    speed: number,
    dt: number
  ): { x: number; y: number } {
    if (!this.config.enabled || !direction) {
      this.predictedPosition = currentPosition;
      return currentPosition;
    }

    const moveAmount = speed * dt;
    let { x, y } = this.predictedPosition || currentPosition;

    switch (direction) {
      case 'up':
        y -= moveAmount;
        break;
      case 'down':
        y += moveAmount;
        break;
      case 'left':
        x -= moveAmount;
        break;
      case 'right':
        x += moveAmount;
        break;
    }

    this.predictedPosition = { x, y };
    return this.predictedPosition;
  }

  /**
   * Receive authoritative state from server and reconcile.
   */
  receiveServerState(state: GameState, serverSequence?: number): GameState {
    // Buffer state for interpolation
    this.stateBuffer.push({
      timestamp: Date.now(),
      state,
    });

    // Keep only recent states (last 500ms)
    const cutoff = Date.now() - 500;
    this.stateBuffer = this.stateBuffer.filter((s) => s.timestamp > cutoff);

    // Find my player in server state
    const myPlayer = state.players.find((p) => p.slot === this.mySlot);
    if (!myPlayer || !this.predictedPosition) {
      return state;
    }

    // Check if server position differs significantly from prediction
    const dx = Math.abs(myPlayer.x - this.predictedPosition.x);
    const dy = Math.abs(myPlayer.y - this.predictedPosition.y);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.config.reconciliationThreshold) {
      // Snap to server position (reconciliation)
      this.predictedPosition = { x: myPlayer.x, y: myPlayer.y };
      
      // Clear old inputs that server has processed
      if (serverSequence !== undefined) {
        this.inputHistory = this.inputHistory.filter(
          (r) => r.sequence > serverSequence
        );
        this.lastProcessedSequence = serverSequence;
      }
    }

    return state;
  }

  /**
   * Get interpolated state for rendering other players.
   */
  getInterpolatedState(renderTime?: number): GameState | null {
    if (this.stateBuffer.length < 2) {
      return this.stateBuffer[0]?.state || null;
    }

    const now = renderTime || Date.now();
    const targetTime = now - this.config.interpolationDelay;

    // Find the two states to interpolate between
    let before: StateSnapshot | null = null;
    let after: StateSnapshot | null = null;

    for (let i = 0; i < this.stateBuffer.length - 1; i++) {
      if (
        this.stateBuffer[i].timestamp <= targetTime &&
        this.stateBuffer[i + 1].timestamp >= targetTime
      ) {
        before = this.stateBuffer[i];
        after = this.stateBuffer[i + 1];
        break;
      }
    }

    // If we don't have surrounding states, use the most recent
    if (!before || !after) {
      return this.stateBuffer[this.stateBuffer.length - 1].state;
    }

    // Calculate interpolation factor
    const range = after.timestamp - before.timestamp;
    const progress = range > 0 ? (targetTime - before.timestamp) / range : 0;
    const t = Math.max(0, Math.min(1, progress));

    // Interpolate player positions (except my own)
    const interpolatedState: GameState = {
      ...after.state,
      players: after.state.players.map((player, index) => {
        if (player.slot === this.mySlot) {
          // Use predicted position for own player
          if (this.predictedPosition) {
            return {
              ...player,
              x: this.predictedPosition.x,
              y: this.predictedPosition.y,
            };
          }
          return player;
        }

        // Interpolate other players
        const beforePlayer = before!.state.players[index];
        if (!beforePlayer) return player;

        return {
          ...player,
          x: lerp(beforePlayer.x, player.x, t),
          y: lerp(beforePlayer.y, player.y, t),
        };
      }),
    };

    return interpolatedState;
  }

  /**
   * Get the current sequence number for input timestamping.
   */
  getSequenceNumber(): number {
    return this.sequenceNumber;
  }

  /**
   * Update configuration.
   */
  setConfig(config: Partial<PredictionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset prediction state.
   */
  reset(): void {
    this.inputHistory = [];
    this.stateBuffer = [];
    this.sequenceNumber = 0;
    this.lastProcessedSequence = 0;
    this.predictedPosition = null;
  }
}

/**
 * Linear interpolation helper.
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Calculate smooth step interpolation (ease in/out).
 */
export function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Calculate exponential interpolation for snappy movement.
 */
export function expInterp(current: number, target: number, factor: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-factor * dt));
}
