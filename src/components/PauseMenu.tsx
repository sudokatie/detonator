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
    <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
      <div className="mc-panel p-6 min-w-[320px]">
        {/* Title Bar */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2a2a2a]">
          <div className="mc-dot" />
          <h2 className="mc-header-primary text-xl tracking-wider">MISSION PAUSED</h2>
        </div>
        
        {/* Audio Controls */}
        <div className="mb-6">
          <span className="mc-header block mb-3">AUDIO SYSTEMS</span>
          
          {/* Music Volume */}
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={handleMusicToggle}
              className={`w-8 h-8 flex items-center justify-center text-xs font-mono border transition-colors ${
                musicEnabled 
                  ? 'bg-[#dc2626] border-[#dc2626] text-white' 
                  : 'bg-transparent border-[#2a2a2a] text-[#555555]'
              }`}
            >
              {musicEnabled ? 'ON' : 'OFF'}
            </button>
            <span className="text-[#888888] text-xs tracking-wider w-14">MUSIC</span>
            <input
              type="range"
              min="0"
              max="100"
              value={musicVolume * 100}
              onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
              disabled={!musicEnabled}
              className="flex-1 h-1 bg-[#2a2a2a] appearance-none cursor-pointer disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#dc2626]"
            />
            <span className="text-[#555555] font-mono text-xs w-10 text-right">{Math.round(musicVolume * 100)}%</span>
          </div>
          
          {/* Sound Volume */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSoundToggle}
              className={`w-8 h-8 flex items-center justify-center text-xs font-mono border transition-colors ${
                soundEnabled 
                  ? 'bg-[#dc2626] border-[#dc2626] text-white' 
                  : 'bg-transparent border-[#2a2a2a] text-[#555555]'
              }`}
            >
              {soundEnabled ? 'ON' : 'OFF'}
            </button>
            <span className="text-[#888888] text-xs tracking-wider w-14">SFX</span>
            <input
              type="range"
              min="0"
              max="100"
              value={soundVolume * 100}
              onChange={(e) => setSoundVolume(Number(e.target.value) / 100)}
              disabled={!soundEnabled}
              className="flex-1 h-1 bg-[#2a2a2a] appearance-none cursor-pointer disabled:opacity-50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#dc2626]"
            />
            <span className="text-[#555555] font-mono text-xs w-10 text-right">{Math.round(soundVolume * 100)}%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm tracking-widest font-medium transition-colors border border-[#dc2626]"
          >
            RESUME MISSION
          </button>
          <button
            onClick={onQuit}
            className="w-full py-3 bg-transparent border border-[#2a2a2a] text-[#888888] text-sm tracking-widest font-medium transition-colors hover:text-white hover:border-[#dc2626]"
          >
            ABORT MISSION
          </button>
        </div>

        <p className="mt-4 text-[#555555] text-xs text-center font-mono">ESC TO RESUME</p>
      </div>
    </div>
  );
}
