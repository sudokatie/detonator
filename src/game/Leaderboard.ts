/**
 * Leaderboard - Persistent high score storage using localStorage
 */

export interface LeaderboardEntry {
  name: string;
  wins: number;
  lastPlayed: string; // ISO date string
}

const STORAGE_KEY = 'detonator_leaderboard';
const MAX_ENTRIES = 10;

export class Leaderboard {
  private static entries: LeaderboardEntry[] | null = null;

  /**
   * Load leaderboard from localStorage
   */
  static load(): LeaderboardEntry[] {
    if (this.entries !== null) {
      return this.entries;
    }

    if (typeof window === 'undefined') {
      this.entries = [];
      return this.entries;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.entries = JSON.parse(stored);
      } else {
        this.entries = [];
      }
    } catch {
      this.entries = [];
    }

    return this.entries;
  }

  /**
   * Save leaderboard to localStorage
   */
  private static save(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch {
      // localStorage may be full or unavailable
    }
  }

  /**
   * Record a match win
   */
  static recordWin(playerName: string): void {
    const entries = this.load();
    const now = new Date().toISOString();

    // Find existing entry for this player
    const existing = entries.find(
      e => e.name.toLowerCase() === playerName.toLowerCase()
    );

    if (existing) {
      existing.wins += 1;
      existing.lastPlayed = now;
    } else {
      entries.push({
        name: playerName,
        wins: 1,
        lastPlayed: now,
      });
    }

    // Sort by wins (descending), then by lastPlayed (descending)
    entries.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime();
    });

    // Keep only top entries
    this.entries = entries.slice(0, MAX_ENTRIES);
    this.save();
  }

  /**
   * Get top entries
   */
  static getTop(count: number = 5): LeaderboardEntry[] {
    return this.load().slice(0, count);
  }

  /**
   * Get all entries
   */
  static getAll(): LeaderboardEntry[] {
    return [...this.load()];
  }

  /**
   * Check if a player is in the top N
   */
  static isTopPlayer(playerName: string, topN: number = 3): boolean {
    const top = this.getTop(topN);
    return top.some(e => e.name.toLowerCase() === playerName.toLowerCase());
  }

  /**
   * Get rank for a player (1-indexed, null if not found)
   */
  static getRank(playerName: string): number | null {
    const entries = this.load();
    const index = entries.findIndex(
      e => e.name.toLowerCase() === playerName.toLowerCase()
    );
    return index >= 0 ? index + 1 : null;
  }

  /**
   * Clear all leaderboard data
   */
  static clear(): void {
    this.entries = [];
    this.save();
  }

  /**
   * Reset cached entries (for testing)
   */
  static resetCache(): void {
    this.entries = null;
  }
}
