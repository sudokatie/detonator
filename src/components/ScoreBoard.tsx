'use client';

import { PlayerStats } from '../game/types';
import { PLAYER_COLORS } from '../game/constants';

interface ScoreBoardProps {
  players: PlayerStats[];
  round: number;
  maxRounds: number;
}

export default function ScoreBoard({ players, round, maxRounds }: ScoreBoardProps) {
  return (
    <div className="flex justify-between items-center w-full max-w-2xl mx-auto mb-4 px-4">
      <div className="text-white text-lg font-bold">
        Round {round}/{maxRounds}
      </div>
      
      <div className="flex gap-6">
        {players.map((stats, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 px-3 py-1 rounded ${
              stats.alive ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <div
              className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: PLAYER_COLORS[index] }}
            />
            <span className="text-white font-medium">
              P{index + 1}
            </span>
            <span className="text-gray-300 text-sm">
              {stats.wins}W
            </span>
            <div className="flex gap-1 text-xs text-gray-400">
              <span title="Bombs">B:{stats.bombs}</span>
              <span title="Fire">F:{stats.fire}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
