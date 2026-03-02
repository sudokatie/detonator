/**
 * Tests for Room and RoomManager.
 */

import { Room, RoomManager } from '../Room';
import { Client } from '../types';

// Mock client factory
function mockClient(id: string, name: string = 'Test'): Client {
  return {
    id,
    ws: {} as any,
    name,
    roomCode: null,
    lastPing: Date.now(),
  };
}

describe('Room', () => {
  describe('constructor', () => {
    it('should create room with code and host', () => {
      const room = new Room('ABCD', 'host1');
      expect(room.code).toBe('ABCD');
      expect(room.hostId).toBe('host1');
      expect(room.state).toBe('lobby');
    });
  });

  describe('addPlayer', () => {
    it('should add player to room', () => {
      const room = new Room('ABCD', 'host1');
      const client = mockClient('player1', 'Alice');
      
      const player = room.addPlayer(client);
      
      expect(player).not.toBeNull();
      expect(player?.name).toBe('Alice');
      expect(player?.slot).toBe(0);
      expect(room.players.size).toBe(1);
    });

    it('should assign sequential slots', () => {
      const room = new Room('ABCD', 'host1');
      
      room.addPlayer(mockClient('p1', 'A'));
      room.addPlayer(mockClient('p2', 'B'));
      room.addPlayer(mockClient('p3', 'C'));
      
      const slots = [...room.players.values()].map(p => p.slot);
      expect(slots).toEqual([0, 1, 2]);
    });

    it('should reject fifth player', () => {
      const room = new Room('ABCD', 'host1');
      
      room.addPlayer(mockClient('p1'));
      room.addPlayer(mockClient('p2'));
      room.addPlayer(mockClient('p3'));
      room.addPlayer(mockClient('p4'));
      const fifth = room.addPlayer(mockClient('p5'));
      
      expect(fifth).toBeNull();
      expect(room.players.size).toBe(4);
    });

    it('should reject player if game started', () => {
      const room = new Room('ABCD', 'host1');
      room.addPlayer(mockClient('p1'));
      room.addPlayer(mockClient('p2'));
      room.start();
      
      const late = room.addPlayer(mockClient('p3'));
      expect(late).toBeNull();
    });
  });

  describe('removePlayer', () => {
    it('should remove player from room', () => {
      const room = new Room('ABCD', 'host1');
      room.addPlayer(mockClient('p1'));
      room.addPlayer(mockClient('p2'));
      
      room.removePlayer('p1');
      
      expect(room.players.size).toBe(1);
      expect(room.players.has('p1')).toBe(false);
    });

    it('should assign new host if host leaves', () => {
      const room = new Room('ABCD', 'host1');
      room.addPlayer(mockClient('host1'));
      room.addPlayer(mockClient('p2'));
      
      room.removePlayer('host1');
      
      expect(room.hostId).toBe('p2');
    });
  });

  describe('toggleReady', () => {
    it('should toggle ready state', () => {
      const room = new Room('ABCD', 'host1');
      room.addPlayer(mockClient('p1'));
      
      expect(room.toggleReady('p1')).toBe(true);
      expect(room.players.get('p1')?.ready).toBe(true);
      
      expect(room.toggleReady('p1')).toBe(false);
      expect(room.players.get('p1')?.ready).toBe(false);
    });

    it('should return false for unknown player', () => {
      const room = new Room('ABCD', 'host1');
      expect(room.toggleReady('unknown')).toBe(false);
    });
  });

  describe('canStart', () => {
    it('should allow host to start with 2+ ready players', () => {
      const room = new Room('ABCD', 'host1');
      room.addPlayer(mockClient('host1'));
      room.addPlayer(mockClient('p2'));
      room.toggleReady('p2');
      
      expect(room.canStart('host1')).toBe(true);
    });

    it('should reject start from non-host', () => {
      const room = new Room('ABCD', 'host1');
      room.addPlayer(mockClient('host1'));
      room.addPlayer(mockClient('p2'));
      room.toggleReady('p2');
      
      expect(room.canStart('p2')).toBe(false);
    });

    it('should reject start with only 1 player', () => {
      const room = new Room('ABCD', 'host1');
      room.addPlayer(mockClient('host1'));
      
      expect(room.canStart('host1')).toBe(false);
    });

    it('should reject start if player not ready', () => {
      const room = new Room('ABCD', 'host1');
      room.addPlayer(mockClient('host1'));
      room.addPlayer(mockClient('p2'));
      // p2 not ready
      
      expect(room.canStart('host1')).toBe(false);
    });
  });

  describe('state transitions', () => {
    it('should transition lobby -> playing -> ended', () => {
      const room = new Room('ABCD', 'host1');
      expect(room.state).toBe('lobby');
      
      room.start();
      expect(room.state).toBe('playing');
      
      room.end();
      expect(room.state).toBe('ended');
    });

    it('should reset to lobby', () => {
      const room = new Room('ABCD', 'host1');
      room.addPlayer(mockClient('p1'));
      room.addPlayer(mockClient('p2'));
      room.toggleReady('p1');
      room.toggleReady('p2');
      room.start();
      room.end();
      
      room.reset();
      
      expect(room.state).toBe('lobby');
      expect(room.players.get('p1')?.ready).toBe(false);
      expect(room.players.get('p2')?.ready).toBe(false);
    });
  });

  describe('getState', () => {
    it('should return serializable room state', () => {
      const room = new Room('ABCD', 'host1');
      room.addPlayer(mockClient('host1', 'Alice'));
      room.addPlayer(mockClient('p2', 'Bob'));
      
      const state = room.getState();
      
      expect(state.code).toBe('ABCD');
      expect(state.hostId).toBe('host1');
      expect(state.state).toBe('lobby');
      expect(state.players).toHaveLength(2);
      expect(state.players[0].name).toBe('Alice');
    });
  });
});

describe('RoomManager', () => {
  describe('createRoom', () => {
    it('should create room with unique code', () => {
      const manager = new RoomManager();
      
      const room = manager.createRoom('host1');
      
      expect(room.code).toHaveLength(4);
      expect(room.hostId).toBe('host1');
      expect(manager.count).toBe(1);
    });

    it('should generate unique codes', () => {
      const manager = new RoomManager();
      const codes = new Set<string>();
      
      for (let i = 0; i < 10; i++) {
        const room = manager.createRoom(`host${i}`);
        codes.add(room.code);
      }
      
      expect(codes.size).toBe(10);
    });
  });

  describe('getRoom', () => {
    it('should find room by code', () => {
      const manager = new RoomManager();
      const room = manager.createRoom('host1');
      
      const found = manager.getRoom(room.code);
      
      expect(found).toBe(room);
    });

    it('should find room case-insensitively', () => {
      const manager = new RoomManager();
      const room = manager.createRoom('host1');
      
      const found = manager.getRoom(room.code.toLowerCase());
      
      expect(found).toBe(room);
    });

    it('should return null for unknown code', () => {
      const manager = new RoomManager();
      
      const found = manager.getRoom('ZZZZ');
      
      expect(found).toBeNull();
    });
  });

  describe('removeRoom', () => {
    it('should remove room', () => {
      const manager = new RoomManager();
      const room = manager.createRoom('host1');
      
      manager.removeRoom(room.code);
      
      expect(manager.count).toBe(0);
      expect(manager.getRoom(room.code)).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should remove empty rooms', () => {
      const manager = new RoomManager();
      manager.createRoom('host1'); // Empty room
      
      const removed = manager.cleanup();
      
      expect(removed).toBe(1);
      expect(manager.count).toBe(0);
    });
  });
});
