'use client';

import { useState, useCallback } from 'react';
import { GameState } from '../game/types';
import GameCanvas from '../components/GameCanvas';
import MainMenu from '../components/MainMenu';
import PauseMenu from '../components/PauseMenu';
import RoundEnd from '../components/RoundEnd';
import GameOver from '../components/GameOver';

type AppState = 'menu' | 'playing' | 'paused' | 'roundEnd' | 'gameOver';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('menu');
  const [playerCount, setPlayerCount] = useState(2);
  const [roundsToWin, setRoundsToWin] = useState(3);
  const [roundWinner, setRoundWinner] = useState<number | null>(null);
  const [matchWinner, setMatchWinner] = useState<number | null>(null);
  const [gameKey, setGameKey] = useState(0);

  const handleStart = useCallback((count: number, rounds: number) => {
    setPlayerCount(count);
    setRoundsToWin(rounds);
    setAppState('playing');
    setGameKey((k) => k + 1);
  }, []);

  const handleStateChange = useCallback((state: GameState) => {
    switch (state) {
      case GameState.Paused:
        setAppState('paused');
        break;
      case GameState.Playing:
        setAppState('playing');
        break;
      case GameState.RoundEnd:
        setAppState('roundEnd');
        break;
      case GameState.GameEnd:
        setAppState('gameOver');
        break;
    }
  }, []);

  const handleMatchEnd = useCallback((winnerId: number | null) => {
    setMatchWinner(winnerId);
  }, []);

  const handleResume = useCallback(() => {
    setAppState('playing');
  }, []);

  const handleQuit = useCallback(() => {
    setAppState('menu');
  }, []);

  const handleNextRound = useCallback(() => {
    setAppState('playing');
    setRoundWinner(null);
  }, []);

  const handlePlayAgain = useCallback(() => {
    setGameKey((k) => k + 1);
    setAppState('playing');
    setMatchWinner(null);
    setRoundWinner(null);
  }, []);

  const handleMainMenu = useCallback(() => {
    setAppState('menu');
    setMatchWinner(null);
    setRoundWinner(null);
  }, []);

  if (appState === 'menu') {
    return <MainMenu onStart={handleStart} />;
  }

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="relative">
        <GameCanvas
          key={gameKey}
          playerCount={playerCount}
          roundsToWin={roundsToWin}
          onStateChange={handleStateChange}
          onMatchEnd={handleMatchEnd}
        />
        
        {appState === 'paused' && (
          <PauseMenu onResume={handleResume} onQuit={handleQuit} />
        )}
        
        {appState === 'roundEnd' && (
          <RoundEnd winnerId={roundWinner} onNextRound={handleNextRound} />
        )}
        
        {appState === 'gameOver' && (
          <GameOver
            winnerId={matchWinner}
            roundsToWin={roundsToWin}
            onPlayAgain={handlePlayAgain}
            onMainMenu={handleMainMenu}
          />
        )}
      </div>
    </main>
  );
}
