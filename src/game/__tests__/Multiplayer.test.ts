import {
  MultiplayerClient,
  createMultiplayerClient,
  getMultiplayerClient,
  destroyMultiplayerClient,
  type RoomState,
  type GameState,
} from '../Multiplayer';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;

  sentMessages: string[] = [];

  constructor(public url: string) {
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    }, 10);
  }

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }

  // Test helper to simulate server message
  simulateMessage(message: unknown): void {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
}

// Replace global WebSocket with mock
const originalWebSocket = global.WebSocket;
beforeEach(() => {
  (global as unknown as { WebSocket: typeof MockWebSocket }).WebSocket = MockWebSocket as unknown as typeof WebSocket;
});
afterEach(() => {
  (global as unknown as { WebSocket: typeof WebSocket }).WebSocket = originalWebSocket;
  destroyMultiplayerClient();
});

describe('MultiplayerClient', () => {
  describe('connection', () => {
    it('should connect to server', async () => {
      const client = new MultiplayerClient('ws://localhost:3001');
      await client.connect();
      expect(client.state).toBe('connected');
    });

    it('should call onConnectionChange when state changes', async () => {
      const onConnectionChange = jest.fn();
      const client = new MultiplayerClient('ws://localhost:3001', { onConnectionChange });
      
      await client.connect();
      
      expect(onConnectionChange).toHaveBeenCalledWith('connecting');
      expect(onConnectionChange).toHaveBeenCalledWith('connected');
    });

    it('should disconnect cleanly', async () => {
      const client = new MultiplayerClient('ws://localhost:3001');
      await client.connect();
      client.disconnect();
      expect(client.state).toBe('disconnected');
    });

    it('should resolve immediately if already connected', async () => {
      const client = new MultiplayerClient('ws://localhost:3001');
      await client.connect();
      await client.connect(); // Should not throw
      expect(client.state).toBe('connected');
    });
  });

  describe('room management', () => {
    it('should send join message', async () => {
      const client = new MultiplayerClient('ws://localhost:3001');
      await client.connect();
      
      client.joinRoom('TestPlayer');
      
      const ws = (client as unknown as { ws: MockWebSocket }).ws;
      expect(ws.sentMessages).toContainEqual(JSON.stringify({ type: 'join', name: 'TestPlayer' }));
    });

    it('should send join message with room code', async () => {
      const client = new MultiplayerClient('ws://localhost:3001');
      await client.connect();
      
      client.joinRoom('TestPlayer', 'ABCD');
      
      const ws = (client as unknown as { ws: MockWebSocket }).ws;
      expect(ws.sentMessages).toContainEqual(
        JSON.stringify({ type: 'join', name: 'TestPlayer', roomCode: 'ABCD' })
      );
    });

    it('should update room state on room_state message', async () => {
      const onRoomState = jest.fn();
      const client = new MultiplayerClient('ws://localhost:3001', { onRoomState });
      await client.connect();
      
      const roomState: RoomState = {
        code: 'ABCD',
        hostId: 'player1',
        players: [{ id: 'player1', name: 'Test', ready: false, slot: 0, connected: true }],
        state: 'lobby',
      };
      
      const ws = (client as unknown as { ws: MockWebSocket }).ws;
      ws.simulateMessage({ type: 'room_state', room: roomState });
      
      expect(onRoomState).toHaveBeenCalledWith(roomState);
      expect(client.room).toEqual(roomState);
    });

    it('should send leave message', async () => {
      const client = new MultiplayerClient('ws://localhost:3001');
      await client.connect();
      
      client.leaveRoom();
      
      const ws = (client as unknown as { ws: MockWebSocket }).ws;
      expect(ws.sentMessages).toContainEqual(JSON.stringify({ type: 'leave' }));
    });

    it('should clear room state on leave', async () => {
      const client = new MultiplayerClient('ws://localhost:3001');
      await client.connect();
      
      // Simulate joining a room
      const ws = (client as unknown as { ws: MockWebSocket }).ws;
      ws.simulateMessage({
        type: 'room_state',
        room: { code: 'ABCD', hostId: 'p1', players: [], state: 'lobby' },
      });
      
      expect(client.room).not.toBeNull();
      
      client.leaveRoom();
      expect(client.room).toBeNull();
    });
  });

  describe('ready and start', () => {
    it('should send ready message', async () => {
      const client = new MultiplayerClient('ws://localhost:3001');
      await client.connect();
      
      client.setReady();
      
      const ws = (client as unknown as { ws: MockWebSocket }).ws;
      expect(ws.sentMessages).toContainEqual(JSON.stringify({ type: 'ready' }));
    });

    it('should send start message', async () => {
      const client = new MultiplayerClient('ws://localhost:3001');
      await client.connect();
      
      client.startGame();
      
      const ws = (client as unknown as { ws: MockWebSocket }).ws;
      expect(ws.sentMessages).toContainEqual(JSON.stringify({ type: 'start' }));
    });

    it('should identify as host correctly', async () => {
      const client = new MultiplayerClient('ws://localhost:3001');
      await client.connect();
      
      const ws = (client as unknown as { ws: MockWebSocket }).ws;
      
      // Not host initially
      expect(client.isHost).toBe(false);
      
      // Simulate room state where we are host
      ws.simulateMessage({
        type: 'room_state',
        room: {
          code: 'ABCD',
          hostId: 'player1',
          players: [{ id: 'player1', name: 'Test', ready: false, slot: 0, connected: true }],
          state: 'lobby',
        },
      });
      
      // After receiving room state, client should extract player ID
      expect(client.isHost).toBe(true);
    });
  });

  describe('game input', () => {
    it('should send input message', async () => {
      const client = new MultiplayerClient('ws://localhost:3001');
      await client.connect();
      
      client.sendInput('up', false);
      
      const ws = (client as unknown as { ws: MockWebSocket }).ws;
      expect(ws.sentMessages).toContainEqual(
        JSON.stringify({ type: 'input', direction: 'up', bomb: false })
      );
    });

    it('should send bomb input', async () => {
      const client = new MultiplayerClient('ws://localhost:3001');
      await client.connect();
      
      client.sendInput(null, true);
      
      const ws = (client as unknown as { ws: MockWebSocket }).ws;
      expect(ws.sentMessages).toContainEqual(
        JSON.stringify({ type: 'input', direction: null, bomb: true })
      );
    });

    it('should debounce rapid inputs', async () => {
      const client = new MultiplayerClient('ws://localhost:3001');
      await client.connect();
      
      // Send many inputs rapidly
      for (let i = 0; i < 10; i++) {
        client.sendInput('up', false);
      }
      
      const ws = (client as unknown as { ws: MockWebSocket }).ws;
      // Should only send one due to debouncing
      const inputMessages = ws.sentMessages.filter((m) => m.includes('"type":"input"'));
      expect(inputMessages.length).toBe(1);
    });
  });

  describe('game state callbacks', () => {
    it('should call onGameStart', async () => {
      const onGameStart = jest.fn();
      const client = new MultiplayerClient('ws://localhost:3001', { onGameStart });
      await client.connect();
      
      const gameState: GameState = {
        tick: 0,
        arena: { width: 15, height: 13, tiles: [] },
        players: [],
        bombs: [],
        explosions: [],
        powerUps: [],
        roundTime: 180,
        scores: [0, 0],
        round: 1,
        maxRounds: 3,
      };
      
      const ws = (client as unknown as { ws: MockWebSocket }).ws;
      ws.simulateMessage({ type: 'game_start', state: gameState });
      
      expect(onGameStart).toHaveBeenCalledWith(gameState);
    });

    it('should call onGameState', async () => {
      const onGameState = jest.fn();
      const client = new MultiplayerClient('ws://localhost:3001', { onGameState });
      await client.connect();
      
      const gameState: GameState = {
        tick: 100,
        arena: { width: 15, height: 13, tiles: [] },
        players: [],
        bombs: [],
        explosions: [],
        powerUps: [],
        roundTime: 170,
        scores: [1, 0],
        round: 1,
        maxRounds: 3,
      };
      
      const ws = (client as unknown as { ws: MockWebSocket }).ws;
      ws.simulateMessage({ type: 'game_state', state: gameState });
      
      expect(onGameState).toHaveBeenCalledWith(gameState);
    });

    it('should call onRoundEnd', async () => {
      const onRoundEnd = jest.fn();
      const client = new MultiplayerClient('ws://localhost:3001', { onRoundEnd });
      await client.connect();
      
      const ws = (client as unknown as { ws: MockWebSocket }).ws;
      ws.simulateMessage({ type: 'round_end', winner: 0, scores: [2, 1] });
      
      expect(onRoundEnd).toHaveBeenCalledWith(0, [2, 1]);
    });

    it('should call onGameEnd and update room state', async () => {
      const onGameEnd = jest.fn();
      const client = new MultiplayerClient('ws://localhost:3001', { onGameEnd });
      await client.connect();
      
      const ws = (client as unknown as { ws: MockWebSocket }).ws;
      
      // Set up room in playing state
      ws.simulateMessage({
        type: 'room_state',
        room: { code: 'ABCD', hostId: 'p1', players: [], state: 'playing' },
      });
      
      ws.simulateMessage({ type: 'game_end', winner: 1, scores: [2, 3] });
      
      expect(onGameEnd).toHaveBeenCalledWith(1, [2, 3]);
      expect(client.room?.state).toBe('ended');
    });

    it('should call onError', async () => {
      const onError = jest.fn();
      const client = new MultiplayerClient('ws://localhost:3001', { onError });
      await client.connect();
      
      const ws = (client as unknown as { ws: MockWebSocket }).ws;
      ws.simulateMessage({ type: 'error', message: 'Room not found' });
      
      expect(onError).toHaveBeenCalledWith('Room not found');
    });
  });

  describe('player events', () => {
    it('should call onPlayerJoined and update room', async () => {
      const onPlayerJoined = jest.fn();
      const client = new MultiplayerClient('ws://localhost:3001', { onPlayerJoined });
      await client.connect();
      
      const ws = (client as unknown as { ws: MockWebSocket }).ws;
      
      // Set up initial room
      ws.simulateMessage({
        type: 'room_state',
        room: {
          code: 'ABCD',
          hostId: 'p1',
          players: [{ id: 'p1', name: 'Player1', ready: true, slot: 0, connected: true }],
          state: 'lobby',
        },
      });
      
      const newPlayer = { id: 'p2', name: 'Player2', ready: false, slot: 1, connected: true };
      ws.simulateMessage({ type: 'player_joined', player: newPlayer });
      
      expect(onPlayerJoined).toHaveBeenCalledWith(newPlayer);
      expect(client.room?.players).toHaveLength(2);
    });

    it('should call onPlayerLeft and update room', async () => {
      const onPlayerLeft = jest.fn();
      const client = new MultiplayerClient('ws://localhost:3001', { onPlayerLeft });
      await client.connect();
      
      const ws = (client as unknown as { ws: MockWebSocket }).ws;
      
      // Set up room with two players
      ws.simulateMessage({
        type: 'room_state',
        room: {
          code: 'ABCD',
          hostId: 'p1',
          players: [
            { id: 'p1', name: 'Player1', ready: true, slot: 0, connected: true },
            { id: 'p2', name: 'Player2', ready: false, slot: 1, connected: true },
          ],
          state: 'lobby',
        },
      });
      
      ws.simulateMessage({ type: 'player_left', playerId: 'p2' });
      
      expect(onPlayerLeft).toHaveBeenCalledWith('p2');
      expect(client.room?.players).toHaveLength(1);
    });
  });
});

describe('singleton functions', () => {
  it('should create and get client', () => {
    expect(getMultiplayerClient()).toBeNull();
    
    const client = createMultiplayerClient('ws://localhost:3001');
    expect(getMultiplayerClient()).toBe(client);
  });

  it('should replace existing client on create', async () => {
    const client1 = createMultiplayerClient('ws://localhost:3001');
    await client1.connect();
    
    const client2 = createMultiplayerClient('ws://localhost:3002');
    
    expect(getMultiplayerClient()).toBe(client2);
    expect(client1.state).toBe('disconnected');
  });

  it('should destroy client', async () => {
    const client = createMultiplayerClient('ws://localhost:3001');
    await client.connect();
    
    destroyMultiplayerClient();
    
    expect(getMultiplayerClient()).toBeNull();
    expect(client.state).toBe('disconnected');
  });
});
