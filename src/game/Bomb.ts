import { Position, TileType, PowerUpType } from './types';
import { Arena } from './Arena';
import { BOMB_TIMER, EXPLOSION_DURATION } from './constants';

export class Bomb {
  private _position: Position;
  private _owner: number;
  private _timer: number;
  private _range: number;
  private _exploded: boolean;

  constructor(position: Position, owner: number, range: number) {
    this._position = { ...position };
    this._owner = owner;
    this._timer = BOMB_TIMER;
    this._range = range;
    this._exploded = false;
  }

  get position(): Position {
    return { ...this._position };
  }

  get owner(): number {
    return this._owner;
  }

  get range(): number {
    return this._range;
  }

  get exploded(): boolean {
    return this._exploded;
  }

  update(dt: number): boolean {
    if (this._exploded) return true;
    
    this._timer -= dt;
    if (this._timer <= 0) {
      this._exploded = true;
      return true;
    }
    return false;
  }

  forceExplode(): void {
    this._exploded = true;
    this._timer = 0;
  }

  getTimeRemaining(): number {
    return Math.max(0, this._timer);
  }
}

export class Explosion {
  private _tiles: Position[];
  private _timer: number;
  private _center: Position;

  constructor(center: Position, range: number, arena: Arena) {
    this._center = { ...center };
    this._timer = EXPLOSION_DURATION;
    this._tiles = this.calculateTiles(center, range, arena);
  }

  get tiles(): Position[] {
    return this._tiles.map(t => ({ ...t }));
  }

  get center(): Position {
    return { ...this._center };
  }

  get timer(): number {
    return this._timer;
  }

  private calculateTiles(center: Position, range: number, arena: Arena): Position[] {
    const tiles: Position[] = [{ ...center }];
    const directions = [
      { dx: 0, dy: -1 }, // up
      { dx: 0, dy: 1 },  // down
      { dx: -1, dy: 0 }, // left
      { dx: 1, dy: 0 },  // right
    ];

    for (const dir of directions) {
      for (let i = 1; i <= range; i++) {
        const x = center.x + dir.dx * i;
        const y = center.y + dir.dy * i;
        const tile = arena.getTile(x, y);

        // Stop at hard walls
        if (tile === TileType.HardWall) {
          break;
        }

        tiles.push({ x, y });

        // Stop after soft block (but include it)
        if (tile === TileType.SoftBlock) {
          break;
        }
      }
    }

    return tiles;
  }

  update(dt: number): boolean {
    this._timer -= dt;
    return this._timer <= 0;
  }

  containsPosition(pos: Position): boolean {
    return this._tiles.some(t => t.x === pos.x && t.y === pos.y);
  }

  isFinished(): boolean {
    return this._timer <= 0;
  }
}

export class BombManager {
  private _bombs: Bomb[];
  private _explosions: Explosion[];

  constructor() {
    this._bombs = [];
    this._explosions = [];
  }

  get bombs(): Bomb[] {
    return [...this._bombs];
  }

  get explosions(): Explosion[] {
    return [...this._explosions];
  }

  placeBomb(position: Position, owner: number, range: number): boolean {
    // Check if bomb already exists at position
    if (this.getBombAt(position)) {
      return false;
    }
    this._bombs.push(new Bomb(position, owner, range));
    return true;
  }

  update(dt: number, arena: Arena): {
    exploded: Bomb[];
    destroyed: Position[];
    powerUps: Array<{ position: Position; type: PowerUpType }>;
    finished: Explosion[];
  } {
    const result = {
      exploded: [] as Bomb[],
      destroyed: [] as Position[],
      powerUps: [] as Array<{ position: Position; type: PowerUpType }>,
      finished: [] as Explosion[],
    };

    // First check for chain reactions (bombs in existing explosions)
    for (const bomb of this._bombs) {
      if (!bomb.exploded) {
        const inExplosion = this._explosions.some(exp => 
          exp.containsPosition(bomb.position)
        );
        if (inExplosion) {
          bomb.forceExplode();
        }
      }
    }

    // Update bombs and check for explosions
    const remainingBombs: Bomb[] = [];
    for (const bomb of this._bombs) {
      const wasExploded = bomb.exploded;
      const shouldExplode = bomb.update(dt);
      
      if (shouldExplode || wasExploded) {
        result.exploded.push(bomb);
        
        // Create explosion
        const explosion = new Explosion(bomb.position, bomb.range, arena);
        this._explosions.push(explosion);
        
        // Destroy soft blocks
        for (const tile of explosion.tiles) {
          if (arena.isDestructible(tile.x, tile.y)) {
            const powerUpType = arena.destroyBlock(tile.x, tile.y);
            result.destroyed.push({ ...tile });
            if (powerUpType) {
              result.powerUps.push({ position: { ...tile }, type: powerUpType });
            }
          }
        }
      } else {
        remainingBombs.push(bomb);
      }
    }
    this._bombs = remainingBombs;

    // Update explosions
    const remainingExplosions: Explosion[] = [];
    for (const explosion of this._explosions) {
      if (explosion.update(dt)) {
        result.finished.push(explosion);
      } else {
        remainingExplosions.push(explosion);
      }
    }
    this._explosions = remainingExplosions;

    return result;
  }

  getBombAt(position: Position): Bomb | null {
    return this._bombs.find(b => 
      b.position.x === position.x && b.position.y === position.y
    ) || null;
  }

  isExplosion(x: number, y: number): boolean {
    return this._explosions.some(exp => 
      exp.containsPosition({ x, y })
    );
  }

  clear(): void {
    this._bombs = [];
    this._explosions = [];
  }

  getBombCount(): number {
    return this._bombs.length;
  }

  getExplosionCount(): number {
    return this._explosions.length;
  }
}
