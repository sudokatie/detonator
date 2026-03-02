'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Renderer } from '../game/Renderer';
import { DISPLAY_WIDTH, DISPLAY_HEIGHT } from '../game/constants';
import {
  MultiplayerClient,
  type GameState as ServerGameState,
  type Direction,
} from '../game/Multiplayer';

interface OnlineGameProps {
  client: MultiplayerClient;
  mySlot: number;
  onDisconnect: () => void;
  onRoundEnd: (winner: number | null, scores: number[]) => void;
  onGameEnd: (winner: number, scores: number[]) => void;
}

export default function OnlineGame({
  client,
  mySlot,
  onDisconnect,
  onRoundEnd,
  onGameEnd,
}: OnlineGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const gameStateRef = useRef<ServerGameState | null>(null);
  const animationRef = useRef<number>(0);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor'>('good');
  const [disconnected, setDisconnected] = useState(false);
  const lastStateTimeRef = useRef<number>(Date.now());
  const inputStateRef = useRef<{ direction: Direction | null; bomb: boolean }>({
    direction: null,
    bomb: false,
  });

  // Handle game state updates from server
  const handleGameState = useCallback((state: ServerGameState) => {
    gameStateRef.current = state;
    const now = Date.now();
    const timeSinceLastState = now - lastStateTimeRef.current;
    lastStateTimeRef.current = now;

    // Update connection quality based on update frequency
    if (timeSinceLastState < 100) {
      setConnectionQuality('good');
    } else if (timeSinceLastState < 200) {
      setConnectionQuality('fair');
    } else {
      setConnectionQuality('poor');
    }
  }, []);

  // Render loop
  const renderLoop = useCallback(() => {
    const renderer = rendererRef.current;
    const state = gameStateRef.current;

    if (!renderer) {
      animationRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    renderer.clear();

    if (state) {
      // Draw arena
      renderer.drawArenaFromState(state.arena);

      // Draw bombs
      renderer.drawBombsFromState(state.bombs);

      // Draw explosions
      renderer.drawExplosionsFromState(state.explosions);

      // Draw power-ups
      renderer.drawPowerUpsFromState(state.powerUps);

      // Draw players
      renderer.drawPlayersFromState(state.players, mySlot);

      // Draw HUD
      renderer.drawOnlineHUD(state.scores, state.round, state.maxRounds, state.roundTime);
    }

    renderer.update();
    animationRef.current = requestAnimationFrame(renderLoop);
  }, [mySlot]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disconnected) return;

      let direction: Direction | null = null;
      let bomb = false;

      // WASD controls (online uses single control scheme)
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          direction = 'up';
          break;
        case 's':
        case 'arrowdown':
          direction = 'down';
          break;
        case 'a':
        case 'arrowleft':
          direction = 'left';
          break;
        case 'd':
        case 'arrowright':
          direction = 'right';
          break;
        case ' ':
        case 'enter':
          bomb = true;
          break;
      }

      if (direction !== inputStateRef.current.direction || bomb) {
        inputStateRef.current = { direction, bomb };
        client.sendInput(direction, bomb);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (disconnected) return;

      // Clear direction on key up
      const key = e.key.toLowerCase();
      if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        if (
          (key === 'w' || key === 'arrowup') && inputStateRef.current.direction === 'up' ||
          (key === 's' || key === 'arrowdown') && inputStateRef.current.direction === 'down' ||
          (key === 'a' || key === 'arrowleft') && inputStateRef.current.direction === 'left' ||
          (key === 'd' || key === 'arrowright') && inputStateRef.current.direction === 'right'
        ) {
          inputStateRef.current = { direction: null, bomb: false };
          client.sendInput(null, false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [client, disconnected]);

  // Initialize renderer and set up callbacks
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create renderer with online rendering methods
    const renderer = new Renderer(canvas);
    rendererRef.current = renderer;

    // Start render loop
    animationRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [renderLoop]);

  // Handle connection changes and game events
  useEffect(() => {
    const handleConnectionChange = (state: 'disconnected' | 'connecting' | 'connected') => {
      if (state === 'disconnected') {
        setDisconnected(true);
      }
    };

    const handleRoundEnd = (winner: number | null, scores: number[]) => {
      onRoundEnd(winner, scores);
    };

    const handleGameEnd = (winner: number, scores: number[]) => {
      onGameEnd(winner, scores);
    };

    // Set up callbacks - note: client already has callbacks from creation
    // We need to hook into the existing client
    const originalOnConnectionChange = (client as any).callbacks?.onConnectionChange;
    const originalOnGameState = (client as any).callbacks?.onGameState;
    const originalOnRoundEnd = (client as any).callbacks?.onRoundEnd;
    const originalOnGameEnd = (client as any).callbacks?.onGameEnd;

    (client as any).callbacks = {
      ...(client as any).callbacks,
      onConnectionChange: (state: 'disconnected' | 'connecting' | 'connected') => {
        handleConnectionChange(state);
        originalOnConnectionChange?.(state);
      },
      onGameState: (state: ServerGameState) => {
        handleGameState(state);
        originalOnGameState?.(state);
      },
      onRoundEnd: (winner: number | null, scores: number[]) => {
        handleRoundEnd(winner, scores);
        originalOnRoundEnd?.(winner, scores);
      },
      onGameEnd: (winner: number, scores: number[]) => {
        handleGameEnd(winner, scores);
        originalOnGameEnd?.(winner, scores);
      },
    };

    return () => {
      // Restore original callbacks
      (client as any).callbacks = {
        ...(client as any).callbacks,
        onConnectionChange: originalOnConnectionChange,
        onGameState: originalOnGameState,
        onRoundEnd: originalOnRoundEnd,
        onGameEnd: originalOnGameEnd,
      };
    };
  }, [client, handleGameState, onDisconnect, onRoundEnd, onGameEnd]);

  const qualityColor = {
    good: 'bg-green-500',
    fair: 'bg-yellow-500',
    poor: 'bg-red-500',
  }[connectionQuality];

  return (
    <div className="relative">
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

      {/* Connection Quality Indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-2 bg-gray-900/80 px-3 py-1 rounded">
        <div className={`w-3 h-3 rounded-full ${qualityColor}`} />
        <span className="text-white text-sm capitalize">{connectionQuality}</span>
      </div>

      {/* Disconnect Overlay */}
      {disconnected && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg">
          <div className="text-red-500 text-2xl font-bold mb-4">Disconnected</div>
          <button
            onClick={onDisconnect}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded transition-colors"
          >
            Return to Lobby
          </button>
        </div>
      )}
    </div>
  );
}
