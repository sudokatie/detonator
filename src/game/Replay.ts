import { Direction } from './types';

/**
 * Types of actions that can be recorded
 */
export type ActionType = 'move' | 'bomb';

/**
 * A single recorded action with timestamp
 */
export interface ReplayFrame {
  time: number;         // ms since replay start
  playerId: number;     // which player performed this
  action: ActionType;
  direction?: Direction; // for move actions
}

/**
 * Complete replay data for a game session
 */
export interface ReplayData {
  version: number;
  timestamp: number;    // Unix timestamp when recorded
  duration: number;     // Total replay duration in ms
  frames: ReplayFrame[];
  playerCount: number;
  finalWinner: number | null;
  roundsPlayed: number;
  dailyMode: boolean;
}

/**
 * Encodes a direction to a single character
 */
function encodeDirection(dir: Direction): string {
  switch (dir) {
    case Direction.Up: return 'u';
    case Direction.Down: return 'd';
    case Direction.Left: return 'l';
    case Direction.Right: return 'r';
    case Direction.None: return 'n';
  }
}

/**
 * Decodes a single character back to Direction
 */
function decodeDirection(char: string): Direction | null {
  switch (char) {
    case 'u': return Direction.Up;
    case 'd': return Direction.Down;
    case 'l': return Direction.Left;
    case 'r': return Direction.Right;
    case 'n': return Direction.None;
    default: return null;
  }
}

/**
 * Replay recorder and player for Detonator
 */
export class Replay {
  private _frames: ReplayFrame[] = [];
  private _startTime: number = 0;
  private _isRecording: boolean = false;
  private _isPlaying: boolean = false;
  private _playbackIndex: number = 0;
  private _playbackStartTime: number = 0;
  private _playerCount: number = 2;
  private _dailyMode: boolean = false;

  /**
   * Start recording inputs
   */
  startRecording(playerCount: number = 2, dailyMode: boolean = false): void {
    this._frames = [];
    this._startTime = Date.now();
    this._isRecording = true;
    this._isPlaying = false;
    this._playerCount = playerCount;
    this._dailyMode = dailyMode;
  }

  /**
   * Record a move action
   */
  recordMove(playerId: number, direction: Direction): void {
    if (!this._isRecording) return;
    
    this._frames.push({
      time: Date.now() - this._startTime,
      playerId,
      action: 'move',
      direction,
    });
  }

  /**
   * Record a bomb placement
   */
  recordBomb(playerId: number): void {
    if (!this._isRecording) return;
    
    this._frames.push({
      time: Date.now() - this._startTime,
      playerId,
      action: 'bomb',
    });
  }

  /**
   * Stop recording and return the replay data
   */
  stopRecording(finalWinner: number | null, roundsPlayed: number): ReplayData {
    this._isRecording = false;
    
    return {
      version: 1,
      timestamp: this._startTime,
      duration: Date.now() - this._startTime,
      frames: [...this._frames],
      playerCount: this._playerCount,
      finalWinner,
      roundsPlayed,
      dailyMode: this._dailyMode,
    };
  }

  /**
   * Check if currently recording
   */
  get isRecording(): boolean {
    return this._isRecording;
  }

  /**
   * Start playback of a replay
   */
  startPlayback(data: ReplayData): void {
    this._frames = [...data.frames];
    this._playbackIndex = 0;
    this._playbackStartTime = Date.now();
    this._isPlaying = true;
    this._isRecording = false;
    this._playerCount = data.playerCount;
    this._dailyMode = data.dailyMode;
  }

  /**
   * Get all actions ready for current time
   * Returns array of actions to apply (may be empty)
   */
  getReadyActions(): ReplayFrame[] {
    if (!this._isPlaying) return [];
    
    const ready: ReplayFrame[] = [];
    const elapsed = Date.now() - this._playbackStartTime;
    
    while (this._playbackIndex < this._frames.length) {
      const frame = this._frames[this._playbackIndex];
      if (elapsed >= frame.time) {
        ready.push(frame);
        this._playbackIndex++;
      } else {
        break;
      }
    }
    
    return ready;
  }

  /**
   * Check if playback is complete
   */
  get isPlaybackComplete(): boolean {
    return this._isPlaying && this._playbackIndex >= this._frames.length;
  }

  /**
   * Check if currently playing back
   */
  get isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * Stop playback
   */
  stopPlayback(): void {
    this._isPlaying = false;
    this._playbackIndex = 0;
  }

  /**
   * Get playback progress (0-1)
   */
  get playbackProgress(): number {
    if (!this._isPlaying || this._frames.length === 0) return 0;
    return this._playbackIndex / this._frames.length;
  }

  /**
   * Get player count for current replay
   */
  get playerCount(): number {
    return this._playerCount;
  }

  /**
   * Get daily mode flag for current replay
   */
  get dailyMode(): boolean {
    return this._dailyMode;
  }

  /**
   * Encode replay data to a shareable string
   * Format: version|timestamp|duration|players|winner|rounds|daily|frames
   * Frames: time,player,action[,dir];...
   */
  static encode(data: ReplayData): string {
    const framesStr = data.frames
      .map(f => {
        const base = `${f.time},${f.playerId},${f.action === 'move' ? 'm' : 'b'}`;
        return f.direction ? `${base},${encodeDirection(f.direction)}` : base;
      })
      .join(';');
    
    const parts = [
      data.version,
      data.timestamp,
      data.duration,
      data.playerCount,
      data.finalWinner ?? -1,
      data.roundsPlayed,
      data.dailyMode ? 1 : 0,
      framesStr,
    ];
    
    return btoa(parts.join('|'));
  }

  /**
   * Decode a replay string back to ReplayData
   */
  static decode(encoded: string): ReplayData | null {
    try {
      const decoded = atob(encoded);
      const parts = decoded.split('|');
      
      if (parts.length < 8) return null;
      
      const [version, timestamp, duration, players, winner, rounds, daily, framesStr] = parts;
      
      const frames: ReplayFrame[] = framesStr
        .split(';')
        .filter(f => f.length > 0)
        .map(f => {
          const [time, player, actionChar, dirChar] = f.split(',');
          const action: ActionType = actionChar === 'm' ? 'move' : 'bomb';
          const frame: ReplayFrame = {
            time: parseInt(time, 10),
            playerId: parseInt(player, 10),
            action,
          };
          if (dirChar) {
            frame.direction = decodeDirection(dirChar) ?? undefined;
          }
          return frame;
        });
      
      const finalWinner = parseInt(winner, 10);
      
      return {
        version: parseInt(version, 10),
        timestamp: parseInt(timestamp, 10),
        duration: parseInt(duration, 10),
        frames,
        playerCount: parseInt(players, 10),
        finalWinner: finalWinner === -1 ? null : finalWinner,
        roundsPlayed: parseInt(rounds, 10),
        dailyMode: daily === '1',
      };
    } catch {
      return null;
    }
  }

  /**
   * Get replay statistics
   */
  static getStats(data: ReplayData): {
    totalActions: number;
    actionsPerSecond: number;
    moveCount: number;
    bombCount: number;
    playerActions: Map<number, number>;
    durationSeconds: number;
  } {
    let moveCount = 0;
    let bombCount = 0;
    const playerActions = new Map<number, number>();
    
    for (const frame of data.frames) {
      if (frame.action === 'move') moveCount++;
      else bombCount++;
      
      const current = playerActions.get(frame.playerId) || 0;
      playerActions.set(frame.playerId, current + 1);
    }
    
    const durationSec = data.duration / 1000;
    
    return {
      totalActions: data.frames.length,
      actionsPerSecond: durationSec > 0 ? data.frames.length / durationSec : 0,
      moveCount,
      bombCount,
      playerActions,
      durationSeconds: durationSec,
    };
  }

  /**
   * Generate share code for a replay
   */
  static generateShareCode(data: ReplayData): string {
    const dateStr = new Date(data.timestamp).toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = data.dailyMode ? 'DETONATOR-D' : 'DETONATOR';
    const winnerStr = data.finalWinner !== null ? `P${data.finalWinner + 1}` : 'DRAW';
    return `${prefix}-${dateStr}-${winnerStr}-R${data.roundsPlayed}`;
  }
}
