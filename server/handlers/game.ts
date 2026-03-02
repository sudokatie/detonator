/**
 * Game protocol handlers for multiplayer.
 */

import { Client, ServerMessage, GameState, Direction } from '../types';
import { Room } from '../Room';
import { GameRunner } from '../GameRunner';

// Active games by room code
const activeGames = new Map<string, GameRunner>();

// Start a game for a room
export function startGame(
  room: Room,
  playerIds: string[],
  send: (client: Client, msg: ServerMessage) => void,
  getClient: (id: string) => Client | undefined
): GameRunner {
  const runner = new GameRunner(room, playerIds);

  // Set up callbacks
  runner.setCallbacks(
    // State update
    (state: GameState) => {
      const msg: ServerMessage = { type: 'game_state', state };
      for (const id of playerIds) {
        const client = getClient(id);
        if (client) send(client, msg);
      }
    },
    // Round end
    (winner: number | null, scores: number[]) => {
      const msg: ServerMessage = { type: 'round_end', winner, scores };
      for (const id of playerIds) {
        const client = getClient(id);
        if (client) send(client, msg);
      }
    },
    // Game end
    (winner: number, scores: number[]) => {
      const msg: ServerMessage = { type: 'game_end', winner, scores };
      for (const id of playerIds) {
        const client = getClient(id);
        if (client) send(client, msg);
      }
      // Clean up
      activeGames.delete(room.code);
      room.end();
    }
  );

  // Send initial state
  const initialState = runner.getState();
  const startMsg: ServerMessage = { type: 'game_start', state: initialState };
  for (const id of playerIds) {
    const client = getClient(id);
    if (client) send(client, startMsg);
  }

  // Store and start
  activeGames.set(room.code, runner);
  runner.start();

  return runner;
}

// Handle input message
export function handleInput(
  client: Client,
  direction: Direction | null,
  bomb: boolean
): void {
  if (!client.roomCode) return;
  
  const runner = activeGames.get(client.roomCode);
  if (!runner) return;
  
  runner.handleInput(client.id, direction, bomb);
}

// Handle player disconnect during game
export function handleGameDisconnect(client: Client): void {
  if (!client.roomCode) return;
  
  const runner = activeGames.get(client.roomCode);
  if (!runner) return;
  
  runner.handleDisconnect(client.id);
}

// Get game for room
export function getGame(roomCode: string): GameRunner | undefined {
  return activeGames.get(roomCode);
}

// Stop game for room
export function stopGame(roomCode: string): void {
  const runner = activeGames.get(roomCode);
  if (runner) {
    runner.stop();
    activeGames.delete(roomCode);
  }
}

// Cleanup for testing
export function resetGamesForTesting(): void {
  for (const runner of activeGames.values()) {
    runner.stop();
  }
  activeGames.clear();
}
