'use client';

import { useState } from 'react';
import { todayString } from '@/game/Daily';

interface MainMenuProps {
  onStart: (playerCount: number, roundsToWin: number) => void;
  onStartDaily?: () => void;
  onWatchReplay?: () => void;
}

export default function MainMenu({ onStart, onStartDaily, onWatchReplay }: MainMenuProps) {
  const [playerCount, setPlayerCount] = useState(2);
  const [roundsToWin, setRoundsToWin] = useState(3);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-4">
      {/* Header */}
      <div className="w-full max-w-lg mb-4">
        <div className="flex items-center justify-between">
          <a href="/games/" className="mc-link">&lt; BACK TO HUB</a>
          <span className="mc-header">MISSION BRIEFING</span>
        </div>
      </div>

      {/* Main Panel */}
      <div className="mc-panel p-6 w-full max-w-lg">
        {/* Title Bar */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2a2a2a]">
          <div className="mc-dot" />
          <h1 className="mc-header-primary text-2xl tracking-wider">DETONATOR</h1>
        </div>

        {/* Player Count */}
        <div className="mb-6">
          <span className="mc-header block mb-3">OPERATIVES</span>
          <div className="flex gap-2">
            {[2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => setPlayerCount(count)}
                className={`px-5 py-2 font-mono text-sm tracking-wide transition-colors border ${
                  playerCount === count
                    ? 'bg-[#dc2626] border-[#dc2626] text-white'
                    : 'bg-transparent border-[#2a2a2a] text-[#888888] hover:border-[#dc2626] hover:text-white'
                }`}
              >
                {count}P
              </button>
            ))}
          </div>
        </div>

        {/* Rounds */}
        <div className="mb-6">
          <span className="mc-header block mb-3">ROUNDS TO WIN</span>
          <div className="flex gap-2">
            {[1, 3, 5].map((count) => (
              <button
                key={count}
                onClick={() => setRoundsToWin(count)}
                className={`px-5 py-2 font-mono text-sm tracking-wide transition-colors border ${
                  roundsToWin === count
                    ? 'bg-[#dc2626] border-[#dc2626] text-white'
                    : 'bg-transparent border-[#2a2a2a] text-[#888888] hover:border-[#dc2626] hover:text-white'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Controls Info */}
        <div className="mb-6">
          <span className="mc-header block mb-3">CONTROL ASSIGNMENTS</span>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0d0d0d] border border-[#2a2a2a] p-3">
              <div className="text-[#22c55e] text-xs tracking-wider mb-2">PLAYER 1</div>
              <div className="text-[#555555] text-xs font-mono">MOVE: WASD</div>
              <div className="text-[#555555] text-xs font-mono">BOMB: SPACE</div>
            </div>
            <div className="bg-[#0d0d0d] border border-[#2a2a2a] p-3">
              <div className="text-[#dc2626] text-xs tracking-wider mb-2">PLAYER 2</div>
              <div className="text-[#555555] text-xs font-mono">MOVE: ARROWS</div>
              <div className="text-[#555555] text-xs font-mono">BOMB: ENTER</div>
            </div>
            {playerCount >= 3 && (
              <div className="bg-[#0d0d0d] border border-[#2a2a2a] p-3">
                <div className="text-[#3b82f6] text-xs tracking-wider mb-2">PLAYER 3</div>
                <div className="text-[#555555] text-xs font-mono">MOVE: IJKL</div>
                <div className="text-[#555555] text-xs font-mono">BOMB: B</div>
              </div>
            )}
            {playerCount >= 4 && (
              <div className="bg-[#0d0d0d] border border-[#2a2a2a] p-3">
                <div className="text-[#eab308] text-xs tracking-wider mb-2">PLAYER 4</div>
                <div className="text-[#555555] text-xs font-mono">MOVE: NUM 8456</div>
                <div className="text-[#555555] text-xs font-mono">BOMB: NUM 0</div>
              </div>
            )}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={() => onStart(playerCount, roundsToWin)}
          className="w-full py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm tracking-widest font-medium transition-colors border border-[#dc2626]"
        >
          INITIATE MISSION
        </button>

        {/* Daily Challenge */}
        {onStartDaily && (
          <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
            <button
              onClick={onStartDaily}
              className="w-full py-3 bg-transparent border border-[#2a2a2a] text-white text-sm tracking-widest font-medium transition-colors hover:border-[#dc2626]"
            >
              DAILY CHALLENGE
            </button>
            <p className="text-[#555555] text-xs text-center mt-2 font-mono">{todayString()}</p>
          </div>
        )}

        {/* Watch Replay */}
        {onWatchReplay && (
          <button
            onClick={onWatchReplay}
            className="w-full mt-3 py-2 bg-transparent border border-[#2a2a2a] text-[#888888] text-xs tracking-wider transition-colors hover:text-white hover:border-[#3a3a3a]"
          >
            WATCH REPLAY
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="w-full max-w-lg mt-4">
        <div className="flex items-center justify-center gap-2">
          <span className="mc-header text-[10px]">SYSTEM:</span>
          <span className="text-[#555555] text-xs font-mono">ESC to pause during mission</span>
        </div>
      </div>
    </div>
  );
}
