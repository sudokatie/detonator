'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Game } from '../game/Game';
import { Renderer } from '../game/Renderer';
import { InputHandler } from '../game/Input';
import { GameState, Direction } from '../game/types';
import { DISPLAY_WIDTH, DISPLAY_HEIGHT, CANVAS_SCALE } from '../game/constants';

interface GameCanvasProps {
  playerCount: number;
  roundsToWin?: number;
  onStateChange?: (state: GameState) => void;
  onMatchEnd?: (winnerId: number | null) => void;
}

export default function GameCanvas({ playerCount, roundsToWin = 3, onStateChange, onMatchEnd }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const inputRef = useRef<InputHandler | null>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const gameLoop = useCallback((timestamp: number) => {
    const game = gameRef.current;
    const renderer = rendererRef.current;
    const input = inputRef.current;

    if (!game || !renderer || !input) return;

    // Calculate delta time
    const dt = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0;
    lastTimeRef.current = timestamp;

    // Cap delta time to prevent huge jumps
    const cappedDt = Math.min(dt, 0.1);

    // Process input
    if (game.state === GameState.Playing) {
      for (let i = 0; i < playerCount; i++) {
        const direction = input.getDirection(i);
        if (direction !== Direction.None) {
          game.movePlayer(i, direction);
        }
      }
    }

    // Update game state
    game.update(cappedDt);

    // Render
    renderer.clear();
    renderer.drawArena(game.arena);
    renderer.drawBombs(game.bombManager);
    renderer.drawExplosions(game.bombManager);
    renderer.drawPowerUps(game.powerUps);
    renderer.drawPlayers(game.players);
    renderer.drawHUD(game.players, game.roundTimer);
    renderer.update();

    // Check for state changes
    if (onStateChange) {
      onStateChange(game.state);
    }

    if (game.state === GameState.GameEnd && onMatchEnd) {
      onMatchEnd(game.matchWinner);
    }

    // Continue loop
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [playerCount, roundsToWin, onStateChange, onMatchEnd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize game components
    const game = new Game(playerCount, roundsToWin);
    const renderer = new Renderer(canvas);
    const input = new InputHandler();

    gameRef.current = game;
    rendererRef.current = renderer;
    inputRef.current = input;

    // Set up input callback for bombs
    input.setCallback((playerId, action) => {
      if (action === 'bomb' && game.state === GameState.Playing) {
        game.placeBomb(playerId);
      }
    });

    // Attach input handlers
    input.attach();

    // Start the game
    game.start();

    // Start game loop
    lastTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      // Cleanup
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      input.detach();
    };
  }, [playerCount, roundsToWin, gameLoop]);

  // Handle pause/resume with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const game = gameRef.current;
        if (!game) return;

        if (game.state === GameState.Playing) {
          game.pause();
        } else if (game.state === GameState.Paused) {
          game.resume();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: DISPLAY_WIDTH,
        height: DISPLAY_HEIGHT,
        imageRendering: 'pixelated',
        border: '4px solid #4a4a6a',
        borderRadius: '8px',
      }}
    />
  );
}
