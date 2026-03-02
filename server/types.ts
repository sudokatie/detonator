/**
 * Multiplayer message types for Detonator.
 */

// Client -> Server messages
export type ClientMessage =
  | { type: 'join'; name: string; roomCode?: string }
  | { type: 'ready' }
  | { type: 'start' }
  | { type: 'input'; direction: Direction | null; bomb: boolean }
  | { type: 'leave' }
  | { type: 'ping' };

// Server -> Client messages
export type ServerMessage =
  | { type: 'room_state'; room: RoomState }
  | { type: 'game_start'; state: GameState }
  | { type: 'game_state'; state: GameState }
  | { type: 'player_joined'; player: RoomPlayer }
  | { type: 'player_left'; playerId: string }
  | { type: 'round_end'; winner: number | null; scores: number[] }
  | { type: 'game_end'; winner: number; scores: number[] }
  | { type: 'error'; message: string }
  | { type: 'pong' };

// Direction enum (matches client)
export type Direction = 'up' | 'down' | 'left' | 'right';

// Room player info
export interface RoomPlayer {
  id: string;
  name: string;
  ready: boolean;
  slot: number; // 0-3
  connected: boolean;
}

// Room state sent to clients
export interface RoomState {
  code: string;
  hostId: string;
  players: RoomPlayer[];
  state: 'lobby' | 'playing' | 'ended';
}

// Serialized game state for network
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
  tiles: number[][]; // 0=floor, 1=hard wall, 2=soft block
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

// Connected client
export interface Client {
  id: string;
  ws: import('ws').WebSocket;
  name: string;
  roomCode: string | null;
  lastPing: number;
}
