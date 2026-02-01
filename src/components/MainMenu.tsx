'use client';

import { useState } from 'react';

interface MainMenuProps {
  onStart: (playerCount: number) => void;
}

export default function MainMenu({ onStart }: MainMenuProps) {
  const [playerCount, setPlayerCount] = useState(2);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-6xl font-bold mb-8 text-orange-500">DETONATOR</h1>
      
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
        <div className="mb-6">
          <label className="block text-lg mb-2">Number of Players</label>
          <div className="flex gap-2">
            {[2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => setPlayerCount(count)}
                className={`px-6 py-3 rounded font-bold transition-colors ${
                  playerCount === count
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {count}P
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3">Controls</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-green-400 font-bold mb-1">Player 1</div>
              <div>Move: WASD</div>
              <div>Bomb: Space</div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-red-400 font-bold mb-1">Player 2</div>
              <div>Move: Arrow Keys</div>
              <div>Bomb: Enter</div>
            </div>
            {playerCount >= 3 && (
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-blue-400 font-bold mb-1">Player 3</div>
                <div>Move: IJKL</div>
                <div>Bomb: B</div>
              </div>
            )}
            {playerCount >= 4 && (
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-yellow-400 font-bold mb-1">Player 4</div>
                <div>Move: Numpad 8456</div>
                <div>Bomb: Numpad 0</div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => onStart(playerCount)}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white text-xl font-bold rounded transition-colors"
        >
          START GAME
        </button>

        <p className="mt-4 text-center text-gray-400 text-sm">
          Press ESC to pause during game
        </p>
      </div>
    </div>
  );
}
