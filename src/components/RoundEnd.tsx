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
  const winnerColor = winnerId !== null ? PLAYER_COLORS[winnerId] : '#888888';

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
    <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          {isDraw ? 'DRAW!' : 'ROUND OVER!'}
        </h2>
        
        {!isDraw && (
          <div className="mb-6">
            <div
              className="inline-block px-6 py-3 rounded text-2xl font-bold"
              style={{ backgroundColor: winnerColor }}
            >
              Player {winnerId! + 1} Wins!
            </div>
          </div>
        )}

        <div className="text-6xl font-bold text-orange-500 mb-4">
          {countdown}
        </div>
        <p className="text-gray-400">Next round starting...</p>
      </div>
    </div>
  );
}
