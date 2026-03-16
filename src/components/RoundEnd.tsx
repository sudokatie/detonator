'use client';

import { useState, useEffect } from 'react';
import { PLAYER_COLORS } from '../game/constants';

interface RoundEndProps {
  winnerId: number | null;
  onNextRound: () => void;
}

export default function RoundEnd({ winnerId, onNextRound }: RoundEndProps) {
  const [countdown, setCountdown] = useState(3);
  const isDraw = winnerId === null;
  const winnerColor = winnerId !== null ? PLAYER_COLORS[winnerId] : '#555555';

  useEffect(() => {
    if (countdown <= 0) {
      onNextRound();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(c => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onNextRound]);

  // Reset countdown when component mounts (new round end)
  useEffect(() => {
    setCountdown(3);
  }, [winnerId]);

  return (
    <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
      <div className="mc-panel p-6 min-w-[280px] text-center">
        {/* Title Bar */}
        <div className="flex items-center justify-center gap-3 mb-6 pb-4 border-b border-[#2a2a2a]">
          <div className="mc-dot" />
          <h2 className="mc-header-primary text-xl tracking-wider">
            {isDraw ? 'DRAW' : 'ROUND COMPLETE'}
          </h2>
        </div>
        
        {!isDraw && (
          <div className="mb-6">
            <span className="mc-header block mb-2">VICTOR</span>
            <div
              className="inline-block px-6 py-2 text-xl font-mono tracking-wider"
              style={{ backgroundColor: winnerColor, color: '#0a0a0a' }}
            >
              PLAYER {winnerId! + 1}
            </div>
          </div>
        )}

        <div className="mb-4">
          <span className="mc-header block mb-2">NEXT ROUND IN</span>
          <div className="text-5xl font-mono text-[#dc2626]">
            {countdown}
          </div>
        </div>
        
        <div className="mc-progress mt-4">
          <div 
            className="mc-progress-fill transition-all duration-1000"
            style={{ width: `${((3 - countdown) / 3) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
