// Tile types in the arena grid
export enum TileType {
  Floor = 0,
  HardWall = 1,
  SoftBlock = 2,
  Bomb = 3,
  Explosion = 4,
  PowerUp = 5,
}

// Player state
export enum PlayerState {
  Alive = 'alive',
  Dead = 'dead',
}

// Power-up types
export enum PowerUpType {
  BombUp = 'bomb_up',
  FireUp = 'fire_up',
  SpeedUp = 'speed_up',
}

// Game state
export enum GameState {
  Menu = 'menu',
  Playing = 'playing',
  Paused = 'paused',
  RoundEnd = 'round_end',
  GameEnd = 'game_end',
}

// Movement direction
export enum Direction {
  None = 'none',
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
}

// Position in grid
export interface Position {
  x: number;
  y: number;
}

// Control mapping for a player
export interface ControlMap {
  up: string;
  down: string;
  left: string;
  right: string;
  bomb: string;
}

// Player statistics
export interface PlayerStats {
  bombs: number;
  fire: number;
  speed: number;
  alive: boolean;
  wins: number;
}

// Player configuration
export interface PlayerConfig {
  id: number;
  color: string;
  controls: ControlMap;
  spawn: Position;
}

// Bounding box for collision
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Power-up data (for rendering)
export interface PowerUpData {
  position: Position;
  type: PowerUpType;
  lifetime: number;
}
