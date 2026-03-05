/**
 * Achievement system for Detonator (Bomberman clone)
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'skill' | 'exploration' | 'mastery' | 'daily';
}

export interface AchievementProgress {
  unlockedAt: number;
}

export type AchievementStore = Record<string, AchievementProgress>;

export const ACHIEVEMENTS: Achievement[] = [
  // Skill
  { id: 'first_bomb', name: 'Bomber', description: 'Place your first bomb', icon: '💣', category: 'skill' },
  { id: 'first_kill', name: 'Gotcha', description: 'Defeat an enemy', icon: '💥', category: 'skill' },
  { id: 'chain_reaction', name: 'Chain Reaction', description: 'Trigger a chain of 3+ bombs', icon: '🔥', category: 'skill' },
  { id: 'narrow_escape', name: 'Narrow Escape', description: 'Survive a bomb within 1 tile', icon: '😰', category: 'skill' },
  { id: 'power_collect', name: 'Power Up', description: 'Collect your first power-up', icon: '⭐', category: 'skill' },
  { id: 'multi_kill', name: 'Multi Kill', description: 'Defeat 2+ enemies with one bomb', icon: '💀', category: 'skill' },

  // Exploration
  { id: 'max_bombs', name: 'Arsenal', description: 'Have 5+ bombs available', icon: '🎒', category: 'exploration' },
  { id: 'max_range', name: 'Long Range', description: 'Have 5+ bomb range', icon: '📡', category: 'exploration' },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Collect 3+ speed power-ups', icon: '⚡', category: 'exploration' },

  // Mastery
  { id: 'level_5', name: 'Veteran', description: 'Reach level 5', icon: '🎖️', category: 'mastery' },
  { id: 'level_10', name: 'Master Bomber', description: 'Reach level 10', icon: '👑', category: 'mastery' },
  { id: 'perfect_level', name: 'Untouchable', description: 'Complete a level without taking damage', icon: '🛡️', category: 'mastery' },
  { id: 'speed_run', name: 'Speed Runner', description: 'Complete a level in under 30 seconds', icon: '⏱️', category: 'mastery' },
  { id: 'pacifist', name: 'Pacifist', description: 'Complete a level using only 3 bombs', icon: '☮️', category: 'mastery' },
  { id: 'score_10000', name: 'High Scorer', description: 'Score 10,000 points', icon: '🏆', category: 'mastery' },

  // Daily
  { id: 'daily_complete', name: 'Daily Bomber', description: 'Complete a daily challenge', icon: '📅', category: 'daily' },
  { id: 'daily_top_10', name: 'Daily Contender', description: 'Top 10 in daily challenge', icon: '🔟', category: 'daily' },
  { id: 'daily_top_3', name: 'Daily Champion', description: 'Top 3 in daily challenge', icon: '🥉', category: 'daily' },
  { id: 'daily_first', name: 'Daily Legend', description: 'First place in daily challenge', icon: '🥇', category: 'daily' },
  { id: 'daily_streak_3', name: 'Consistent', description: '3-day daily streak', icon: '🔥', category: 'daily' },
  { id: 'daily_streak_7', name: 'Dedicated', description: '7-day daily streak', icon: '💪', category: 'daily' },
];

const STORAGE_KEY = 'detonator_achievements';
const STREAK_KEY = 'detonator_daily_streak';

export class AchievementManager {
  private store: AchievementStore;
  private dailyStreak: { lastDate: string; count: number };

  constructor() {
    this.store = this.load();
    this.dailyStreak = this.loadStreak();
  }

  private load(): AchievementStore {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store));
    } catch {}
  }

  private loadStreak(): { lastDate: string; count: number } {
    try {
      return JSON.parse(localStorage.getItem(STREAK_KEY) || '{"lastDate":"","count":0}');
    } catch {
      return { lastDate: '', count: 0 };
    }
  }

  private saveStreak(): void {
    try {
      localStorage.setItem(STREAK_KEY, JSON.stringify(this.dailyStreak));
    } catch {}
  }

  isUnlocked(id: string): boolean { return id in this.store; }
  getProgress(): AchievementStore { return { ...this.store }; }
  getUnlockedCount(): number { return Object.keys(this.store).length; }
  getTotalCount(): number { return ACHIEVEMENTS.length; }
  getAchievement(id: string): Achievement | undefined { return ACHIEVEMENTS.find((a) => a.id === id); }
  getAllAchievements(): Achievement[] { return ACHIEVEMENTS; }

  unlock(id: string): Achievement | null {
    if (this.isUnlocked(id)) return null;
    const a = this.getAchievement(id);
    if (!a) return null;
    this.store[id] = { unlockedAt: Date.now() };
    this.save();
    return a;
  }

  checkAndUnlock(ids: string[]): Achievement[] {
    return ids.map((id) => this.unlock(id)).filter((a): a is Achievement => a !== null);
  }

  recordDailyCompletion(rank: number): Achievement[] {
    const unlocked: Achievement[] = [];
    const daily = this.unlock('daily_complete');
    if (daily) unlocked.push(daily);
    if (rank <= 10) { const a = this.unlock('daily_top_10'); if (a) unlocked.push(a); }
    if (rank <= 3) { const a = this.unlock('daily_top_3'); if (a) unlocked.push(a); }
    if (rank === 1) { const a = this.unlock('daily_first'); if (a) unlocked.push(a); }

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (this.dailyStreak.lastDate === yesterday) this.dailyStreak.count++;
    else if (this.dailyStreak.lastDate !== today) this.dailyStreak.count = 1;
    this.dailyStreak.lastDate = today;
    this.saveStreak();

    if (this.dailyStreak.count >= 3) { const a = this.unlock('daily_streak_3'); if (a) unlocked.push(a); }
    if (this.dailyStreak.count >= 7) { const a = this.unlock('daily_streak_7'); if (a) unlocked.push(a); }
    return unlocked;
  }

  reset(): void {
    this.store = {};
    this.dailyStreak = { lastDate: '', count: 0 };
    this.save();
    this.saveStreak();
  }
}

let instance: AchievementManager | null = null;
export function getAchievementManager(): AchievementManager {
  if (!instance) instance = new AchievementManager();
  return instance;
}
