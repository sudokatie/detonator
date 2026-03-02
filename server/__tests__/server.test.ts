/**
 * Tests for multiplayer server.
 */

import { parseMessage } from '../index';

describe('Server', () => {
  describe('parseMessage', () => {
    it('should parse valid join message', () => {
      const msg = parseMessage('{"type":"join","name":"Player1"}');
      expect(msg).toEqual({ type: 'join', name: 'Player1' });
    });

    it('should parse join with room code', () => {
      const msg = parseMessage('{"type":"join","name":"Player1","roomCode":"ABCD"}');
      expect(msg).toEqual({ type: 'join', name: 'Player1', roomCode: 'ABCD' });
    });

    it('should parse ping message', () => {
      const msg = parseMessage('{"type":"ping"}');
      expect(msg).toEqual({ type: 'ping' });
    });

    it('should parse ready message', () => {
      const msg = parseMessage('{"type":"ready"}');
      expect(msg).toEqual({ type: 'ready' });
    });

    it('should parse input message', () => {
      const msg = parseMessage('{"type":"input","direction":"up","bomb":false}');
      expect(msg).toEqual({ type: 'input', direction: 'up', bomb: false });
    });

    it('should parse input with null direction', () => {
      const msg = parseMessage('{"type":"input","direction":null,"bomb":true}');
      expect(msg).toEqual({ type: 'input', direction: null, bomb: true });
    });

    it('should parse leave message', () => {
      const msg = parseMessage('{"type":"leave"}');
      expect(msg).toEqual({ type: 'leave' });
    });

    it('should return null for invalid JSON', () => {
      const msg = parseMessage('not json');
      expect(msg).toBeNull();
    });

    it('should return null for non-object', () => {
      const msg = parseMessage('"string"');
      expect(msg).toBeNull();
    });

    it('should return null for missing type', () => {
      const msg = parseMessage('{"name":"test"}');
      expect(msg).toBeNull();
    });

    it('should return null for null', () => {
      const msg = parseMessage('null');
      expect(msg).toBeNull();
    });
  });
});
