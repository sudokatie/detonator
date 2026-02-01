'use client';

import { PLAYER_COLORS } from '../game/constants';

interface RoundEndProps {
  winnerId: number | null;
  onNextRound: () => void;
}

export default function RoundEnd({ winnerId, onNextRound }: RoundEndProps) {
  const isDraw = winnerId === null;
  const winnerColor = winnerId !== null ? PLAYER_COLORS[winnerId] : '#888888';

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

        <button
          onClick={onNextRound}
          className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xl font-bold rounded transition-colors"
        >
          Next Round
        </button>
      </div>
    </div>
  );
}
