import { Arena } from '../game/Arena';
import { TileType } from '../game/types';
import { GRID_WIDTH, GRID_HEIGHT, SPAWN_POINTS } from '../game/constants';

describe('Arena', () => {
  let arena: Arena;

  beforeEach(() => {
    arena = new Arena();
  });

  describe('constructor', () => {
    it('should create arena with default dimensions', () => {
      expect(arena.getWidth()).toBe(GRID_WIDTH);
      expect(arena.getHeight()).toBe(GRID_HEIGHT);
    });

    it('should create arena with custom dimensions', () => {
      const custom = new Arena(15, 13);
      expect(custom.getWidth()).toBe(15);
      expect(custom.getHeight()).toBe(13);
    });
  });

  describe('generate', () => {
    it('should create grid of correct size', () => {
      const grid = arena.getGrid();
      expect(grid.length).toBe(GRID_HEIGHT);
      expect(grid[0].length).toBe(GRID_WIDTH);
    });

    it('should have hard walls on all edges', () => {
      // Top edge
      for (let x = 0; x < GRID_WIDTH; x++) {
        expect(arena.getTile(x, 0)).toBe(TileType.HardWall);
      }
      // Bottom edge
      for (let x = 0; x < GRID_WIDTH; x++) {
        expect(arena.getTile(x, GRID_HEIGHT - 1)).toBe(TileType.HardWall);
      }
      // Left edge
      for (let y = 0; y < GRID_HEIGHT; y++) {
        expect(arena.getTile(0, y)).toBe(TileType.HardWall);
      }
      // Right edge
      for (let y = 0; y < GRID_HEIGHT; y++) {
        expect(arena.getTile(GRID_WIDTH - 1, y)).toBe(TileType.HardWall);
      }
    });

    it('should have hard walls in checkerboard pattern', () => {
      // Interior cells where both coords are even should be hard wall
      expect(arena.getTile(2, 2)).toBe(TileType.HardWall);
      expect(arena.getTile(4, 4)).toBe(TileType.HardWall);
      expect(arena.getTile(6, 6)).toBe(TileType.HardWall);
    });

    it('should have spawn zones clear of soft blocks', () => {
      for (const spawn of SPAWN_POINTS) {
        expect(arena.getTile(spawn.x, spawn.y)).toBe(TileType.Floor);
      }
    });

    it('should clear adjacent tiles around spawn points', () => {
      // P1 spawn at (1,1) should have floor tiles around it
      expect(arena.getTile(1, 1)).toBe(TileType.Floor);
      expect(arena.getTile(2, 1)).toBe(TileType.Floor);
      expect(arena.getTile(1, 2)).toBe(TileType.Floor);
    });
  });

  describe('getTile', () => {
    it('should return correct tile type', () => {
      expect(arena.getTile(0, 0)).toBe(TileType.HardWall);
    });

    it('should return HardWall for out of bounds', () => {
      expect(arena.getTile(-1, 0)).toBe(TileType.HardWall);
      expect(arena.getTile(100, 0)).toBe(TileType.HardWall);
      expect(arena.getTile(0, -1)).toBe(TileType.HardWall);
      expect(arena.getTile(0, 100)).toBe(TileType.HardWall);
    });
  });

  describe('setTile', () => {
    it('should update tile at position', () => {
      arena.setTile(3, 3, TileType.Floor);
      expect(arena.getTile(3, 3)).toBe(TileType.Floor);
    });

    it('should ignore invalid positions', () => {
      arena.setTile(-1, -1, TileType.Floor);
      // Should not throw
    });
  });

  describe('isWalkable', () => {
    it('should return true for floor', () => {
      arena.setTile(3, 3, TileType.Floor);
      expect(arena.isWalkable(3, 3)).toBe(true);
    });

    it('should return true for power-up', () => {
      arena.setTile(3, 3, TileType.PowerUp);
      expect(arena.isWalkable(3, 3)).toBe(true);
    });

    it('should return false for hard wall', () => {
      expect(arena.isWalkable(0, 0)).toBe(false);
    });

    it('should return false for soft block', () => {
      // Find a soft block (not in spawn zone)
      arena.setTile(5, 5, TileType.SoftBlock);
      expect(arena.isWalkable(5, 5)).toBe(false);
    });

    it('should return false for bomb', () => {
      arena.setTile(3, 3, TileType.Bomb);
      expect(arena.isWalkable(3, 3)).toBe(false);
    });
  });

  describe('isDestructible', () => {
    it('should return true for soft block', () => {
      arena.setTile(3, 3, TileType.SoftBlock);
      expect(arena.isDestructible(3, 3)).toBe(true);
    });

    it('should return false for hard wall', () => {
      expect(arena.isDestructible(0, 0)).toBe(false);
    });

    it('should return false for floor', () => {
      arena.setTile(3, 3, TileType.Floor);
      expect(arena.isDestructible(3, 3)).toBe(false);
    });
  });

  describe('isSolid', () => {
    it('should return true for hard wall', () => {
      expect(arena.isSolid(0, 0)).toBe(true);
    });

    it('should return true for soft block', () => {
      arena.setTile(3, 3, TileType.SoftBlock);
      expect(arena.isSolid(3, 3)).toBe(true);
    });

    it('should return true for bomb', () => {
      arena.setTile(3, 3, TileType.Bomb);
      expect(arena.isSolid(3, 3)).toBe(true);
    });

    it('should return false for floor', () => {
      arena.setTile(3, 3, TileType.Floor);
      expect(arena.isSolid(3, 3)).toBe(false);
    });
  });

  describe('destroyBlock', () => {
    it('should destroy soft block', () => {
      arena.setTile(3, 3, TileType.SoftBlock);
      arena.destroyBlock(3, 3);
      const tile = arena.getTile(3, 3);
      expect(tile === TileType.Floor || tile === TileType.PowerUp).toBe(true);
    });

    it('should return null for non-destructible tile', () => {
      expect(arena.destroyBlock(0, 0)).toBeNull();
    });

    it('should not destroy hard walls', () => {
      arena.destroyBlock(0, 0);
      expect(arena.getTile(0, 0)).toBe(TileType.HardWall);
    });
  });

  describe('reset', () => {
    it('should regenerate the arena', () => {
      arena.setTile(3, 3, TileType.Explosion);
      arena.reset();
      expect(arena.getTile(3, 3)).not.toBe(TileType.Explosion);
    });
  });

  describe('getSpawnPoints', () => {
    it('should return 4 spawn points', () => {
      expect(arena.getSpawnPoints()).toHaveLength(4);
    });

    it('should return copies of spawn points', () => {
      const points = arena.getSpawnPoints();
      points[0].x = 999;
      expect(arena.getSpawnPoints()[0].x).not.toBe(999);
    });
  });

  describe('getGrid', () => {
    it('should return copy of grid', () => {
      const grid = arena.getGrid();
      grid[1][1] = TileType.Explosion;
      expect(arena.getTile(1, 1)).not.toBe(TileType.Explosion);
    });
  });
});
