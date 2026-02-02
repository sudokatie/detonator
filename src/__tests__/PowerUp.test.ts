import { PowerUp, PowerUpManager } from '../game/PowerUp';
import { PowerUpType } from '../game/types';
import { POWERUP_LIFETIME } from '../game/constants';

describe('PowerUp', () => {
  describe('constructor', () => {
    it('should create power-up at position', () => {
      const pu = new PowerUp({ x: 5, y: 3 }, PowerUpType.BombUp);
      expect(pu.position).toEqual({ x: 5, y: 3 });
      expect(pu.type).toBe(PowerUpType.BombUp);
    });

    it('should start with full lifetime', () => {
      const pu = new PowerUp({ x: 0, y: 0 }, PowerUpType.FireUp);
      expect(pu.timer).toBe(POWERUP_LIFETIME);
    });

    it('should not be expired initially', () => {
      const pu = new PowerUp({ x: 0, y: 0 }, PowerUpType.SpeedUp);
      expect(pu.isExpired()).toBe(false);
    });
  });

  describe('update', () => {
    it('should decrease timer', () => {
      const pu = new PowerUp({ x: 0, y: 0 }, PowerUpType.BombUp);
      pu.update(1);
      expect(pu.timer).toBe(POWERUP_LIFETIME - 1);
    });

    it('should return false when not expired', () => {
      const pu = new PowerUp({ x: 0, y: 0 }, PowerUpType.BombUp);
      expect(pu.update(1)).toBe(false);
    });

    it('should return true when expired', () => {
      const pu = new PowerUp({ x: 0, y: 0 }, PowerUpType.BombUp);
      expect(pu.update(POWERUP_LIFETIME + 1)).toBe(true);
    });

    it('should be expired after full lifetime', () => {
      const pu = new PowerUp({ x: 0, y: 0 }, PowerUpType.BombUp);
      pu.update(POWERUP_LIFETIME);
      expect(pu.isExpired()).toBe(true);
    });
  });

  describe('getTimeRemaining', () => {
    it('should return remaining time', () => {
      const pu = new PowerUp({ x: 0, y: 0 }, PowerUpType.BombUp);
      pu.update(3);
      expect(pu.getTimeRemaining()).toBe(POWERUP_LIFETIME - 3);
    });

    it('should not return negative time', () => {
      const pu = new PowerUp({ x: 0, y: 0 }, PowerUpType.BombUp);
      pu.update(POWERUP_LIFETIME + 5);
      expect(pu.getTimeRemaining()).toBe(0);
    });
  });
});

describe('PowerUpManager', () => {
  let manager: PowerUpManager;

  beforeEach(() => {
    manager = new PowerUpManager();
  });

  describe('spawn', () => {
    it('should spawn power-up at position', () => {
      manager.spawn({ x: 5, y: 5 }, PowerUpType.BombUp);
      expect(manager.getCount()).toBe(1);
    });

    it('should not spawn duplicate at same position', () => {
      manager.spawn({ x: 5, y: 5 }, PowerUpType.BombUp);
      manager.spawn({ x: 5, y: 5 }, PowerUpType.FireUp);
      expect(manager.getCount()).toBe(1);
    });

    it('should spawn at different positions', () => {
      manager.spawn({ x: 1, y: 1 }, PowerUpType.BombUp);
      manager.spawn({ x: 2, y: 2 }, PowerUpType.FireUp);
      manager.spawn({ x: 3, y: 3 }, PowerUpType.SpeedUp);
      expect(manager.getCount()).toBe(3);
    });
  });

  describe('getPowerUpAt', () => {
    it('should return power-up at position', () => {
      manager.spawn({ x: 5, y: 5 }, PowerUpType.BombUp);
      const pu = manager.getPowerUpAt({ x: 5, y: 5 });
      expect(pu).not.toBeNull();
      expect(pu?.type).toBe(PowerUpType.BombUp);
    });

    it('should return null for empty position', () => {
      manager.spawn({ x: 5, y: 5 }, PowerUpType.BombUp);
      expect(manager.getPowerUpAt({ x: 1, y: 1 })).toBeNull();
    });
  });

  describe('collect', () => {
    it('should return type and remove power-up', () => {
      manager.spawn({ x: 5, y: 5 }, PowerUpType.FireUp);
      const type = manager.collect({ x: 5, y: 5 });
      expect(type).toBe(PowerUpType.FireUp);
      expect(manager.getCount()).toBe(0);
    });

    it('should return null for empty position', () => {
      expect(manager.collect({ x: 5, y: 5 })).toBeNull();
    });
  });

  describe('update', () => {
    it('should return expired positions', () => {
      manager.spawn({ x: 1, y: 1 }, PowerUpType.BombUp);
      manager.spawn({ x: 2, y: 2 }, PowerUpType.FireUp);
      
      const expired = manager.update(POWERUP_LIFETIME + 1);
      expect(expired).toHaveLength(2);
      expect(manager.getCount()).toBe(0);
    });

    it('should keep non-expired power-ups', () => {
      manager.spawn({ x: 1, y: 1 }, PowerUpType.BombUp);
      
      const expired = manager.update(1);
      expect(expired).toHaveLength(0);
      expect(manager.getCount()).toBe(1);
    });
  });

  describe('removeAt', () => {
    it('should remove power-up at position', () => {
      manager.spawn({ x: 5, y: 5 }, PowerUpType.BombUp);
      expect(manager.removeAt({ x: 5, y: 5 })).toBe(true);
      expect(manager.getCount()).toBe(0);
    });

    it('should return false for empty position', () => {
      expect(manager.removeAt({ x: 5, y: 5 })).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all power-ups', () => {
      manager.spawn({ x: 1, y: 1 }, PowerUpType.BombUp);
      manager.spawn({ x: 2, y: 2 }, PowerUpType.FireUp);
      manager.spawn({ x: 3, y: 3 }, PowerUpType.SpeedUp);
      
      manager.clear();
      expect(manager.getCount()).toBe(0);
    });
  });
});
