/**
 * Lobby protocol handlers for multiplayer.
 */

import { Client, ClientMessage, ServerMessage, RoomState } from '../types';
import { Room, RoomManager } from '../Room';

// Singleton room manager
export const roomManager = new RoomManager();

// Map client ID to room code
const clientRooms = new Map<string, string>();

// Broadcast to all players in a room
export function broadcastToRoom(room: Room, message: ServerMessage, exclude?: string): void {
  const state = room.getState();
  for (const player of state.players) {
    if (player.id !== exclude && player.connected) {
      // Note: actual send happens in server/index.ts via callback
      // This function is called with a send function parameter in real usage
    }
  }
}

// Handle join message
export function handleJoin(
  client: Client,
  message: Extract<ClientMessage, { type: 'join' }>,
  send: (client: Client, msg: ServerMessage) => void,
  getClient: (id: string) => Client | undefined
): void {
  // Set client name
  client.name = message.name.slice(0, 16) || 'Anonymous';

  // Leave existing room if any
  handleLeave(client, send, getClient);

  let room: Room;
  
  if (message.roomCode) {
    // Join existing room
    const existingRoom = roomManager.getRoom(message.roomCode);
    if (!existingRoom) {
      send(client, { type: 'error', message: 'Room not found' });
      return;
    }
    if (existingRoom.state !== 'lobby') {
      send(client, { type: 'error', message: 'Game already in progress' });
      return;
    }
    room = existingRoom;
  } else {
    // Create new room
    room = roomManager.createRoom(client.id);
  }

  // Add player to room
  const player = room.addPlayer(client);
  if (!player) {
    send(client, { type: 'error', message: 'Room is full' });
    return;
  }

  // Track client's room
  client.roomCode = room.code;
  clientRooms.set(client.id, room.code);

  // Notify all players in room
  const state = room.getState();
  for (const p of state.players) {
    const c = getClient(p.id);
    if (c) {
      send(c, { type: 'room_state', room: state });
      if (p.id !== client.id) {
        send(c, { type: 'player_joined', player });
      }
    }
  }
}

// Handle ready message
export function handleReady(
  client: Client,
  send: (client: Client, msg: ServerMessage) => void,
  getClient: (id: string) => Client | undefined
): void {
  const roomCode = clientRooms.get(client.id);
  if (!roomCode) {
    send(client, { type: 'error', message: 'Not in a room' });
    return;
  }

  const room = roomManager.getRoom(roomCode);
  if (!room) {
    send(client, { type: 'error', message: 'Room not found' });
    return;
  }

  if (room.state !== 'lobby') {
    send(client, { type: 'error', message: 'Game already started' });
    return;
  }

  room.toggleReady(client.id);

  // Broadcast updated state
  const state = room.getState();
  for (const p of state.players) {
    const c = getClient(p.id);
    if (c) {
      send(c, { type: 'room_state', room: state });
    }
  }
}

// Handle start message
export function handleStart(
  client: Client,
  send: (client: Client, msg: ServerMessage) => void,
  getClient: (id: string) => Client | undefined
): { room: Room; playerIds: string[] } | null {
  const roomCode = clientRooms.get(client.id);
  if (!roomCode) {
    send(client, { type: 'error', message: 'Not in a room' });
    return null;
  }

  const room = roomManager.getRoom(roomCode);
  if (!room) {
    send(client, { type: 'error', message: 'Room not found' });
    return null;
  }

  if (!room.canStart(client.id)) {
    send(client, { type: 'error', message: 'Cannot start: need 2+ players, all ready' });
    return null;
  }

  room.start();

  // Return room and player IDs for game initialization
  return {
    room,
    playerIds: [...room.players.keys()],
  };
}

// Handle leave message (or disconnect)
export function handleLeave(
  client: Client,
  send: (client: Client, msg: ServerMessage) => void,
  getClient: (id: string) => Client | undefined
): void {
  const roomCode = clientRooms.get(client.id);
  if (!roomCode) return;

  const room = roomManager.getRoom(roomCode);
  if (!room) {
    clientRooms.delete(client.id);
    client.roomCode = null;
    return;
  }

  room.removePlayer(client.id);
  clientRooms.delete(client.id);
  client.roomCode = null;

  // Notify remaining players
  if (!room.isEmpty()) {
    const state = room.getState();
    for (const p of state.players) {
      const c = getClient(p.id);
      if (c) {
        send(c, { type: 'player_left', playerId: client.id });
        send(c, { type: 'room_state', room: state });
      }
    }
  } else {
    // Room empty, remove it
    roomManager.removeRoom(roomCode);
  }
}

// Get client's current room
export function getClientRoom(clientId: string): Room | null {
  const roomCode = clientRooms.get(clientId);
  if (!roomCode) return null;
  return roomManager.getRoom(roomCode);
}

// Cleanup for testing
export function resetForTesting(): void {
  clientRooms.clear();
  // Note: roomManager doesn't expose clear, but cleanup handles it
  roomManager.cleanup();
}
