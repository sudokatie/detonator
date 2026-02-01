'use client';

import { PLAYER_COLORS, ROUNDS_TO_WIN } from '../game/constants';

interface GameOverProps {
  winnerId: number | null;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export default function GameOver({ winnerId, onPlayAgain, onMainMenu }: GameOverProps) {
  const winnerColor = winnerId !== null ? PLAYER_COLORS[winnerId] : '#888888';

  return (
    <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
      <div className="bg-gray-800 p-10 rounded-lg shadow-xl text-center">
        <h2 className="text-5xl font-bold text-orange-500 mb-6">GAME OVER</h2>
        
        {winnerId !== null && (
          <div className="mb-8">
            <div
              className="inline-block px-8 py-4 rounded text-3xl font-bold mb-2"
              style={{ backgroundColor: winnerColor }}
            >
              Player {winnerId + 1}
            </div>
            <div className="text-2xl text-white">
              Wins the Match! ({ROUNDS_TO_WIN} rounds)
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <button
            onClick={onPlayAgain}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white text-xl font-bold rounded transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={onMainMenu}
            className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white text-xl font-bold rounded transition-colors"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
