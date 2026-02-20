'use client';

import { useState, useEffect } from 'react';
import { Music } from '../game/Music';
import { Sound } from '../game/Sound';

interface PauseMenuProps {
  onResume: () => void;
  onQuit: () => void;
}

export default function PauseMenu({ onResume, onQuit }: PauseMenuProps) {
  const [musicVolume, setMusicVolume] = useState(Music.getVolume());
  const [soundVolume, setSoundVolume] = useState(Sound.getVolume());
  const [musicEnabled, setMusicEnabled] = useState(Music.isEnabled());
  const [soundEnabled, setSoundEnabled] = useState(Sound.isEnabled());

  useEffect(() => {
    Music.setVolume(musicVolume);
  }, [musicVolume]);

  useEffect(() => {
    Sound.setVolume(soundVolume);
  }, [soundVolume]);

  const handleMusicToggle = () => {
    const newEnabled = !musicEnabled;
    setMusicEnabled(newEnabled);
    Music.setEnabled(newEnabled);
  };

  const handleSoundToggle = () => {
    const newEnabled = !soundEnabled;
    setSoundEnabled(newEnabled);
    Sound.setEnabled(newEnabled);
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center min-w-[320px]">
        <h2 className="text-4xl font-bold text-white mb-6">PAUSED</h2>
        
        {/* Audio Controls */}
        <div className="mb-6 text-left">
          <h3 className="text-lg font-bold text-gray-300 mb-3">Audio Settings</h3>
          
          {/* Music Volume */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={handleMusicToggle}
              className={`w-8 h-8 rounded flex items-center justify-center text-lg ${
                musicEnabled ? 'bg-green-600' : 'bg-gray-600'
              }`}
              title={musicEnabled ? 'Mute Music' : 'Enable Music'}
            >
              {musicEnabled ? '♪' : '✕'}
            </button>
            <span className="text-gray-300 w-16">Music</span>
            <input
              type="range"
              min="0"
              max="100"
              value={musicVolume * 100}
              onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
              disabled={!musicEnabled}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
            <span className="text-gray-400 w-10 text-right">{Math.round(musicVolume * 100)}%</span>
          </div>
          
          {/* Sound Volume */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSoundToggle}
              className={`w-8 h-8 rounded flex items-center justify-center text-lg ${
                soundEnabled ? 'bg-green-600' : 'bg-gray-600'
              }`}
              title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            >
              {soundEnabled ? '🔊' : '✕'}
            </button>
            <span className="text-gray-300 w-16">Sound</span>
            <input
              type="range"
              min="0"
              max="100"
              value={soundVolume * 100}
              onChange={(e) => setSoundVolume(Number(e.target.value) / 100)}
              disabled={!soundEnabled}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
            <span className="text-gray-400 w-10 text-right">{Math.round(soundVolume * 100)}%</span>
          </div>
        </div>

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
