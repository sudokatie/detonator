import { Player } from '../game/Player';
import { Arena } from '../game/Arena';
import { PlayerState, Direction, PowerUpType } from '../game/types';
import { DEFAULT_BOMBS, DEFAULT_FIRE, DEFAULT_SPEED, MAX_BOMBS, MAX_FIRE, MAX_SPEED } from '../game/constants';

describe('Player', () => {
  let player: Player;
  let arena: Arena;

  beforeEach(() => {
    arena = new Arena();
    player = new Player(0, { x: 1, y: 1 }, '#00ff00');
  });

  describe('constructor', () => {
    it('should initialize at spawn position', () => {
      expect(player.position).toEqual({ x: 1, y: 1 });
    });

    it('should start alive', () => {
      expect(player.state).toBe(PlayerState.Alive);
      expect(player.isAlive()).toBe(true);
    });

    it('should have default stats', () => {
      const stats = player.stats;
      expect(stats.bombs).toBe(DEFAULT_BOMBS);
      expect(stats.fire).toBe(DEFAULT_FIRE);
      expect(stats.speed).toBe(DEFAULT_SPEED);
      expect(stats.alive).toBe(true);
      expect(stats.wins).toBe(0);
    });

    it('should have correct id and color', () => {
      expect(player.id).toBe(0);
      expect(player.color).toBe('#00ff00');
    });

    it('should start with no active bombs', () => {
      expect(player.activeBombs).toBe(0);
    });
  });

  describe('move', () => {
    it('should move up', () => {
      // Use spawn point which is already clear
      player = new Player(0, { x: 1, y: 2 }, '#00ff00');
      const startY = player.position.y;
      player.move(Direction.Up, arena, 0.2);
      expect(player.position.y).toBeLessThan(startY);
    });

    it('should move down', () => {
      player = new Player(0, { x: 1, y: 1 }, '#00ff00');
      const startY = player.position.y;
      player.move(Direction.Down, arena, 0.2);
      expect(player.position.y).toBeGreaterThan(startY);
    });

    it('should move left', () => {
      player = new Player(0, { x: 2, y: 1 }, '#00ff00');
      const startX = player.position.x;
      player.move(Direction.Left, arena, 0.2);
      expect(player.position.x).toBeLessThan(startX);
    });

    it('should move right', () => {
      player = new Player(0, { x: 1, y: 1 }, '#00ff00');
      const startX = player.position.x;
      player.move(Direction.Right, arena, 0.2);
      expect(player.position.x).toBeGreaterThan(startX);
    });

    it('should not move through walls', () => {
      const startPos = player.position;
      player.move(Direction.Up, arena, 0.5);
      player.move(Direction.Left, arena, 0.5);
      // Should be blocked by edge walls
      expect(player.position.y).toBeGreaterThanOrEqual(1);
      expect(player.position.x).toBeGreaterThanOrEqual(1);
    });

    it('should update direction', () => {
      player.move(Direction.Right, arena, 0.1);
      expect(player.direction).toBe(Direction.Right);
    });

    it('should not move when dead', () => {
      player.die();
      const pos = player.position;
      player.move(Direction.Right, arena, 1);
      expect(player.position).toEqual(pos);
    });

    it('should not move with Direction.None', () => {
      const pos = player.position;
      player.move(Direction.None, arena, 1);
      expect(player.position).toEqual(pos);
    });
  });

  describe('dropBomb', () => {
    it('should return grid position when dropping bomb', () => {
      const pos = player.dropBomb();
      expect(pos).toEqual({ x: 1, y: 1 });
    });

    it('should increment active bombs', () => {
      player.dropBomb();
      expect(player.activeBombs).toBe(1);
    });

    it('should return null when at bomb limit', () => {
      player.dropBomb();
      expect(player.dropBomb()).toBeNull();
    });

    it('should return null when dead', () => {
      player.die();
      expect(player.dropBomb()).toBeNull();
    });
  });

  describe('onBombExploded', () => {
    it('should decrement active bombs', () => {
      player.dropBomb();
      expect(player.activeBombs).toBe(1);
      player.onBombExploded();
      expect(player.activeBombs).toBe(0);
    });

    it('should not go below zero', () => {
      player.onBombExploded();
      expect(player.activeBombs).toBe(0);
    });
  });

  describe('canDropBomb', () => {
    it('should return true when can drop', () => {
      expect(player.canDropBomb()).toBe(true);
    });

    it('should return false when at limit', () => {
      player.dropBomb();
      expect(player.canDropBomb()).toBe(false);
    });

    it('should return false when dead', () => {
      player.die();
      expect(player.canDropBomb()).toBe(false);
    });
  });

  describe('collectPowerUp', () => {
    it('should increase bomb count', () => {
      player.collectPowerUp(PowerUpType.BombUp);
      expect(player.stats.bombs).toBe(DEFAULT_BOMBS + 1);
    });

    it('should increase fire range', () => {
      player.collectPowerUp(PowerUpType.FireUp);
      expect(player.stats.fire).toBe(DEFAULT_FIRE + 1);
    });

    it('should increase speed', () => {
      player.collectPowerUp(PowerUpType.SpeedUp);
      expect(player.stats.speed).toBe(DEFAULT_SPEED + 1);
    });

    it('should not exceed max bombs', () => {
      for (let i = 0; i < 20; i++) {
        player.collectPowerUp(PowerUpType.BombUp);
      }
      expect(player.stats.bombs).toBe(MAX_BOMBS);
    });

    it('should not exceed max fire', () => {
      for (let i = 0; i < 20; i++) {
        player.collectPowerUp(PowerUpType.FireUp);
      }
      expect(player.stats.fire).toBe(MAX_FIRE);
    });

    it('should not exceed max speed', () => {
      for (let i = 0; i < 20; i++) {
        player.collectPowerUp(PowerUpType.SpeedUp);
      }
      expect(player.stats.speed).toBe(MAX_SPEED);
    });

    it('should not collect when dead', () => {
      player.die();
      player.collectPowerUp(PowerUpType.BombUp);
      expect(player.stats.bombs).toBe(DEFAULT_BOMBS);
    });
  });

  describe('die', () => {
    it('should set state to Dead', () => {
      player.die();
      expect(player.state).toBe(PlayerState.Dead);
      expect(player.isAlive()).toBe(false);
    });

    it('should update stats.alive', () => {
      player.die();
      expect(player.stats.alive).toBe(false);
    });
  });

  describe('addWin', () => {
    it('should increment wins', () => {
      player.addWin();
      expect(player.stats.wins).toBe(1);
      player.addWin();
      expect(player.stats.wins).toBe(2);
    });
  });

  describe('reset', () => {
    it('should reset position to spawn', () => {
      player.move(Direction.Right, arena, 0.5);
      player.reset({ x: 5, y: 5 });
      expect(player.position).toEqual({ x: 5, y: 5 });
    });

    it('should reset state to Alive', () => {
      player.die();
      player.reset({ x: 1, y: 1 });
      expect(player.isAlive()).toBe(true);
    });

    it('should reset stats but preserve wins', () => {
      player.collectPowerUp(PowerUpType.BombUp);
      player.addWin();
      player.reset({ x: 1, y: 1 });
      expect(player.stats.bombs).toBe(DEFAULT_BOMBS);
      expect(player.stats.wins).toBe(1);
    });

    it('should reset active bombs', () => {
      player.dropBomb();
      player.reset({ x: 1, y: 1 });
      expect(player.activeBombs).toBe(0);
    });
  });

  describe('getGridPosition', () => {
    it('should return floored position centered', () => {
      expect(player.getGridPosition()).toEqual({ x: 1, y: 1 });
    });
  });

  describe('getBoundingBox', () => {
    it('should return correct bounding box', () => {
      const box = player.getBoundingBox();
      expect(box).toHaveProperty('x');
      expect(box).toHaveProperty('y');
      expect(box.width).toBe(32);
      expect(box.height).toBe(32);
    });
  });

  describe('getFireRange', () => {
    it('should return current fire stat', () => {
      expect(player.getFireRange()).toBe(DEFAULT_FIRE);
      player.collectPowerUp(PowerUpType.FireUp);
      expect(player.getFireRange()).toBe(DEFAULT_FIRE + 1);
    });
  });

  describe('position immutability', () => {
    it('should return copy of position', () => {
      const pos = player.position;
      pos.x = 999;
      expect(player.position.x).toBe(1);
    });

    it('should return copy of stats', () => {
      const stats = player.stats;
      stats.bombs = 999;
      expect(player.stats.bombs).toBe(DEFAULT_BOMBS);
    });
  });

  describe('walk animation', () => {
    it('should start with walkFrame 0', () => {
      expect(player.walkFrame).toBe(0);
    });

    it('should not be moving initially', () => {
      expect(player.isMoving).toBe(false);
    });

    it('should set isMoving when player moves', () => {
      player = new Player(0, { x: 1, y: 2 }, '#00ff00');
      player.move(Direction.Up, arena, 0.1);
      expect(player.isMoving).toBe(true);
    });

    it('should cycle through walk frames when moving', () => {
      player = new Player(0, { x: 1, y: 2 }, '#00ff00');
      player.move(Direction.Up, arena, 0.1);
      expect(player.walkFrame).toBe(0);
      
      // Simulate 100ms (one frame duration)
      player.updateAnimation(0.1);
      player.move(Direction.Up, arena, 0.1);
      expect(player.walkFrame).toBe(1);

      // Another 100ms
      player.updateAnimation(0.1);
      player.move(Direction.Up, arena, 0.1);
      expect(player.walkFrame).toBe(2);
    });

    it('should reset walk frame when not moving', () => {
      player = new Player(0, { x: 1, y: 2 }, '#00ff00');
      player.move(Direction.Up, arena, 0.1);
      player.updateAnimation(0.1);
      player.move(Direction.Up, arena, 0.1);
      expect(player.walkFrame).toBe(1);

      // Stop moving - updateAnimation resets isMoving, so next call with no move() will reset frame
      player.updateAnimation(0.01); // This resets isMoving to false
      // Don't call move, then update again
      player.updateAnimation(0.01); // Now isMoving is still false, so walk frame resets
      expect(player.walkFrame).toBe(0);
    });
  });

  describe('death animation', () => {
    it('should start death timer at 0', () => {
      expect(player.deathTimer).toBe(0);
    });

    it('should have death progress 0 initially', () => {
      expect(player.deathProgress).toBe(0);
    });

    it('should not be death animation complete when alive', () => {
      expect(player.isDeathAnimationComplete()).toBe(false);
    });

    it('should start death animation when die() is called', () => {
      player.die();
      expect(player.deathTimer).toBe(0);
      expect(player.deathProgress).toBe(0);
    });

    it('should progress death animation over time', () => {
      player.die();
      player.updateAnimation(0.15); // Half of 300ms
      expect(player.deathProgress).toBeCloseTo(0.5, 1);
    });

    it('should complete death animation after 300ms', () => {
      player.die();
      player.updateAnimation(0.3);
      expect(player.isDeathAnimationComplete()).toBe(true);
      expect(player.deathProgress).toBe(1);
    });

    it('should cap death progress at 1', () => {
      player.die();
      player.updateAnimation(1.0); // Way more than 300ms
      expect(player.deathProgress).toBe(1);
    });

    it('should reset animation state on reset', () => {
      player.die();
      player.updateAnimation(0.3);
      player.reset({ x: 1, y: 1 });
      expect(player.deathTimer).toBe(0);
      expect(player.walkFrame).toBe(0);
      expect(player.isMoving).toBe(false);
      expect(player.isDeathAnimationComplete()).toBe(false);
    });
  });
});
