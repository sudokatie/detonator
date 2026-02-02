import { GameState, Position, Direction, PowerUpType, PlayerState } from './types';
import { Arena } from './Arena';
import { Player } from './Player';
import { BombManager } from './Bomb';
import { PowerUpManager } from './PowerUp';
import { SPAWN_POINTS, PLAYER_COLORS, ROUNDS_TO_WIN, ROUND_TIME } from './constants';

export class Game {
  private _arena: Arena;
  private _players: Player[];
  private _bombManager: BombManager;
  private _powerUpManager: PowerUpManager;
  private _state: GameState;
  private _roundTimer: number;
  private _matchWinner: number | null;
  private _roundWinner: number | null;
  private _roundsToWin: number;

  constructor(playerCount: number = 2, roundsToWin: number = ROUNDS_TO_WIN) {
    this._arena = new Arena();
    this._bombManager = new BombManager();
    this._powerUpManager = new PowerUpManager();
    this._players = [];
    this._state = GameState.Menu;
    this._roundTimer = ROUND_TIME;
    this._matchWinner = null;
    this._roundWinner = null;
    this._roundsToWin = roundsToWin;

    for (let i = 0; i < Math.min(playerCount, 4); i++) {
      const spawn = SPAWN_POINTS[i];
      this._players.push(new Player(i, spawn, PLAYER_COLORS[i]));
    }
  }

  get state(): GameState {
    return this._state;
  }

  get arena(): Arena {
    return this._arena;
  }

  get players(): Player[] {
    return [...this._players];
  }

  get bombManager(): BombManager {
    return this._bombManager;
  }

  get powerUpManager(): PowerUpManager {
    return this._powerUpManager;
  }

  get powerUps(): { position: Position; type: PowerUpType; lifetime: number }[] {
    return this._powerUpManager.powerUps.map(p => ({
      position: p.position,
      type: p.type,
      lifetime: p.timer,
    }));
  }

  get roundTimer(): number {
    return this._roundTimer;
  }

  get matchWinner(): number | null {
    return this._matchWinner;
  }

  get roundWinner(): number | null {
    return this._roundWinner;
  }

  get roundsToWin(): number {
    return this._roundsToWin;
  }

  start(): void {
    this._state = GameState.Playing;
    this.resetRound();
  }

  pause(): void {
    if (this._state === GameState.Playing) {
      this._state = GameState.Paused;
    }
  }

  resume(): void {
    if (this._state === GameState.Paused) {
      this._state = GameState.Playing;
    }
  }

  update(dt: number): void {
    if (this._state !== GameState.Playing) return;

    // Update round timer
    this._roundTimer -= dt;
    if (this._roundTimer <= 0) {
      this.handleTimeUp();
      return;
    }

    // Update bombs and explosions
    const bombResult = this._bombManager.update(dt, this._arena);

    // Handle new power-ups from destroyed blocks
    for (const pu of bombResult.powerUps) {
      this._powerUpManager.spawn(pu.position, pu.type);
    }

    // Check for power-ups destroyed by explosions
    for (const powerUp of this._powerUpManager.powerUps) {
      if (this._bombManager.isExplosion(powerUp.position.x, powerUp.position.y)) {
        this._powerUpManager.removeAt(powerUp.position);
        this._arena.setTile(powerUp.position.x, powerUp.position.y, 0); // Floor
      }
    }

    // Update power-ups (lifetime countdown)
    const expired = this._powerUpManager.update(dt);
    for (const pos of expired) {
      this._arena.setTile(pos.x, pos.y, 0); // Floor
    }

    // Check player deaths from explosions
    for (const player of this._players) {
      if (!player.isAlive()) continue;

      const gridPos = player.getGridPosition();
      if (this._bombManager.isExplosion(gridPos.x, gridPos.y)) {
        player.die();
      }
    }

    // Check for power-up collection
    for (const player of this._players) {
      if (!player.isAlive()) continue;

      const gridPos = player.getGridPosition();
      const type = this._powerUpManager.collect(gridPos);

      if (type) {
        player.collectPowerUp(type);
        this._arena.setTile(gridPos.x, gridPos.y, 0); // Floor
      }
    }

    // Check win condition
    const alivePlayers = this._players.filter(p => p.isAlive());
    if (alivePlayers.length <= 1) {
      this.endRound(alivePlayers[0]?.id ?? null);
    }
  }

  movePlayer(playerId: number, direction: Direction): void {
    if (this._state !== GameState.Playing) return;

    const player = this._players[playerId];
    if (player && player.isAlive()) {
      player.move(direction, this._arena, 1 / 60); // Assume 60fps
    }
  }

  placeBomb(playerId: number): boolean {
    if (this._state !== GameState.Playing) return false;

    const player = this._players[playerId];
    if (!player || !player.isAlive()) return false;

    const pos = player.dropBomb();
    if (!pos) return false;

    const placed = this._bombManager.placeBomb(pos, playerId, player.getFireRange());
    if (!placed) {
      player.onBombExploded(); // Refund the bomb
      return false;
    }

    this._arena.setTile(pos.x, pos.y, 3); // Bomb tile type
    return true;
  }

  private handleTimeUp(): void {
    // When time runs out, all remaining players die (draw)
    for (const player of this._players) {
      if (player.isAlive()) {
        player.die();
      }
    }
    this.endRound(null);
  }

  private endRound(winnerId: number | null): void {
    this._roundWinner = winnerId;
    
    if (winnerId !== null) {
      this._players[winnerId].addWin();

      // Check for match winner
      if (this._players[winnerId].stats.wins >= this._roundsToWin) {
        this._matchWinner = winnerId;
        this._state = GameState.GameEnd;
        return;
      }
    }

    this._state = GameState.RoundEnd;
  }

  nextRound(): void {
    if (this._state !== GameState.RoundEnd) return;
    this.resetRound();
    this._state = GameState.Playing;
  }

  private resetRound(): void {
    this._arena.reset();
    this._bombManager.clear();
    this._powerUpManager.clear();
    this._roundTimer = ROUND_TIME;
    this._roundWinner = null;

    for (let i = 0; i < this._players.length; i++) {
      this._players[i].reset(SPAWN_POINTS[i]);
    }
  }

  reset(): void {
    this._matchWinner = null;
    this._state = GameState.Menu;
    
    // Recreate players to fully reset (including wins)
    const playerCount = this._players.length;
    this._players = [];
    for (let i = 0; i < playerCount; i++) {
      const spawn = SPAWN_POINTS[i];
      this._players.push(new Player(i, spawn, PLAYER_COLORS[i]));
    }
    
    this.resetRound();
  }

  getPlayer(id: number): Player | null {
    return this._players[id] || null;
  }

  getAlivePlayerCount(): number {
    return this._players.filter(p => p.isAlive()).length;
  }
}
