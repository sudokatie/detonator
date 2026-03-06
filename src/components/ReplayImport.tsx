'use client';

import { useState } from 'react';
import { Replay, ReplayData } from '../game/Replay';

interface ReplayImportProps {
  onImport: (data: ReplayData) => void;
  onClose: () => void;
}

export function ReplayImport({ onImport, onClose }: ReplayImportProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Please paste a replay code');
      return;
    }

    const data = Replay.decode(trimmed);
    if (!data) {
      setError('Invalid replay code');
      return;
    }

    onImport(data);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-orange-500 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-orange-400 mb-4">Watch Replay</h2>

        <p className="text-orange-300 mb-4">
          Paste a replay code to watch a match:
        </p>

        <textarea
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          placeholder="Paste replay code here..."
          className="w-full h-32 bg-gray-800 border border-orange-600 rounded px-3 py-2 text-orange-300 text-sm mb-2 resize-none"
        />

        {error && (
          <p className="text-red-400 text-sm mb-2">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleImport}
            className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded"
          >
            Watch
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
