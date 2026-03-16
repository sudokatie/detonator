'use client';

import { PLAYER_COLORS } from '../game/constants';

interface GameOverProps {
  winnerId: number | null;
  roundsToWin: number;
  onPlayAgain: () => void;
  onMainMenu: () => void;
  hasReplay?: boolean;
  onShareReplay?: () => void;
}

export default function GameOver({ winnerId, roundsToWin, onPlayAgain, onMainMenu, hasReplay, onShareReplay }: GameOverProps) {
  const winnerColor = winnerId !== null ? PLAYER_COLORS[winnerId] : '#555555';

  return (
    <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
      <div className="mc-panel p-6 min-w-[320px] text-center">
        {/* Title Bar */}
        <div className="flex items-center justify-center gap-3 mb-6 pb-4 border-b border-[#2a2a2a]">
          <div className="mc-dot" />
          <h2 className="mc-header-primary text-2xl tracking-wider">MISSION COMPLETE</h2>
        </div>
        
        {winnerId !== null && (
          <div className="mb-6">
            <span className="mc-header block mb-3">MATCH WINNER</span>
            <div
              className="inline-block px-8 py-3 text-2xl font-mono tracking-wider mb-2"
              style={{ backgroundColor: winnerColor, color: '#0a0a0a' }}
            >
              PLAYER {winnerId + 1}
            </div>
            <div className="text-[#888888] text-sm tracking-wider mt-2">
              {roundsToWin} ROUND{roundsToWin > 1 ? 'S' : ''} WON
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={onPlayAgain}
            className="w-full py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm tracking-widest font-medium transition-colors border border-[#dc2626]"
          >
            REMATCH
          </button>
          {hasReplay && onShareReplay && (
            <button
              onClick={onShareReplay}
              className="w-full py-2 bg-transparent border border-[#2a2a2a] text-white text-sm tracking-widest font-medium transition-colors hover:border-[#dc2626]"
            >
              SHARE REPLAY
            </button>
          )}
          <button
            onClick={onMainMenu}
            className="w-full py-3 bg-transparent border border-[#2a2a2a] text-[#888888] text-sm tracking-widest font-medium transition-colors hover:text-white hover:border-[#3a3a3a]"
          >
            RETURN TO BASE
          </button>
        </div>
      </div>
    </div>
  );
}
