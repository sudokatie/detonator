import { TileType, Position, PowerUpType } from './types';
import { GRID_WIDTH, GRID_HEIGHT, SPAWN_POINTS, POWERUP_SPAWN_CHANCE } from './constants';

export class Arena {
  private grid: TileType[][];
  private width: number;
  private height: number;

  constructor(width: number = GRID_WIDTH, height: number = GRID_HEIGHT) {
    this.width = width;
    this.height = height;
    this.grid = [];
    this.generate();
  }

  generate(): void {
    this.grid = [];
    
    for (let y = 0; y < this.height; y++) {
      const row: TileType[] = [];
      for (let x = 0; x < this.width; x++) {
        row.push(this.getTileForPosition(x, y));
      }
      this.grid.push(row);
    }

    // Clear spawn zones (2x2 area around each spawn point)
    for (const spawn of SPAWN_POINTS) {
      this.clearSpawnZone(spawn);
    }
  }

  private getTileForPosition(x: number, y: number): TileType {
    // Edges are hard walls
    if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
      return TileType.HardWall;
    }

    // Checkerboard pattern of hard walls (every other cell)
    if (x % 2 === 0 && y % 2 === 0) {
      return TileType.HardWall;
    }

    // Everything else starts as soft block
    return TileType.SoftBlock;
  }

  private clearSpawnZone(spawn: Position): void {
    // Clear 2x2 area around spawn point
    const offsets = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 0, y: -1 },
    ];

    for (const offset of offsets) {
      const x = spawn.x + offset.x;
      const y = spawn.y + offset.y;
      if (this.isValidPosition(x, y) && this.grid[y][x] === TileType.SoftBlock) {
        this.grid[y][x] = TileType.Floor;
      }
    }
  }

  reset(): void {
    this.generate();
  }

  getTile(x: number, y: number): TileType {
    if (!this.isValidPosition(x, y)) {
      return TileType.HardWall;
    }
    return this.grid[y][x];
  }

  setTile(x: number, y: number, tile: TileType): void {
    if (this.isValidPosition(x, y)) {
      this.grid[y][x] = tile;
    }
  }

  isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  isWalkable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile === TileType.Floor || tile === TileType.PowerUp;
  }

  isDestructible(x: number, y: number): boolean {
    return this.getTile(x, y) === TileType.SoftBlock;
  }

  isSolid(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    return tile === TileType.HardWall || tile === TileType.SoftBlock || tile === TileType.Bomb;
  }

  destroyBlock(x: number, y: number): PowerUpType | null {
    if (!this.isDestructible(x, y)) {
      return null;
    }

    // Random chance to spawn power-up
    if (Math.random() < POWERUP_SPAWN_CHANCE) {
      this.grid[y][x] = TileType.PowerUp;
      const types = [PowerUpType.BombUp, PowerUpType.FireUp, PowerUpType.SpeedUp];
      return types[Math.floor(Math.random() * types.length)];
    }

    this.grid[y][x] = TileType.Floor;
    return null;
  }

  getGrid(): TileType[][] {
    return this.grid.map(row => [...row]);
  }

  getSpawnPoints(): Position[] {
    return SPAWN_POINTS.map(p => ({ ...p }));
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }
}
