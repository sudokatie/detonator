'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState } from '../game/types';
import { Game } from '../game/Game';
import type { ReplayData } from '../game/Replay';
import GameCanvas from '../components/GameCanvas';
import MainMenu from '../components/MainMenu';
import PauseMenu from '../components/PauseMenu';
import RoundEnd from '../components/RoundEnd';
import GameOver from '../components/GameOver';
import { ReplayView } from '../components/ReplayView';
import { ReplayImport } from '../components/ReplayImport';
import { Music } from '../game/Music';

type AppState = 'menu' | 'playing' | 'paused' | 'roundEnd' | 'gameOver';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('menu');
  const [playerCount, setPlayerCount] = useState(2);
  const [roundsToWin, setRoundsToWin] = useState(3);
  const [roundWinner, setRoundWinner] = useState<number | null>(null);
  const [matchWinner, setMatchWinner] = useState<number | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [dailyMode, setDailyMode] = useState(false);
  const [showReplayView, setShowReplayView] = useState(false);
  const [showReplayImport, setShowReplayImport] = useState(false);
  const [currentReplayData, setCurrentReplayData] = useState<ReplayData | null>(null);
  const gameInstanceRef = useRef<Game | null>(null);

  const handleStart = useCallback((count: number, rounds: number) => {
    setPlayerCount(count);
    setRoundsToWin(rounds);
    setDailyMode(false);
    setAppState('playing');
    setGameKey((k) => k + 1);
  }, []);

  const handleStartDaily = useCallback(() => {
    setPlayerCount(2); // Daily is 1v1
    setRoundsToWin(3);
    setDailyMode(true);
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

  const handleRoundEnd = useCallback((winnerId: number | null) => {
    setRoundWinner(winnerId);
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

  const handleWatchReplay = useCallback(() => {
    setShowReplayImport(true);
  }, []);

  const handleShareReplay = useCallback(() => {
    const replayData = gameInstanceRef.current?.getLastReplayData();
    if (replayData) {
      setCurrentReplayData(replayData);
      setShowReplayView(true);
    }
  }, []);

  const handleImportReplay = useCallback((data: ReplayData) => {
    setShowReplayImport(false);
    setCurrentReplayData(data);
    setPlayerCount(data.playerCount);
    setDailyMode(data.dailyMode);
    // For now, just show the replay view - full playback would need GameCanvas changes
    setShowReplayView(true);
  }, []);

  const handleWatchCurrentReplay = useCallback(() => {
    setShowReplayView(false);
    // Playback mode would need deeper GameCanvas integration
  }, []);

  const handleGameReady = useCallback((game: Game) => {
    gameInstanceRef.current = game;
  }, []);

  // Switch music tracks based on game state
  useEffect(() => {
    switch (appState) {
      case 'menu':
        Music.play('menu');
        break;
      case 'playing':
        Music.play('gameplay');
        break;
      case 'roundEnd':
        Music.play('victory');
        break;
      case 'gameOver':
        if (matchWinner !== null) {
          Music.play('victory');
        } else {
          Music.play('gameover');
        }
        break;
      case 'paused':
        // Keep current track but could lower volume or stop
        break;
    }
  }, [appState, matchWinner]);

  if (appState === 'menu') {
    return (
      <>
        <MainMenu onStart={handleStart} onStartDaily={handleStartDaily} onWatchReplay={handleWatchReplay} />
        {showReplayImport && (
          <ReplayImport
            onImport={handleImportReplay}
            onClose={() => setShowReplayImport(false)}
          />
        )}
        {showReplayView && currentReplayData && (
          <ReplayView
            replayData={currentReplayData}
            onClose={() => setShowReplayView(false)}
            onWatch={handleWatchCurrentReplay}
          />
        )}
      </>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="relative">
        <GameCanvas
          key={gameKey}
          playerCount={playerCount}
          roundsToWin={roundsToWin}
          dailyMode={dailyMode}
          onStateChange={handleStateChange}
          onRoundEnd={handleRoundEnd}
          onMatchEnd={handleMatchEnd}
          onGameReady={handleGameReady}
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
            hasReplay={!!gameInstanceRef.current?.getLastReplayData()}
            onShareReplay={handleShareReplay}
          />
        )}
        
        {showReplayView && currentReplayData && (
          <ReplayView
            replayData={currentReplayData}
            onClose={() => setShowReplayView(false)}
            onWatch={handleWatchCurrentReplay}
          />
        )}
      </div>
    </main>
  );
}
