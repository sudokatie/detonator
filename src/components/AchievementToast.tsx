'use client';

import { Achievement } from '../game/Achievements';
import { useEffect, useState } from 'react';

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
}

export default function AchievementToast({
  achievement,
  onDismiss,
}: AchievementToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Fade in
    setTimeout(() => setVisible(true), 50);

    // Start exit after 3 seconds
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, 3000);

    // Remove after animation
    const removeTimer = setTimeout(() => {
      onDismiss();
    }, 3500);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [onDismiss]);

  return (
    <div
      className={`
        fixed top-4 right-4 z-50
        bg-gradient-to-r from-yellow-600 to-amber-500
        text-white rounded-lg shadow-lg
        px-4 py-3 min-w-64
        transform transition-all duration-500
        ${visible && !exiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{achievement.icon}</span>
        <div>
          <div className="text-xs uppercase tracking-wide opacity-80">
            Achievement Unlocked!
          </div>
          <div className="font-bold">{achievement.name}</div>
          <div className="text-sm opacity-90">{achievement.description}</div>
        </div>
      </div>
    </div>
  );
}
