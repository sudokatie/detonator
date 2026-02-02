import { Bomb, Explosion, BombManager } from '../game/Bomb';
import { Arena } from '../game/Arena';
import { TileType } from '../game/types';
import { BOMB_TIMER, EXPLOSION_DURATION } from '../game/constants';

describe('Bomb', () => {
  let bomb: Bomb;

  beforeEach(() => {
    bomb = new Bomb({ x: 5, y: 5 }, 0, 2);
  });

  describe('constructor', () => {
    it('should initialize at given position', () => {
      expect(bomb.position).toEqual({ x: 5, y: 5 });
    });

    it('should have correct owner', () => {
      expect(bomb.owner).toBe(0);
    });

    it('should have correct range', () => {
      expect(bomb.range).toBe(2);
    });

    it('should not be exploded initially', () => {
      expect(bomb.exploded).toBe(false);
    });
  });

  describe('update', () => {
    it('should count down timer', () => {
      const initialTime = bomb.getTimeRemaining();
      bomb.update(1);
      expect(bomb.getTimeRemaining()).toBeLessThan(initialTime);
    });

    it('should return false while timer active', () => {
      expect(bomb.update(1)).toBe(false);
    });

    it('should return true when timer expires', () => {
      expect(bomb.update(BOMB_TIMER + 0.1)).toBe(true);
    });

    it('should set exploded when timer expires', () => {
      bomb.update(BOMB_TIMER + 0.1);
      expect(bomb.exploded).toBe(true);
    });
  });

  describe('forceExplode', () => {
    it('should set exploded to true', () => {
      bomb.forceExplode();
      expect(bomb.exploded).toBe(true);
    });

    it('should set timer to 0', () => {
      bomb.forceExplode();
      expect(bomb.getTimeRemaining()).toBe(0);
    });
  });

  describe('getTimeRemaining', () => {
    it('should return remaining time', () => {
      bomb.update(1);
      expect(bomb.getTimeRemaining()).toBeCloseTo(BOMB_TIMER - 1);
    });

    it('should not go negative', () => {
      bomb.update(10);
      expect(bomb.getTimeRemaining()).toBe(0);
    });
  });

  describe('position immutability', () => {
    it('should return copy of position', () => {
      const pos = bomb.position;
      pos.x = 999;
      expect(bomb.position.x).toBe(5);
    });
  });
});

describe('Explosion', () => {
  let arena: Arena;
  let explosion: Explosion;

  beforeEach(() => {
    arena = new Arena();
    // Clear area around (5, 5) for testing
    for (let y = 3; y <= 7; y++) {
      for (let x = 3; x <= 7; x++) {
        if (arena.getTile(x, y) !== TileType.HardWall) {
          arena.setTile(x, y, TileType.Floor);
        }
      }
    }
    explosion = new Explosion({ x: 5, y: 5 }, 2, arena);
  });

  describe('constructor', () => {
    it('should create tiles in cross pattern', () => {
      const tiles = explosion.tiles;
      // Center
      expect(tiles).toContainEqual({ x: 5, y: 5 });
      // Up
      expect(tiles).toContainEqual({ x: 5, y: 4 });
      expect(tiles).toContainEqual({ x: 5, y: 3 });
      // Down
      expect(tiles).toContainEqual({ x: 5, y: 6 });
      expect(tiles).toContainEqual({ x: 5, y: 7 });
      // Left
      expect(tiles).toContainEqual({ x: 4, y: 5 });
      expect(tiles).toContainEqual({ x: 3, y: 5 });
      // Right
      expect(tiles).toContainEqual({ x: 6, y: 5 });
      expect(tiles).toContainEqual({ x: 7, y: 5 });
    });

    it('should stop at hard walls', () => {
      // (6, 6) is a hard wall in standard pattern
      const tilesNearWall = explosion.tiles.filter(t => t.x === 6 && t.y === 6);
      expect(tilesNearWall.length).toBe(0);
    });
  });

  describe('soft block handling', () => {
    it('should include soft block but stop after it', () => {
      arena.setTile(4, 5, TileType.SoftBlock);
      explosion = new Explosion({ x: 5, y: 5 }, 2, arena);
      const tiles = explosion.tiles;
      // Should include the soft block
      expect(tiles).toContainEqual({ x: 4, y: 5 });
      // Should not include beyond it
      expect(tiles).not.toContainEqual({ x: 3, y: 5 });
    });
  });

  describe('update', () => {
    it('should count down timer', () => {
      const initialTime = explosion.timer;
      explosion.update(0.1);
      expect(explosion.timer).toBeLessThan(initialTime);
    });

    it('should return false while active', () => {
      expect(explosion.update(0.1)).toBe(false);
    });

    it('should return true when finished', () => {
      expect(explosion.update(EXPLOSION_DURATION + 0.1)).toBe(true);
    });
  });

  describe('containsPosition', () => {
    it('should return true for explosion tiles', () => {
      expect(explosion.containsPosition({ x: 5, y: 5 })).toBe(true);
      expect(explosion.containsPosition({ x: 5, y: 4 })).toBe(true);
    });

    it('should return false for non-explosion tiles', () => {
      expect(explosion.containsPosition({ x: 0, y: 0 })).toBe(false);
    });
  });

  describe('isFinished', () => {
    it('should return false initially', () => {
      expect(explosion.isFinished()).toBe(false);
    });

    it('should return true after timer expires', () => {
      explosion.update(EXPLOSION_DURATION + 0.1);
      expect(explosion.isFinished()).toBe(true);
    });
  });

  describe('animation phases', () => {
    it('should start in expand phase', () => {
      expect(explosion.phase).toBe('expand');
    });

    it('should transition to full phase', () => {
      explosion.update(EXPLOSION_DURATION * 0.4); // 40% through
      expect(explosion.phase).toBe('full');
    });

    it('should transition to fade phase', () => {
      explosion.update(EXPLOSION_DURATION * 0.8); // 80% through
      expect(explosion.phase).toBe('fade');
    });

    it('should have 0 progress initially', () => {
      expect(explosion.progress).toBeCloseTo(0, 1);
    });

    it('should have 1 progress at end', () => {
      explosion.update(EXPLOSION_DURATION);
      expect(explosion.progress).toBeCloseTo(1, 1);
    });

    it('should scale from 0 to 1 during expand phase', () => {
      expect(explosion.scale).toBeCloseTo(0, 1);
      explosion.update(EXPLOSION_DURATION * 0.16);
      expect(explosion.scale).toBeCloseTo(0.5, 1);
      explosion.update(EXPLOSION_DURATION * 0.16);
      expect(explosion.scale).toBeCloseTo(1, 1);
    });

    it('should maintain scale of 1 during full phase', () => {
      explosion.update(EXPLOSION_DURATION * 0.5);
      expect(explosion.scale).toBeCloseTo(1, 1);
    });

    it('should scale from 1 to 0 during fade phase', () => {
      explosion.update(EXPLOSION_DURATION * 0.7);
      expect(explosion.scale).toBeLessThan(1);
      explosion.update(EXPLOSION_DURATION * 0.29);
      expect(explosion.scale).toBeLessThan(0.2);
    });

    it('should have full opacity in expand and full phases', () => {
      expect(explosion.opacity).toBe(1);
      explosion.update(EXPLOSION_DURATION * 0.5);
      expect(explosion.opacity).toBe(1);
    });

    it('should fade opacity in fade phase', () => {
      explosion.update(EXPLOSION_DURATION * 0.8);
      expect(explosion.opacity).toBeLessThan(1);
    });
  });
});

describe('BombManager', () => {
  let manager: BombManager;
  let arena: Arena;

  beforeEach(() => {
    manager = new BombManager();
    arena = new Arena();
  });

  describe('placeBomb', () => {
    it('should add bomb at position', () => {
      expect(manager.placeBomb({ x: 5, y: 5 }, 0, 2)).toBe(true);
      expect(manager.getBombCount()).toBe(1);
    });

    it('should return false if bomb already at position', () => {
      manager.placeBomb({ x: 5, y: 5 }, 0, 2);
      expect(manager.placeBomb({ x: 5, y: 5 }, 1, 2)).toBe(false);
    });

    it('should allow bombs at different positions', () => {
      manager.placeBomb({ x: 5, y: 5 }, 0, 2);
      manager.placeBomb({ x: 6, y: 5 }, 1, 2);
      expect(manager.getBombCount()).toBe(2);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      // Clear a test area
      arena.setTile(5, 5, TileType.Floor);
      arena.setTile(5, 4, TileType.Floor);
      arena.setTile(5, 6, TileType.Floor);
      arena.setTile(4, 5, TileType.Floor);
      arena.setTile(6, 5, TileType.Floor);
    });

    it('should explode bombs when timer expires', () => {
      manager.placeBomb({ x: 5, y: 5 }, 0, 1);
      const result = manager.update(BOMB_TIMER + 0.1, arena);
      expect(result.exploded.length).toBe(1);
    });

    it('should create explosions', () => {
      manager.placeBomb({ x: 5, y: 5 }, 0, 1);
      // First advance time to just before bomb explodes
      manager.update(BOMB_TIMER - 0.1, arena);
      expect(manager.getBombCount()).toBe(1);
      // Then trigger explosion with small dt
      manager.update(0.2, arena);
      expect(manager.getBombCount()).toBe(0);
      expect(manager.getExplosionCount()).toBe(1);
    });

    it('should remove exploded bombs', () => {
      manager.placeBomb({ x: 5, y: 5 }, 0, 1);
      manager.update(BOMB_TIMER + 0.1, arena);
      expect(manager.getBombCount()).toBe(0);
    });

    it('should chain react bombs', () => {
      // Clear area for chain
      arena.setTile(7, 5, TileType.Floor);
      
      // Place two adjacent bombs
      manager.placeBomb({ x: 5, y: 5 }, 0, 2);
      manager.placeBomb({ x: 7, y: 5 }, 1, 1);
      
      // Advance time then trigger with small dt
      manager.update(BOMB_TIMER - 0.1, arena);
      manager.update(0.2, arena);
      
      // Both should have exploded
      expect(manager.getBombCount()).toBe(0);
      expect(manager.getExplosionCount()).toBe(2);
    });

    it('should track destroyed blocks', () => {
      // Set a soft block in explosion path
      arena.setTile(6, 5, TileType.SoftBlock);
      manager.placeBomb({ x: 5, y: 5 }, 0, 2);
      const result = manager.update(BOMB_TIMER + 0.1, arena);
      expect(result.destroyed.length).toBeGreaterThan(0);
    });

    it('should remove finished explosions', () => {
      manager.placeBomb({ x: 5, y: 5 }, 0, 1);
      // Trigger explosion
      manager.update(BOMB_TIMER - 0.1, arena);
      manager.update(0.2, arena);
      expect(manager.getExplosionCount()).toBe(1);
      // Now let explosion finish
      manager.update(EXPLOSION_DURATION + 0.1, arena);
      expect(manager.getExplosionCount()).toBe(0);
    });
  });

  describe('getBombAt', () => {
    it('should return bomb at position', () => {
      manager.placeBomb({ x: 5, y: 5 }, 0, 2);
      const bomb = manager.getBombAt({ x: 5, y: 5 });
      expect(bomb).not.toBeNull();
      expect(bomb?.position).toEqual({ x: 5, y: 5 });
    });

    it('should return null for empty position', () => {
      expect(manager.getBombAt({ x: 5, y: 5 })).toBeNull();
    });
  });

  describe('isExplosion', () => {
    it('should return true for explosion tiles', () => {
      arena.setTile(5, 5, TileType.Floor);
      manager.placeBomb({ x: 5, y: 5 }, 0, 1);
      manager.update(BOMB_TIMER - 0.1, arena);
      manager.update(0.2, arena);
      expect(manager.isExplosion(5, 5)).toBe(true);
    });

    it('should return false when no explosion', () => {
      expect(manager.isExplosion(5, 5)).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all bombs and explosions', () => {
      arena.setTile(5, 5, TileType.Floor);
      manager.placeBomb({ x: 5, y: 5 }, 0, 1);
      manager.update(BOMB_TIMER - 0.1, arena);
      manager.update(0.2, arena);
      manager.clear();
      expect(manager.getBombCount()).toBe(0);
      expect(manager.getExplosionCount()).toBe(0);
    });
  });

  describe('getters', () => {
    it('should return copy of bombs array', () => {
      manager.placeBomb({ x: 5, y: 5 }, 0, 2);
      const bombs = manager.bombs;
      bombs.pop();
      expect(manager.getBombCount()).toBe(1);
    });

    it('should return copy of explosions array', () => {
      arena.setTile(5, 5, TileType.Floor);
      manager.placeBomb({ x: 5, y: 5 }, 0, 1);
      manager.update(BOMB_TIMER - 0.1, arena);
      manager.update(0.2, arena);
      const explosions = manager.explosions;
      explosions.pop();
      expect(manager.getExplosionCount()).toBe(1);
    });
  });
});
