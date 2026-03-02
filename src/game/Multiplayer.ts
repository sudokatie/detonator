/**
 * Client-side multiplayer module for Detonator.
 * Handles WebSocket connection and state synchronization.
 */

// Re-export types from server for convenience
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface RoomPlayer {
  id: string;
  name: string;
  ready: boolean;
  slot: number;
  connected: boolean;
}

export interface RoomState {
  code: string;
  hostId: string;
  players: RoomPlayer[];
  state: 'lobby' | 'playing' | 'ended';
}

export interface GameState {
  tick: number;
  arena: ArenaState;
  players: PlayerState[];
  bombs: BombState[];
  explosions: ExplosionState[];
  powerUps: PowerUpState[];
  roundTime: number;
  scores: number[];
  round: number;
  maxRounds: number;
}

export interface ArenaState {
  width: number;
  height: number;
  tiles: number[][];
}

export interface PlayerState {
  slot: number;
  x: number;
  y: number;
  alive: boolean;
  bombs: number;
  fire: number;
  speed: number;
  animationFrame: number;
}

export interface BombState {
  x: number;
  y: number;
  timer: number;
  fire: number;
  owner: number;
}

export interface ExplosionState {
  tiles: { x: number; y: number }[];
  timer: number;
  phase: 'expand' | 'full' | 'fade';
}

export interface PowerUpState {
  x: number;
  y: number;
  type: 'bomb' | 'fire' | 'speed';
}

// Client -> Server messages
type ClientMessage =
  | { type: 'join'; name: string; roomCode?: string }
  | { type: 'ready' }
  | { type: 'start' }
  | { type: 'input'; direction: Direction | null; bomb: boolean }
  | { type: 'leave' }
  | { type: 'ping' };

// Server -> Client messages
type ServerMessage =
  | { type: 'room_state'; room: RoomState }
  | { type: 'game_start'; state: GameState }
  | { type: 'game_state'; state: GameState }
  | { type: 'player_joined'; player: RoomPlayer }
  | { type: 'player_left'; playerId: string }
  | { type: 'round_end'; winner: number | null; scores: number[] }
  | { type: 'game_end'; winner: number; scores: number[] }
  | { type: 'error'; message: string }
  | { type: 'pong' };

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

export interface MultiplayerCallbacks {
  onConnectionChange?: (state: ConnectionState) => void;
  onRoomState?: (room: RoomState) => void;
  onGameStart?: (state: GameState) => void;
  onGameState?: (state: GameState) => void;
  onPlayerJoined?: (player: RoomPlayer) => void;
  onPlayerLeft?: (playerId: string) => void;
  onRoundEnd?: (winner: number | null, scores: number[]) => void;
  onGameEnd?: (winner: number, scores: number[]) => void;
  onError?: (message: string) => void;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private serverUrl: string;
  private callbacks: MultiplayerCallbacks;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private lastInputTime = 0;
  private inputDebounceMs = 16; // ~60 Hz max input rate
  private playerId: string | null = null;
  private currentRoom: RoomState | null = null;

  constructor(serverUrl: string, callbacks: MultiplayerCallbacks = {}) {
    this.serverUrl = serverUrl;
    this.callbacks = callbacks;
  }

  get state(): ConnectionState {
    return this.connectionState;
  }

  get room(): RoomState | null {
    return this.currentRoom;
  }

  get id(): string | null {
    return this.playerId;
  }

  get isHost(): boolean {
    return this.currentRoom?.hostId === this.playerId;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connectionState === 'connected') {
        resolve();
        return;
      }

      this.setConnectionState('connecting');

      try {
        this.ws = new WebSocket(this.serverUrl);
      } catch (err) {
        this.setConnectionState('disconnected');
        reject(err);
        return;
      }

      const timeout = setTimeout(() => {
        if (this.connectionState === 'connecting') {
          this.ws?.close();
          this.setConnectionState('disconnected');
          reject(new Error('Connection timeout'));
        }
      }, 10000);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        this.setConnectionState('connected');
        this.reconnectAttempts = 0;
        this.startPingInterval();
        resolve();
      };

      this.ws.onerror = (err) => {
        clearTimeout(timeout);
        console.error('multiplayer: websocket error', err);
      };

      this.ws.onclose = () => {
        clearTimeout(timeout);
        this.stopPingInterval();
        this.setConnectionState('disconnected');
        this.attemptReconnect();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data as string);
      };
    });
  }

  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnect
    this.stopPingInterval();
    this.ws?.close();
    this.ws = null;
    this.setConnectionState('disconnected');
    this.currentRoom = null;
    this.playerId = null;
  }

  joinRoom(name: string, roomCode?: string): void {
    this.send({ type: 'join', name, roomCode });
  }

  leaveRoom(): void {
    this.send({ type: 'leave' });
    this.currentRoom = null;
  }

  setReady(): void {
    this.send({ type: 'ready' });
  }

  startGame(): void {
    this.send({ type: 'start' });
  }

  sendInput(direction: Direction | null, bomb: boolean): void {
    const now = Date.now();
    if (now - this.lastInputTime < this.inputDebounceMs) {
      return;
    }
    this.lastInputTime = now;
    this.send({ type: 'input', direction, bomb });
  }

  private send(message: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleMessage(data: string): void {
    let message: ServerMessage;
    try {
      message = JSON.parse(data) as ServerMessage;
    } catch {
      console.error('multiplayer: invalid message', data);
      return;
    }

    switch (message.type) {
      case 'room_state':
        this.currentRoom = message.room;
        // Extract our player ID from the room state if we don't have it
        if (!this.playerId && message.room.players.length > 0) {
          // Server assigns us the last player in the list when we join
          const lastPlayer = message.room.players[message.room.players.length - 1];
          if (lastPlayer) {
            this.playerId = lastPlayer.id;
          }
        }
        this.callbacks.onRoomState?.(message.room);
        break;

      case 'game_start':
        this.callbacks.onGameStart?.(message.state);
        break;

      case 'game_state':
        this.callbacks.onGameState?.(message.state);
        break;

      case 'player_joined':
        if (this.currentRoom) {
          this.currentRoom.players.push(message.player);
        }
        this.callbacks.onPlayerJoined?.(message.player);
        break;

      case 'player_left':
        if (this.currentRoom) {
          this.currentRoom.players = this.currentRoom.players.filter(
            (p) => p.id !== message.playerId
          );
        }
        this.callbacks.onPlayerLeft?.(message.playerId);
        break;

      case 'round_end':
        this.callbacks.onRoundEnd?.(message.winner, message.scores);
        break;

      case 'game_end':
        if (this.currentRoom) {
          this.currentRoom.state = 'ended';
        }
        this.callbacks.onGameEnd?.(message.winner, message.scores);
        break;

      case 'error':
        this.callbacks.onError?.(message.message);
        break;

      case 'pong':
        // Heartbeat acknowledged
        break;
    }
  }

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.callbacks.onConnectionChange?.(state);
    }
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      if (this.connectionState === 'disconnected') {
        console.log(`multiplayer: reconnect attempt ${this.reconnectAttempts}`);
        this.connect().catch(() => {
          // Reconnect failed, will try again via onclose
        });
      }
    }, delay);
  }
}

// Singleton instance for app-wide use
let instance: MultiplayerClient | null = null;

export function getMultiplayerClient(): MultiplayerClient | null {
  return instance;
}

export function createMultiplayerClient(
  serverUrl: string,
  callbacks: MultiplayerCallbacks = {}
): MultiplayerClient {
  if (instance) {
    instance.disconnect();
  }
  instance = new MultiplayerClient(serverUrl, callbacks);
  return instance;
}

export function destroyMultiplayerClient(): void {
  instance?.disconnect();
  instance = null;
}
