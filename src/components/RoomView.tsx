'use client';

import { useState } from 'react';
import type { RoomState, RoomPlayer } from '../game/Multiplayer';

interface RoomViewProps {
  room: RoomState;
  playerId: string | null;
  isHost: boolean;
  onReady: () => void;
  onStart: () => void;
  onLeave: () => void;
}

const PLAYER_COLORS = ['text-green-400', 'text-red-400', 'text-blue-400', 'text-yellow-400'];

export default function RoomView({
  room,
  playerId,
  isHost,
  onReady,
  onStart,
  onLeave,
}: RoomViewProps) {
  const [copied, setCopied] = useState(false);

  const myPlayer = room.players.find((p) => p.id === playerId);
  const readyCount = room.players.filter((p) => p.ready).length;
  const canStart = isHost && readyCount >= 2 && room.players.length >= 2;

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-2 text-orange-500">DETONATOR</h1>

      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-[480px]">
        {/* Room Code */}
        <div className="text-center mb-6">
          <div className="text-sm text-gray-400 mb-1">Room Code</div>
          <button
            onClick={copyRoomCode}
            className="text-4xl font-mono font-bold tracking-widest bg-gray-700 px-6 py-3 rounded hover:bg-gray-600 transition-colors"
            title="Click to copy"
          >
            {room.code}
          </button>
          {copied && (
            <div className="text-green-400 text-sm mt-2">Copied to clipboard!</div>
          )}
          <div className="text-gray-500 text-sm mt-2">Share this code with friends</div>
        </div>

        {/* Player Slots */}
        <div className="mb-6">
          <div className="text-sm text-gray-400 mb-3">
            Players ({room.players.length}/4)
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((slot) => {
              const player = room.players.find((p) => p.slot === slot);
              const isMe = player?.id === playerId;
              const isHostPlayer = player?.id === room.hostId;

              return (
                <div
                  key={slot}
                  className={`p-4 rounded border-2 ${
                    player
                      ? isMe
                        ? 'bg-gray-700 border-orange-500'
                        : 'bg-gray-700 border-gray-600'
                      : 'bg-gray-800 border-dashed border-gray-700'
                  }`}
                >
                  {player ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`font-bold ${PLAYER_COLORS[slot]}`}>
                          P{slot + 1}
                        </span>
                        {isHostPlayer && (
                          <span className="text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded">
                            HOST
                          </span>
                        )}
                        {isMe && (
                          <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-white truncate">{player.name}</div>
                      <div className="flex items-center gap-1 mt-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            player.ready ? 'bg-green-500' : 'bg-gray-500'
                          }`}
                        />
                        <span className={`text-sm ${player.ready ? 'text-green-400' : 'text-gray-500'}`}>
                          {player.ready ? 'Ready' : 'Not Ready'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-600 text-center py-2">
                      <span className={PLAYER_COLORS[slot]}>P{slot + 1}</span>
                      <div className="text-sm">Waiting...</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {!myPlayer?.ready ? (
            <button
              onClick={onReady}
              className="w-full py-4 bg-green-500 hover:bg-green-600 text-white text-lg font-bold rounded transition-colors"
            >
              Ready Up
            </button>
          ) : (
            <button
              onClick={onReady}
              className="w-full py-4 bg-gray-600 hover:bg-gray-500 text-white text-lg font-bold rounded transition-colors"
            >
              Cancel Ready
            </button>
          )}

          {isHost && (
            <button
              onClick={onStart}
              disabled={!canStart}
              className={`w-full py-4 text-white text-lg font-bold rounded transition-colors ${
                canStart
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-gray-700 cursor-not-allowed'
              }`}
            >
              {canStart ? 'Start Game' : `Waiting for players (${readyCount}/2 ready)`}
            </button>
          )}

          <button
            onClick={onLeave}
            className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
