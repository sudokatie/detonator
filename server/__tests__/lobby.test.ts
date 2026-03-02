/**
 * Tests for lobby protocol handlers.
 */

import {
  handleJoin,
  handleReady,
  handleStart,
  handleLeave,
  getClientRoom,
  resetForTesting,
  roomManager,
} from '../handlers/lobby';
import { Client, ServerMessage } from '../types';

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

// Track sent messages
interface SentMessage {
  clientId: string;
  message: ServerMessage;
}

// Create test harness
function createTestHarness() {
  const clients = new Map<string, Client>();
  const sent: SentMessage[] = [];

  const send = (client: Client, msg: ServerMessage) => {
    sent.push({ clientId: client.id, message: msg });
  };

  const getClient = (id: string) => clients.get(id);

  const addClient = (client: Client) => {
    clients.set(client.id, client);
    return client;
  };

  return { clients, sent, send, getClient, addClient };
}

describe('Lobby Handlers', () => {
  beforeEach(() => {
    resetForTesting();
  });

  describe('handleJoin', () => {
    it('should create room when no code provided', () => {
      const { sent, send, getClient, addClient } = createTestHarness();
      const client = addClient(mockClient('host1', 'Alice'));

      handleJoin(client, { type: 'join', name: 'Alice' }, send, getClient);

      expect(client.roomCode).not.toBeNull();
      expect(client.roomCode).toHaveLength(4);
      expect(roomManager.count).toBe(1);
    });

    it('should join existing room with code', () => {
      const { send, getClient, addClient } = createTestHarness();
      const host = addClient(mockClient('host1', 'Alice'));
      const joiner = addClient(mockClient('player2', 'Bob'));

      // Host creates room
      handleJoin(host, { type: 'join', name: 'Alice' }, send, getClient);
      const roomCode = host.roomCode!;

      // Joiner joins
      handleJoin(joiner, { type: 'join', name: 'Bob', roomCode }, send, getClient);

      expect(joiner.roomCode).toBe(roomCode);
      const room = roomManager.getRoom(roomCode)!;
      expect(room.players.size).toBe(2);
    });

    it('should broadcast player_joined to existing players', () => {
      const { sent, send, getClient, addClient } = createTestHarness();
      const host = addClient(mockClient('host1', 'Alice'));
      const joiner = addClient(mockClient('player2', 'Bob'));

      handleJoin(host, { type: 'join', name: 'Alice' }, send, getClient);
      sent.length = 0; // Clear initial messages

      handleJoin(joiner, { type: 'join', name: 'Bob', roomCode: host.roomCode! }, send, getClient);

      const playerJoinedMsgs = sent.filter(
        s => s.message.type === 'player_joined' && s.clientId === 'host1'
      );
      expect(playerJoinedMsgs).toHaveLength(1);
    });

    it('should error on invalid room code', () => {
      const { sent, send, getClient, addClient } = createTestHarness();
      const client = addClient(mockClient('player1'));

      handleJoin(client, { type: 'join', name: 'Test', roomCode: 'ZZZZ' }, send, getClient);

      const errorMsg = sent.find(s => s.message.type === 'error');
      expect(errorMsg).toBeDefined();
      expect((errorMsg!.message as any).message).toBe('Room not found');
    });

    it('should error when room is full', () => {
      const { sent, send, getClient, addClient } = createTestHarness();
      
      // Create room with 4 players
      const host = addClient(mockClient('host1'));
      handleJoin(host, { type: 'join', name: 'P1' }, send, getClient);
      const code = host.roomCode!;

      for (let i = 2; i <= 4; i++) {
        const p = addClient(mockClient(`player${i}`));
        handleJoin(p, { type: 'join', name: `P${i}`, roomCode: code }, send, getClient);
      }

      // Try to add 5th
      const fifth = addClient(mockClient('player5'));
      handleJoin(fifth, { type: 'join', name: 'P5', roomCode: code }, send, getClient);

      const errorMsg = sent.filter(s => s.clientId === 'player5' && s.message.type === 'error');
      expect(errorMsg).toHaveLength(1);
    });
  });

  describe('handleReady', () => {
    it('should toggle ready state', () => {
      const { sent, send, getClient, addClient } = createTestHarness();
      const host = addClient(mockClient('host1'));
      const player = addClient(mockClient('player2'));

      handleJoin(host, { type: 'join', name: 'Host' }, send, getClient);
      handleJoin(player, { type: 'join', name: 'Player', roomCode: host.roomCode! }, send, getClient);

      handleReady(player, send, getClient);

      const room = roomManager.getRoom(host.roomCode!)!;
      expect(room.players.get('player2')?.ready).toBe(true);
    });

    it('should broadcast room state on ready', () => {
      const { sent, send, getClient, addClient } = createTestHarness();
      const host = addClient(mockClient('host1'));
      const player = addClient(mockClient('player2'));

      handleJoin(host, { type: 'join', name: 'Host' }, send, getClient);
      handleJoin(player, { type: 'join', name: 'Player', roomCode: host.roomCode! }, send, getClient);
      sent.length = 0;

      handleReady(player, send, getClient);

      const roomStates = sent.filter(s => s.message.type === 'room_state');
      expect(roomStates.length).toBeGreaterThanOrEqual(2); // Both players get update
    });

    it('should error if not in room', () => {
      const { sent, send, getClient, addClient } = createTestHarness();
      const client = addClient(mockClient('lonely'));

      handleReady(client, send, getClient);

      const errorMsg = sent.find(s => s.message.type === 'error');
      expect(errorMsg).toBeDefined();
    });
  });

  describe('handleStart', () => {
    it('should start game when conditions met', () => {
      const { send, getClient, addClient } = createTestHarness();
      const host = addClient(mockClient('host1'));
      const player = addClient(mockClient('player2'));

      handleJoin(host, { type: 'join', name: 'Host' }, send, getClient);
      handleJoin(player, { type: 'join', name: 'Player', roomCode: host.roomCode! }, send, getClient);
      handleReady(player, send, getClient);

      const result = handleStart(host, send, getClient);

      expect(result).not.toBeNull();
      expect(result!.room.state).toBe('playing');
      expect(result!.playerIds).toContain('host1');
      expect(result!.playerIds).toContain('player2');
    });

    it('should error if not host', () => {
      const { sent, send, getClient, addClient } = createTestHarness();
      const host = addClient(mockClient('host1'));
      const player = addClient(mockClient('player2'));

      handleJoin(host, { type: 'join', name: 'Host' }, send, getClient);
      handleJoin(player, { type: 'join', name: 'Player', roomCode: host.roomCode! }, send, getClient);
      handleReady(player, send, getClient);

      const result = handleStart(player, send, getClient);

      expect(result).toBeNull();
      const errorMsg = sent.filter(s => s.clientId === 'player2' && s.message.type === 'error');
      expect(errorMsg.length).toBeGreaterThanOrEqual(1);
    });

    it('should error if players not ready', () => {
      const { sent, send, getClient, addClient } = createTestHarness();
      const host = addClient(mockClient('host1'));
      const player = addClient(mockClient('player2'));

      handleJoin(host, { type: 'join', name: 'Host' }, send, getClient);
      handleJoin(player, { type: 'join', name: 'Player', roomCode: host.roomCode! }, send, getClient);
      // Not ready

      const result = handleStart(host, send, getClient);

      expect(result).toBeNull();
    });
  });

  describe('handleLeave', () => {
    it('should remove player from room', () => {
      const { send, getClient, addClient } = createTestHarness();
      const host = addClient(mockClient('host1'));
      const player = addClient(mockClient('player2'));

      handleJoin(host, { type: 'join', name: 'Host' }, send, getClient);
      handleJoin(player, { type: 'join', name: 'Player', roomCode: host.roomCode! }, send, getClient);

      handleLeave(player, send, getClient);

      const room = roomManager.getRoom(host.roomCode!)!;
      expect(room.players.size).toBe(1);
      expect(player.roomCode).toBeNull();
    });

    it('should notify remaining players', () => {
      const { sent, send, getClient, addClient } = createTestHarness();
      const host = addClient(mockClient('host1'));
      const player = addClient(mockClient('player2'));

      handleJoin(host, { type: 'join', name: 'Host' }, send, getClient);
      handleJoin(player, { type: 'join', name: 'Player', roomCode: host.roomCode! }, send, getClient);
      sent.length = 0;

      handleLeave(player, send, getClient);

      const leftMsg = sent.find(s => s.message.type === 'player_left' && s.clientId === 'host1');
      expect(leftMsg).toBeDefined();
    });

    it('should delete room when last player leaves', () => {
      const { send, getClient, addClient } = createTestHarness();
      const host = addClient(mockClient('host1'));

      handleJoin(host, { type: 'join', name: 'Host' }, send, getClient);
      const roomCode = host.roomCode!;

      handleLeave(host, send, getClient);

      expect(roomManager.getRoom(roomCode)).toBeNull();
    });
  });

  describe('getClientRoom', () => {
    it('should return room for client', () => {
      const { send, getClient, addClient } = createTestHarness();
      const client = addClient(mockClient('player1'));

      handleJoin(client, { type: 'join', name: 'Test' }, send, getClient);

      const room = getClientRoom('player1');
      expect(room).not.toBeNull();
      expect(room!.code).toBe(client.roomCode);
    });

    it('should return null for client not in room', () => {
      expect(getClientRoom('unknown')).toBeNull();
    });
  });
});
