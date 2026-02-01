'use client';

interface PauseMenuProps {
  onResume: () => void;
  onQuit: () => void;
}

export default function PauseMenu({ onResume, onQuit }: PauseMenuProps) {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center">
        <h2 className="text-4xl font-bold text-white mb-6">PAUSED</h2>
        
        <div className="flex flex-col gap-4">
          <button
            onClick={onResume}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white text-xl font-bold rounded transition-colors"
          >
            Resume
          </button>
          <button
            onClick={onQuit}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white text-xl font-bold rounded transition-colors"
          >
            Quit to Menu
          </button>
        </div>

        <p className="mt-4 text-gray-400">Press ESC to resume</p>
      </div>
    </div>
  );
}
