import { GameState, Position, Direction, PowerUpType, PlayerState } from './types';
import { Arena } from './Arena';
import { Player } from './Player';
import { BombManager } from './Bomb';
import { PowerUpManager } from './PowerUp';
import { SPAWN_POINTS, PLAYER_COLORS, ROUNDS_TO_WIN, ROUND_TIME } from './constants';
import { Sound } from './Sound';
import { SeededRNG, todaySeed, todayString, DailyLeaderboard } from './Daily';
import { Replay, ReplayData, ReplayFrame } from './Replay';

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

  // Daily challenge state
  private _dailyMode: boolean = false;
  private _dailySeed: number = 0;
  private _dailyDate: string = '';
  private _dailyRng: SeededRNG | null = null;

  // Replay state
  private _replay: Replay = new Replay();
  private _isPlayback: boolean = false;
  private _lastReplayData: ReplayData | null = null;
  private _recordingEnabled: boolean = true;
  private _pendingActions: ReplayFrame[] = [];

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
    this._dailyMode = false;
    this._dailyRng = null;
    this._isPlayback = false;
    this._pendingActions = [];
    if (this._recordingEnabled) {
      this._replay.startRecording(this._players.length, false);
    }
    this.resetRound();
    Sound.play('roundStart');
  }

  /** Start a daily challenge run */
  startDaily(): void {
    this._state = GameState.Playing;
    this._dailyMode = true;
    this._dailySeed = todaySeed();
    this._dailyDate = todayString();
    this._dailyRng = new SeededRNG(this._dailySeed);
    this._isPlayback = false;
    this._pendingActions = [];
    if (this._recordingEnabled) {
      this._replay.startRecording(this._players.length, true);
    }
    this.resetRound();
    Sound.play('roundStart');
  }

  /** Check if currently in daily mode */
  isDailyMode(): boolean {
    return this._dailyMode;
  }

  /** Get today's daily leaderboard */
  getDailyLeaderboard(): ReturnType<typeof DailyLeaderboard.getToday> {
    return DailyLeaderboard.getToday();
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
    // Update player animations even when not playing (for death animation to complete)
    for (const player of this._players) {
      player.updateAnimation(dt);
    }

    if (this._state !== GameState.Playing) return;

    // Update round timer
    this._roundTimer -= dt;
    if (this._roundTimer <= 0) {
      this.handleTimeUp();
      return;
    }

    // Update bombs and explosions
    const bombResult = this._bombManager.update(dt, this._arena);

    // Play explosion sound if any bombs exploded
    if (bombResult.exploded && bombResult.exploded.length > 0) {
      Sound.play('explosion');
    }

    // Handle new power-ups from destroyed blocks
    for (const pu of bombResult.powerUps) {
      this._powerUpManager.spawn(pu.position, pu.type);
      Sound.play('blockBreak');
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
        Sound.play('death');
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
        Sound.play('powerUp');
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
      // Record move action (only when not in playback)
      if (!this._isPlayback && this._recordingEnabled) {
        this._replay.recordMove(playerId, direction);
      }
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

    // Record bomb action (only when not in playback)
    if (!this._isPlayback && this._recordingEnabled) {
      this._replay.recordBomb(playerId);
    }

    this._arena.setTile(pos.x, pos.y, 3); // Bomb tile type
    Sound.play('bombPlace');
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
        Sound.play('victory');
        
        // Stop recording and save replay
        if (this._replay.isRecording) {
          const roundsPlayed = this._players.reduce((sum, p) => sum + p.stats.wins, 0);
          this._lastReplayData = this._replay.stopRecording(winnerId, roundsPlayed);
        }
        
        // Record to daily leaderboard if in daily mode (player 0 wins count as score)
        if (this._dailyMode && winnerId === 0) {
          const stats = this._players[0].stats;
          const score = stats.wins * 1000;
          DailyLeaderboard.recordScore('Player', score, stats.wins);
        }
        return;
      }
    }

    this._state = GameState.RoundEnd;
    Sound.play('roundEnd');
  }

  nextRound(): void {
    if (this._state !== GameState.RoundEnd) return;
    this.resetRound();
    this._state = GameState.Playing;
    Sound.play('roundStart');
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
    
    // Clear daily mode state
    this._dailyMode = false;
    this._dailySeed = 0;
    this._dailyDate = '';
    this._dailyRng = null;
    
    // Clear replay state
    this._isPlayback = false;
    this._recordingEnabled = true;
    this._pendingActions = [];
    
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

  // ==================
  // Replay Methods
  // ==================

  /** Start playback of a replay */
  startPlayback(data: ReplayData): void {
    // Reset game state for playback
    this.reset();
    
    // Recreate with correct player count
    this._players = [];
    for (let i = 0; i < data.playerCount; i++) {
      const spawn = SPAWN_POINTS[i];
      this._players.push(new Player(i, spawn, PLAYER_COLORS[i]));
    }
    
    this._state = GameState.Playing;
    this._dailyMode = data.dailyMode;
    if (this._dailyMode) {
      this._dailySeed = todaySeed();
      this._dailyRng = new SeededRNG(this._dailySeed);
    }
    
    this._isPlayback = true;
    this._recordingEnabled = false;
    this._pendingActions = [];
    
    this._replay.startPlayback(data);
    this.resetRound();
  }

  /** Stop replay playback */
  stopPlayback(): void {
    this._replay.stopPlayback();
    this._isPlayback = false;
    this._recordingEnabled = true;
    this._pendingActions = [];
    this.reset();
  }

  /** Update playback state - call in game loop */
  updatePlayback(): void {
    if (!this._isPlayback) return;
    
    // Get all ready actions
    const actions = this._replay.getReadyActions();
    
    // Execute each action
    for (const frame of actions) {
      if (frame.action === 'move' && frame.direction) {
        // Directly move player without re-recording
        const player = this._players[frame.playerId];
        if (player && player.isAlive()) {
          player.move(frame.direction, this._arena, 1 / 60);
        }
      } else if (frame.action === 'bomb') {
        // Directly place bomb without re-recording
        const player = this._players[frame.playerId];
        if (player && player.isAlive()) {
          const pos = player.dropBomb();
          if (pos) {
            const placed = this._bombManager.placeBomb(pos, frame.playerId, player.getFireRange());
            if (placed) {
              this._arena.setTile(pos.x, pos.y, 3);
              Sound.play('bombPlace');
            } else {
              player.onBombExploded();
            }
          }
        }
      }
    }
  }

  /** Check if currently in playback mode */
  isPlayback(): boolean {
    return this._isPlayback;
  }

  /** Get playback progress (0-1) */
  getPlaybackProgress(): number {
    return this._replay.playbackProgress;
  }

  /** Check if playback is complete */
  isPlaybackComplete(): boolean {
    return this._replay.isPlaybackComplete;
  }

  /** Get the last recorded replay data */
  getLastReplayData(): ReplayData | null {
    return this._lastReplayData;
  }

  /** Check if recording is enabled */
  isRecording(): boolean {
    return this._replay.isRecording;
  }
}
