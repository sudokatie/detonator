/**
 * Detonator Multiplayer Server
 * 
 * WebSocket server for online multiplayer Bomberman.
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { ClientMessage, ServerMessage, Client } from './types';

const PORT = parseInt(process.env.PORT || '8080', 10);
const PING_INTERVAL = 30000; // 30 seconds
const PING_TIMEOUT = 10000; // 10 seconds to respond

// Connected clients
const clients = new Map<string, Client>();

// Generate unique client ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Send message to client
function send(client: Client, message: ServerMessage): void {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
  }
}

// Parse incoming message
function parseMessage(data: string): ClientMessage | null {
  try {
    const parsed = JSON.parse(data);
    if (typeof parsed === 'object' && parsed !== null && 'type' in parsed) {
      return parsed as ClientMessage;
    }
  } catch {
    // Invalid JSON
  }
  return null;
}

// Handle client connection
function handleConnection(ws: WebSocket): void {
  const id = generateId();
  const client: Client = {
    id,
    ws,
    name: '',
    roomCode: null,
    lastPing: Date.now(),
  };
  
  clients.set(id, client);
  console.log(`Client connected: ${id}`);

  ws.on('message', (data) => {
    const message = parseMessage(data.toString());
    if (!message) {
      send(client, { type: 'error', message: 'Invalid message format' });
      return;
    }
    
    handleMessage(client, message);
  });

  ws.on('close', () => {
    handleDisconnect(client);
  });

  ws.on('error', (err) => {
    console.error(`Client ${id} error:`, err.message);
  });
}

// Handle incoming message
function handleMessage(client: Client, message: ClientMessage): void {
  client.lastPing = Date.now();

  switch (message.type) {
    case 'ping':
      send(client, { type: 'pong' });
      break;
    
    case 'join':
      // Room management will be added in Task 2
      client.name = message.name.slice(0, 16); // Max 16 chars
      console.log(`Client ${client.id} set name: ${client.name}`);
      break;
    
    case 'leave':
      handleDisconnect(client);
      break;
    
    default:
      // Other messages handled by room/game managers (Tasks 2-4)
      break;
  }
}

// Handle client disconnect
function handleDisconnect(client: Client): void {
  console.log(`Client disconnected: ${client.id}`);
  clients.delete(client.id);
  
  // Room cleanup will be added in Task 2
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.close();
  }
}

// Ping clients to check connection health
function pingClients(): void {
  const now = Date.now();
  
  for (const client of clients.values()) {
    if (now - client.lastPing > PING_INTERVAL + PING_TIMEOUT) {
      console.log(`Client ${client.id} timed out`);
      handleDisconnect(client);
    }
  }
}

// HTTP request handler for health checks
function handleHttpRequest(req: IncomingMessage, res: ServerResponse): void {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      clients: clients.size,
      uptime: process.uptime(),
    }));
    return;
  }

  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Detonator Multiplayer Server');
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
}

// Start server
function start(): void {
  // Create HTTP server for health checks
  const server = createServer(handleHttpRequest);
  
  // Attach WebSocket server
  const wss = new WebSocketServer({ server });
  
  wss.on('connection', handleConnection);

  wss.on('error', (err) => {
    console.error('WebSocket error:', err.message);
  });

  server.listen(PORT, () => {
    console.log(`Detonator server listening on port ${PORT}`);
  });

  server.on('error', (err) => {
    console.error('Server error:', err.message);
  });

  // Periodic ping check
  setInterval(pingClients, PING_INTERVAL);
}

// Export for testing
export { clients, handleConnection, handleMessage, handleDisconnect, send, parseMessage };

// Start if run directly
if (require.main === module) {
  start();
}
