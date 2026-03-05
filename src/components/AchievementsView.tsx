'use client';

import {
  Achievement,
  AchievementStore,
  getAchievementManager,
} from '../game/Achievements';
import { useEffect, useState } from 'react';

interface AchievementsViewProps {
  onClose: () => void;
}

export default function AchievementsView({ onClose }: AchievementsViewProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<AchievementStore>({});
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const manager = getAchievementManager();
    setAchievements(manager.getAllAchievements());
    setProgress(manager.getProgress());
  }, []);

  const categories = ['all', 'skill', 'exploration', 'mastery', 'daily'];

  const filteredAchievements = achievements.filter(
    (a) => filter === 'all' || a.category === filter
  );

  const unlockedCount = Object.keys(progress).length;
  const totalCount = achievements.length;
  const percentage = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Achievements</h2>
            <p className="text-gray-400">
              {unlockedCount} / {totalCount} ({percentage}%)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-4 py-2 bg-gray-800">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Category filter */}
        <div className="px-4 py-2 flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`
                px-3 py-1 rounded-full text-sm capitalize
                ${filter === cat ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Achievement list */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid gap-3">
            {filteredAchievements.map((achievement) => {
              const isUnlocked = achievement.id in progress;
              const unlockedAt = progress[achievement.id]?.unlockedAt;

              return (
                <div
                  key={achievement.id}
                  className={`
                    flex items-center gap-4 p-3 rounded-lg
                    ${isUnlocked ? 'bg-gray-800' : 'bg-gray-800/50 opacity-60'}
                  `}
                >
                  <div
                    className={`
                    text-3xl w-12 h-12 flex items-center justify-center
                    rounded-full
                    ${isUnlocked ? 'bg-yellow-600/20' : 'bg-gray-700'}
                  `}
                  >
                    {isUnlocked ? achievement.icon : '🔒'}
                  </div>
                  <div className="flex-1">
                    <div
                      className={`font-bold ${isUnlocked ? 'text-white' : 'text-gray-400'}`}
                    >
                      {achievement.name}
                    </div>
                    <div className="text-sm text-gray-400">
                      {achievement.description}
                    </div>
                    {isUnlocked && unlockedAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        Unlocked {new Date(unlockedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  {isUnlocked && (
                    <div className="text-green-500 text-xl">✓</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
