/**
 * Room management for multiplayer games.
 */

import { RoomState, RoomPlayer, Client } from './types';

const ROOM_TIMEOUT = 5 * 60 * 1000; // 5 minutes inactivity

export class Room {
  readonly code: string;
  hostId: string;
  state: 'lobby' | 'playing' | 'ended' = 'lobby';
  players = new Map<string, RoomPlayer>();
  lastActivity: number;

  constructor(code: string, hostId: string) {
    this.code = code;
    this.hostId = hostId;
    this.lastActivity = Date.now();
  }

  // Add a player to the room
  addPlayer(client: Client): RoomPlayer | null {
    if (this.players.size >= 4) return null;
    if (this.state !== 'lobby') return null;

    // Find available slot
    const usedSlots = new Set([...this.players.values()].map(p => p.slot));
    let slot = 0;
    while (usedSlots.has(slot) && slot < 4) slot++;
    
    const player: RoomPlayer = {
      id: client.id,
      name: client.name || `Player ${slot + 1}`,
      ready: false,
      slot,
      connected: true,
    };
    
    this.players.set(client.id, player);
    this.lastActivity = Date.now();
    return player;
  }

  // Remove a player from the room
  removePlayer(clientId: string): void {
    this.players.delete(clientId);
    this.lastActivity = Date.now();

    // If host left, assign new host
    if (clientId === this.hostId && this.players.size > 0) {
      this.hostId = [...this.players.keys()][0];
    }
  }

  // Toggle player ready state
  toggleReady(clientId: string): boolean {
    const player = this.players.get(clientId);
    if (!player) return false;
    
    player.ready = !player.ready;
    this.lastActivity = Date.now();
    return player.ready;
  }

  // Check if game can start
  canStart(requesterId: string): boolean {
    if (requesterId !== this.hostId) return false;
    if (this.state !== 'lobby') return false;
    if (this.players.size < 2) return false;
    
    // All players must be ready (except host who starts)
    for (const [id, player] of this.players) {
      if (id !== requesterId && !player.ready) return false;
    }
    return true;
  }

  // Start the game
  start(): void {
    this.state = 'playing';
    this.lastActivity = Date.now();
  }

  // End the game
  end(): void {
    this.state = 'ended';
    this.lastActivity = Date.now();
  }

  // Reset to lobby
  reset(): void {
    this.state = 'lobby';
    for (const player of this.players.values()) {
      player.ready = false;
    }
    this.lastActivity = Date.now();
  }

  // Check if room is stale
  isStale(): boolean {
    return Date.now() - this.lastActivity > ROOM_TIMEOUT;
  }

  // Check if room is empty
  isEmpty(): boolean {
    return this.players.size === 0;
  }

  // Get room state for clients
  getState(): RoomState {
    return {
      code: this.code,
      hostId: this.hostId,
      players: [...this.players.values()],
      state: this.state,
    };
  }
}

// Generate random room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export class RoomManager {
  private rooms = new Map<string, Room>();

  // Create a new room
  createRoom(hostId: string): Room {
    let code: string;
    do {
      code = generateRoomCode();
    } while (this.rooms.has(code));

    const room = new Room(code, hostId);
    this.rooms.set(code, room);
    return room;
  }

  // Find room by code
  getRoom(code: string): Room | null {
    return this.rooms.get(code.toUpperCase()) ?? null;
  }

  // Remove a room
  removeRoom(code: string): void {
    this.rooms.delete(code);
  }

  // Clean up stale and empty rooms
  cleanup(): number {
    let removed = 0;
    for (const [code, room] of this.rooms) {
      if (room.isEmpty() || room.isStale()) {
        this.rooms.delete(code);
        removed++;
      }
    }
    return removed;
  }

  // Get room count
  get count(): number {
    return this.rooms.size;
  }

  // Get all rooms (for debugging)
  getAllRooms(): Room[] {
    return [...this.rooms.values()];
  }
}
