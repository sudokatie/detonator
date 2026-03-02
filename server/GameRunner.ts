/**
 * Server-side game runner for multiplayer.
 * Wraps the existing Game class and manages state sync.
 */

import { GameState, Direction, Client, PlayerState, ArenaState, BombState, ExplosionState, PowerUpState } from './types';
import { Room } from './Room';

// Game tick rate (60 Hz)
const TICK_RATE = 60;
const TICK_MS = 1000 / TICK_RATE;

// State sync rate (20 Hz)
const SYNC_RATE = 20;
const SYNC_INTERVAL = TICK_RATE / SYNC_RATE;

// Import would cause circular dependency, so we simulate the game state
// In production, you'd import the actual Game class

interface GameInput {
  direction: Direction | null;
  bomb: boolean;
}

export class GameRunner {
  private room: Room;
  private playerSlots: Map<string, number>; // clientId -> slot
  private inputs: Map<number, GameInput>; // slot -> current input
  private tick: number = 0;
  private running: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  
  // Simulated game state (in production, use actual Game class)
  private gameState: {
    arena: ArenaState;
    players: PlayerState[];
    bombs: BombState[];
    explosions: ExplosionState[];
    powerUps: PowerUpState[];
    roundTime: number;
    scores: number[];
    round: number;
    maxRounds: number;
    state: 'playing' | 'round_end' | 'game_end';
  };

  // Callbacks
  private onStateUpdate?: (state: GameState) => void;
  private onRoundEnd?: (winner: number | null, scores: number[]) => void;
  private onGameEnd?: (winner: number, scores: number[]) => void;

  constructor(room: Room, playerIds: string[]) {
    this.room = room;
    this.playerSlots = new Map();
    this.inputs = new Map();

    // Map player IDs to slots
    playerIds.forEach((id, index) => {
      this.playerSlots.set(id, index);
      this.inputs.set(index, { direction: null, bomb: false });
    });

    // Initialize game state
    this.gameState = this.createInitialState(playerIds.length);
  }

  private createInitialState(playerCount: number): typeof this.gameState {
    // Create standard 13x11 arena
    const width = 13;
    const height = 11;
    const tiles: number[][] = [];
    
    for (let y = 0; y < height; y++) {
      const row: number[] = [];
      for (let x = 0; x < width; x++) {
        // Border walls
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          row.push(1); // Hard wall
        }
        // Checkerboard hard walls
        else if (x % 2 === 0 && y % 2 === 0) {
          row.push(1); // Hard wall
        }
        // Spawn zone protection (corners)
        else if ((x <= 2 && y <= 2) || (x >= width - 3 && y <= 2) ||
                 (x <= 2 && y >= height - 3) || (x >= width - 3 && y >= height - 3)) {
          row.push(0); // Floor
        }
        // Random soft blocks (70% chance)
        else if (Math.random() < 0.7) {
          row.push(2); // Soft block
        }
        else {
          row.push(0); // Floor
        }
      }
      tiles.push(row);
    }

    // Spawn positions (corners)
    const spawns = [
      { x: 1, y: 1 },
      { x: width - 2, y: 1 },
      { x: 1, y: height - 2 },
      { x: width - 2, y: height - 2 },
    ];

    const players: PlayerState[] = [];
    for (let i = 0; i < playerCount; i++) {
      players.push({
        slot: i,
        x: spawns[i].x,
        y: spawns[i].y,
        alive: true,
        bombs: 1,
        fire: 1,
        speed: 4,
        animationFrame: 0,
      });
    }

    return {
      arena: { width, height, tiles },
      players,
      bombs: [],
      explosions: [],
      powerUps: [],
      roundTime: 180, // 3 minutes
      scores: new Array(playerCount).fill(0),
      round: 1,
      maxRounds: 3,
      state: 'playing',
    };
  }

  // Set callbacks
  setCallbacks(
    onStateUpdate: (state: GameState) => void,
    onRoundEnd: (winner: number | null, scores: number[]) => void,
    onGameEnd: (winner: number, scores: number[]) => void
  ): void {
    this.onStateUpdate = onStateUpdate;
    this.onRoundEnd = onRoundEnd;
    this.onGameEnd = onGameEnd;
  }

  // Start the game loop
  start(): void {
    if (this.running) return;
    this.running = true;
    this.intervalId = setInterval(() => this.gameLoop(), TICK_MS);
  }

  // Stop the game loop
  stop(): void {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Handle player input
  handleInput(clientId: string, direction: Direction | null, bomb: boolean): void {
    const slot = this.playerSlots.get(clientId);
    if (slot === undefined) return;
    
    this.inputs.set(slot, { direction, bomb });
  }

  // Handle player disconnect
  handleDisconnect(clientId: string): void {
    const slot = this.playerSlots.get(clientId);
    if (slot === undefined) return;
    
    // Kill the player
    const player = this.gameState.players[slot];
    if (player) {
      player.alive = false;
    }
    
    this.checkRoundEnd();
  }

  // Main game loop
  private gameLoop(): void {
    if (this.gameState.state !== 'playing') return;

    this.tick++;
    const dt = TICK_MS / 1000;

    // Update round timer
    this.gameState.roundTime -= dt;
    if (this.gameState.roundTime <= 0) {
      this.endRound(null); // Draw
      return;
    }

    // Process inputs and update players
    this.updatePlayers(dt);

    // Update bombs and explosions
    this.updateBombs(dt);

    // Check for round end
    this.checkRoundEnd();

    // Send state update at sync rate
    if (this.tick % SYNC_INTERVAL === 0) {
      this.broadcastState();
    }
  }

  private updatePlayers(dt: number): void {
    for (const player of this.gameState.players) {
      if (!player.alive) continue;

      const input = this.inputs.get(player.slot);
      if (!input) continue;

      // Simple movement (1 tile per 0.25s at base speed)
      if (input.direction) {
        const speed = player.speed * dt;
        let nx = player.x;
        let ny = player.y;

        switch (input.direction) {
          case 'up': ny -= speed; break;
          case 'down': ny += speed; break;
          case 'left': nx -= speed; break;
          case 'right': nx += speed; break;
        }

        // Check collision (simplified)
        const tileX = Math.round(nx);
        const tileY = Math.round(ny);
        if (this.isWalkable(tileX, tileY)) {
          player.x = nx;
          player.y = ny;
        }
      }

      // Animation frame
      player.animationFrame = (player.animationFrame + 1) % 4;
    }
  }

  private isWalkable(x: number, y: number): boolean {
    const { tiles, width, height } = this.gameState.arena;
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    return tiles[y][x] === 0; // Only floor is walkable
  }

  private updateBombs(dt: number): void {
    // Update bomb timers
    for (let i = this.gameState.bombs.length - 1; i >= 0; i--) {
      const bomb = this.gameState.bombs[i];
      bomb.timer -= dt;
      
      if (bomb.timer <= 0) {
        // Explode
        this.createExplosion(bomb);
        this.gameState.bombs.splice(i, 1);
      }
    }

    // Update explosions
    for (let i = this.gameState.explosions.length - 1; i >= 0; i--) {
      const explosion = this.gameState.explosions[i];
      explosion.timer -= dt;
      
      if (explosion.timer <= 0) {
        this.gameState.explosions.splice(i, 1);
      } else {
        // Update phase
        const progress = 1 - (explosion.timer / 0.5);
        if (progress < 0.2) explosion.phase = 'expand';
        else if (progress < 0.8) explosion.phase = 'full';
        else explosion.phase = 'fade';
      }
    }
  }

  private createExplosion(bomb: BombState): void {
    const tiles: { x: number; y: number }[] = [{ x: bomb.x, y: bomb.y }];
    const { tiles: arena, width, height } = this.gameState.arena;

    // Expand in 4 directions
    const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of directions) {
      for (let r = 1; r <= bomb.fire; r++) {
        const nx = bomb.x + dx * r;
        const ny = bomb.y + dy * r;
        
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) break;
        
        const tile = arena[ny][nx];
        if (tile === 1) break; // Hard wall stops
        
        tiles.push({ x: nx, y: ny });
        
        if (tile === 2) {
          // Destroy soft block
          arena[ny][nx] = 0;
          break;
        }
      }
    }

    this.gameState.explosions.push({
      tiles,
      timer: 0.5,
      phase: 'expand',
    });

    // Check player hits
    for (const player of this.gameState.players) {
      if (!player.alive) continue;
      
      const px = Math.round(player.x);
      const py = Math.round(player.y);
      
      if (tiles.some(t => t.x === px && t.y === py)) {
        player.alive = false;
      }
    }
  }

  private checkRoundEnd(): void {
    const alive = this.gameState.players.filter(p => p.alive);
    
    if (alive.length <= 1) {
      const winner = alive.length === 1 ? alive[0].slot : null;
      this.endRound(winner);
    }
  }

  private endRound(winner: number | null): void {
    this.gameState.state = 'round_end';
    
    if (winner !== null) {
      this.gameState.scores[winner]++;
    }

    // Check for match winner
    const winningScore = Math.ceil(this.gameState.maxRounds / 2) + 1;
    const matchWinner = this.gameState.scores.findIndex(s => s >= winningScore);
    
    if (matchWinner >= 0) {
      this.gameState.state = 'game_end';
      this.onGameEnd?.(matchWinner, this.gameState.scores);
      this.stop();
    } else {
      this.onRoundEnd?.(winner, this.gameState.scores);
      
      // Start next round after delay (handled by caller)
      setTimeout(() => this.startNextRound(), 3000);
    }
  }

  private startNextRound(): void {
    this.gameState.round++;
    this.gameState.roundTime = 180;
    this.gameState.bombs = [];
    this.gameState.explosions = [];
    this.gameState.powerUps = [];
    this.gameState.state = 'playing';
    
    // Reset arena
    const newState = this.createInitialState(this.gameState.players.length);
    this.gameState.arena = newState.arena;
    
    // Reset players
    for (let i = 0; i < this.gameState.players.length; i++) {
      Object.assign(this.gameState.players[i], newState.players[i]);
    }
  }

  private broadcastState(): void {
    const state: GameState = {
      tick: this.tick,
      arena: this.gameState.arena,
      players: this.gameState.players,
      bombs: this.gameState.bombs,
      explosions: this.gameState.explosions,
      powerUps: this.gameState.powerUps,
      roundTime: this.gameState.roundTime,
      scores: this.gameState.scores,
      round: this.gameState.round,
      maxRounds: this.gameState.maxRounds,
    };
    
    this.onStateUpdate?.(state);
  }

  // Get current state
  getState(): GameState {
    return {
      tick: this.tick,
      arena: this.gameState.arena,
      players: this.gameState.players,
      bombs: this.gameState.bombs,
      explosions: this.gameState.explosions,
      powerUps: this.gameState.powerUps,
      roundTime: this.gameState.roundTime,
      scores: this.gameState.scores,
      round: this.gameState.round,
      maxRounds: this.gameState.maxRounds,
    };
  }

  // Get player slot for client
  getSlot(clientId: string): number | undefined {
    return this.playerSlots.get(clientId);
  }
}
