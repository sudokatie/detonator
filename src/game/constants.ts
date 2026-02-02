import { ControlMap, Position } from './types';

// Grid dimensions
export const GRID_WIDTH = 13;
export const GRID_HEIGHT = 11;
export const TILE_SIZE = 32;
export const CANVAS_SCALE = 2;

// Canvas dimensions
export const CANVAS_WIDTH = GRID_WIDTH * TILE_SIZE;
export const CANVAS_HEIGHT = GRID_HEIGHT * TILE_SIZE;
export const DISPLAY_WIDTH = CANVAS_WIDTH * CANVAS_SCALE;
export const DISPLAY_HEIGHT = CANVAS_HEIGHT * CANVAS_SCALE;

// Player settings
export const PLAYER_BASE_SPEED = 4; // tiles per second
export const MAX_BOMBS = 8;
export const MAX_FIRE = 8;
export const MAX_SPEED = 7; // Base 4 + max 3 power-ups
export const DEFAULT_BOMBS = 1;
export const DEFAULT_FIRE = 1;
export const DEFAULT_SPEED = 4;

// Bomb settings
export const BOMB_TIMER = 3; // seconds
export const EXPLOSION_DURATION = 0.5; // seconds

// Match settings
export const ROUND_TIME = 120; // seconds
export const ROUNDS_TO_WIN = 3;

// Power-up settings
export const POWERUP_LIFETIME = 10; // seconds
export const POWERUP_SPAWN_CHANCE = 0.3;

// Player colors
export const PLAYER_COLORS = [
  '#00ff00', // P1 Green
  '#ff0000', // P2 Red
  '#0088ff', // P3 Blue
  '#ffff00', // P4 Yellow
];

// Player controls
export const PLAYER_CONTROLS: ControlMap[] = [
  { up: 'w', down: 's', left: 'a', right: 'd', bomb: ' ' }, // P1: WASD + Space
  { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', bomb: 'Enter' }, // P2: Arrows
  { up: 'i', down: 'k', left: 'j', right: 'l', bomb: 'b' }, // P3: IJKL + B
  { up: 'Numpad8', down: 'Numpad5', left: 'Numpad4', right: 'Numpad6', bomb: 'Numpad0' }, // P4: Numpad
];

// Spawn points (corners)
export const SPAWN_POINTS: Position[] = [
  { x: 1, y: 1 },   // P1: top-left
  { x: 11, y: 1 },  // P2: top-right
  { x: 1, y: 9 },   // P3: bottom-left
  { x: 11, y: 9 },  // P4: bottom-right
];

// Colors
export const COLORS = {
  background: '#1a1a2e',
  floor: '#2d2d44',
  hardWall: '#4a4a6a',
  hardWallLight: '#5a5a7a',
  softBlock: '#8b6914',
  softBlockDark: '#6b5010',
  bomb: '#111111',
  bombFuse: '#ff6600',
  explosionCenter: '#ffff00',
  explosionOuter: '#ff6600',
  powerUpBomb: '#4488ff',
  powerUpFire: '#ff4444',
  powerUpSpeed: '#ffff44',
};
