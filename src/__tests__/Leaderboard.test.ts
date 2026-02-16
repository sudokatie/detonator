/**
 * @jest-environment jsdom
 */

import { Leaderboard, LeaderboardEntry } from '../game/Leaderboard';

describe('Leaderboard', () => {
  beforeEach(() => {
    // Clear localStorage and reset Leaderboard cache
    localStorage.clear();
    Leaderboard.resetCache();
  });

  describe('load', () => {
    it('should return empty array when no data exists', () => {
      const entries = Leaderboard.load();
      expect(entries).toEqual([]);
    });

    it('should load existing data from localStorage', () => {
      const data: LeaderboardEntry[] = [
        { name: 'Player 1', wins: 5, lastPlayed: '2026-01-01T00:00:00Z' },
        { name: 'Player 2', wins: 3, lastPlayed: '2026-01-02T00:00:00Z' },
      ];
      localStorage.setItem('detonator_leaderboard', JSON.stringify(data));
      Leaderboard.resetCache();

      const entries = Leaderboard.load();
      expect(entries).toEqual(data);
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('detonator_leaderboard', 'not valid json');
      Leaderboard.resetCache();

      const entries = Leaderboard.load();
      expect(entries).toEqual([]);
    });
  });

  describe('recordWin', () => {
    it('should add new player entry', () => {
      Leaderboard.recordWin('Alice');

      const entries = Leaderboard.getAll();
      expect(entries.length).toBe(1);
      expect(entries[0].name).toBe('Alice');
      expect(entries[0].wins).toBe(1);
    });

    it('should increment wins for existing player', () => {
      Leaderboard.recordWin('Bob');
      Leaderboard.recordWin('Bob');
      Leaderboard.recordWin('Bob');

      const entries = Leaderboard.getAll();
      expect(entries.length).toBe(1);
      expect(entries[0].wins).toBe(3);
    });

    it('should be case insensitive for names', () => {
      Leaderboard.recordWin('Charlie');
      Leaderboard.recordWin('CHARLIE');
      Leaderboard.recordWin('charlie');

      const entries = Leaderboard.getAll();
      expect(entries.length).toBe(1);
      expect(entries[0].wins).toBe(3);
    });

    it('should sort entries by wins descending', () => {
      Leaderboard.recordWin('Low');
      Leaderboard.recordWin('High');
      Leaderboard.recordWin('High');
      Leaderboard.recordWin('High');
      Leaderboard.recordWin('Medium');
      Leaderboard.recordWin('Medium');

      const entries = Leaderboard.getAll();
      expect(entries[0].name).toBe('High');
      expect(entries[1].name).toBe('Medium');
      expect(entries[2].name).toBe('Low');
    });

    it('should limit entries to max count', () => {
      // Add 15 unique players
      for (let i = 0; i < 15; i++) {
        Leaderboard.recordWin(`Player${i}`);
      }

      const entries = Leaderboard.getAll();
      expect(entries.length).toBe(10); // MAX_ENTRIES
    });

    it('should persist to localStorage', () => {
      Leaderboard.recordWin('Persistent');

      const stored = localStorage.getItem('detonator_leaderboard');
      expect(stored).not.toBeNull();
      const savedData = JSON.parse(stored!);
      expect(savedData[0].name).toBe('Persistent');
    });
  });

  describe('getTop', () => {
    it('should return top N entries', () => {
      for (let i = 0; i < 10; i++) {
        Leaderboard.recordWin(`Player${i}`);
      }

      const top3 = Leaderboard.getTop(3);
      expect(top3.length).toBe(3);
    });

    it('should return all entries if fewer than requested', () => {
      Leaderboard.recordWin('Only');

      const top5 = Leaderboard.getTop(5);
      expect(top5.length).toBe(1);
    });
  });

  describe('isTopPlayer', () => {
    it('should return true for top players', () => {
      Leaderboard.recordWin('First');
      Leaderboard.recordWin('First');
      Leaderboard.recordWin('First');
      Leaderboard.recordWin('Second');
      Leaderboard.recordWin('Second');
      Leaderboard.recordWin('Third');

      expect(Leaderboard.isTopPlayer('First', 3)).toBe(true);
      expect(Leaderboard.isTopPlayer('Second', 3)).toBe(true);
      expect(Leaderboard.isTopPlayer('Third', 3)).toBe(true);
    });

    it('should return false for non-top players', () => {
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5 - i; j++) {
          Leaderboard.recordWin(`Player${i}`);
        }
      }

      expect(Leaderboard.isTopPlayer('Player4', 3)).toBe(false);
    });
  });

  describe('getRank', () => {
    it('should return correct rank (1-indexed)', () => {
      Leaderboard.recordWin('Gold');
      Leaderboard.recordWin('Gold');
      Leaderboard.recordWin('Gold');
      Leaderboard.recordWin('Silver');
      Leaderboard.recordWin('Silver');
      Leaderboard.recordWin('Bronze');

      expect(Leaderboard.getRank('Gold')).toBe(1);
      expect(Leaderboard.getRank('Silver')).toBe(2);
      expect(Leaderboard.getRank('Bronze')).toBe(3);
    });

    it('should return null for unknown player', () => {
      Leaderboard.recordWin('Known');

      expect(Leaderboard.getRank('Unknown')).toBeNull();
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      Leaderboard.recordWin('ToBeCleared');
      expect(Leaderboard.getAll().length).toBe(1);

      Leaderboard.clear();
      expect(Leaderboard.getAll().length).toBe(0);
    });
  });
});
