'use client';

import { useState } from 'react';

interface LobbyMenuProps {
  onCreateRoom: (name: string) => void;
  onJoinRoom: (name: string, roomCode: string) => void;
  onBack: () => void;
  connectionState: 'disconnected' | 'connecting' | 'connected';
  error: string | null;
}

export default function LobbyMenu({
  onCreateRoom,
  onJoinRoom,
  onBack,
  connectionState,
  error,
}: LobbyMenuProps) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');

  const isConnecting = connectionState === 'connecting';
  const isDisconnected = connectionState === 'disconnected';

  const handleCreate = () => {
    if (name.trim().length >= 2) {
      onCreateRoom(name.trim());
    }
  };

  const handleJoin = () => {
    if (name.trim().length >= 2 && roomCode.trim().length === 4) {
      onJoinRoom(name.trim(), roomCode.trim().toUpperCase());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-6xl font-bold mb-4 text-orange-500">DETONATOR</h1>
      <h2 className="text-2xl mb-8 text-gray-400">Online Multiplayer</h2>

      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-96">
        {/* Connection Status */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div
            className={`w-3 h-3 rounded-full ${
              connectionState === 'connected'
                ? 'bg-green-500'
                : connectionState === 'connecting'
                ? 'bg-yellow-500 animate-pulse'
                : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-gray-400">
            {connectionState === 'connected'
              ? 'Connected'
              : connectionState === 'connecting'
              ? 'Connecting...'
              : 'Disconnected'}
          </span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Name Input (always visible) */}
        <div className="mb-6">
          <label className="block text-sm mb-2 text-gray-400">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 16))}
            placeholder="Enter name (2-16 chars)"
            className="w-full px-4 py-3 bg-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            maxLength={16}
          />
        </div>

        {/* Mode Selection */}
        {mode === 'select' && (
          <>
            <button
              onClick={() => setMode('create')}
              disabled={isDisconnected || name.trim().length < 2}
              className="w-full py-4 mb-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-lg font-bold rounded transition-colors"
            >
              Create Room
            </button>
            <button
              onClick={() => setMode('join')}
              disabled={isDisconnected || name.trim().length < 2}
              className="w-full py-4 mb-6 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-lg font-bold rounded transition-colors"
            >
              Join Room
            </button>
          </>
        )}

        {/* Create Room */}
        {mode === 'create' && (
          <>
            <button
              onClick={handleCreate}
              disabled={isConnecting || isDisconnected || name.trim().length < 2}
              className="w-full py-4 mb-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-lg font-bold rounded transition-colors"
            >
              {isConnecting ? 'Creating...' : 'Create Room'}
            </button>
            <button
              onClick={() => setMode('select')}
              className="w-full py-3 mb-6 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Back
            </button>
          </>
        )}

        {/* Join Room */}
        {mode === 'join' && (
          <>
            <div className="mb-4">
              <label className="block text-sm mb-2 text-gray-400">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="XXXX"
                className="w-full px-4 py-3 bg-gray-700 rounded text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={4}
              />
            </div>
            <button
              onClick={handleJoin}
              disabled={isConnecting || isDisconnected || name.trim().length < 2 || roomCode.length !== 4}
              className="w-full py-4 mb-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-lg font-bold rounded transition-colors"
            >
              {isConnecting ? 'Joining...' : 'Join Room'}
            </button>
            <button
              onClick={() => setMode('select')}
              className="w-full py-3 mb-6 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Back
            </button>
          </>
        )}

        <button
          onClick={onBack}
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
        >
          Back to Main Menu
        </button>
      </div>
    </div>
  );
}
