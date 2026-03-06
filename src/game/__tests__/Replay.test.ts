import { Replay, ReplayData, ReplayFrame } from '../Replay';
import { Direction } from '../types';

describe('Replay', () => {
  describe('recording', () => {
    it('should start recording', () => {
      const replay = new Replay();
      expect(replay.isRecording).toBe(false);
      
      replay.startRecording(2);
      expect(replay.isRecording).toBe(true);
    });

    it('should record move actions', () => {
      const replay = new Replay();
      replay.startRecording(2);
      
      replay.recordMove(0, Direction.Up);
      replay.recordMove(1, Direction.Left);
      
      const data = replay.stopRecording(0, 3);
      expect(data.frames.length).toBe(2);
      expect(data.frames[0].action).toBe('move');
      expect(data.frames[0].direction).toBe(Direction.Up);
      expect(data.frames[0].playerId).toBe(0);
      expect(data.frames[1].playerId).toBe(1);
    });

    it('should record bomb actions', () => {
      const replay = new Replay();
      replay.startRecording(2);
      
      replay.recordBomb(0);
      replay.recordBomb(1);
      
      const data = replay.stopRecording(1, 2);
      expect(data.frames.length).toBe(2);
      expect(data.frames[0].action).toBe('bomb');
      expect(data.frames[0].playerId).toBe(0);
    });

    it('should not record when not recording', () => {
      const replay = new Replay();
      
      replay.recordMove(0, 'up');
      replay.recordBomb(0);
      
      replay.startRecording(2);
      const data = replay.stopRecording(null, 1);
      expect(data.frames.length).toBe(0);
    });

    it('should include final stats in data', () => {
      const replay = new Replay();
      replay.startRecording(4, true);
      
      const data = replay.stopRecording(2, 5);
      
      expect(data.playerCount).toBe(4);
      expect(data.finalWinner).toBe(2);
      expect(data.roundsPlayed).toBe(5);
      expect(data.dailyMode).toBe(true);
    });
  });

  describe('playback', () => {
    it('should start playback', () => {
      const replay = new Replay();
      const data: ReplayData = {
        version: 1,
        timestamp: Date.now(),
        duration: 1000,
        frames: [
          { time: 0, playerId: 0, action: 'move', direction: Direction.Up },
        ],
        playerCount: 2,
        finalWinner: 0,
        roundsPlayed: 3,
        dailyMode: false,
      };
      
      replay.startPlayback(data);
      expect(replay.isPlaying).toBe(true);
    });

    it('should get ready actions', async () => {
      const replay = new Replay();
      const data: ReplayData = {
        version: 1,
        timestamp: Date.now(),
        duration: 1000,
        frames: [
          { time: 0, playerId: 0, action: 'move', direction: Direction.Up },
          { time: 10, playerId: 0, action: 'bomb' },
        ],
        playerCount: 2,
        finalWinner: 0,
        roundsPlayed: 3,
        dailyMode: false,
      };
      
      replay.startPlayback(data);
      
      const actions = replay.getReadyActions();
      expect(actions.length).toBeGreaterThanOrEqual(1);
      expect(actions[0].action).toBe('move');
    });

    it('should track playback progress', () => {
      const replay = new Replay();
      const data: ReplayData = {
        version: 1,
        timestamp: Date.now(),
        duration: 1000,
        frames: [
          { time: 0, playerId: 0, action: 'move', direction: Direction.Up },
          { time: 0, playerId: 0, action: 'bomb' },
        ],
        playerCount: 2,
        finalWinner: 0,
        roundsPlayed: 3,
        dailyMode: false,
      };
      
      replay.startPlayback(data);
      expect(replay.playbackProgress).toBe(0);
      
      replay.getReadyActions();
      expect(replay.playbackProgress).toBe(1);
      expect(replay.isPlaybackComplete).toBe(true);
    });

    it('should stop playback', () => {
      const replay = new Replay();
      const data: ReplayData = {
        version: 1,
        timestamp: Date.now(),
        duration: 1000,
        frames: [{ time: 0, playerId: 0, action: 'bomb' }],
        playerCount: 2,
        finalWinner: 0,
        roundsPlayed: 3,
        dailyMode: false,
      };
      
      replay.startPlayback(data);
      expect(replay.isPlaying).toBe(true);
      
      replay.stopPlayback();
      expect(replay.isPlaying).toBe(false);
    });
  });

  describe('encode/decode', () => {
    it('should encode and decode replay data', () => {
      const data: ReplayData = {
        version: 1,
        timestamp: 1234567890000,
        duration: 5000,
        frames: [
          { time: 0, playerId: 0, action: 'move', direction: Direction.Up },
          { time: 100, playerId: 1, action: 'bomb' },
          { time: 200, playerId: 0, action: 'move', direction: Direction.Left },
        ],
        playerCount: 2,
        finalWinner: 0,
        roundsPlayed: 3,
        dailyMode: true,
      };
      
      const encoded = Replay.encode(data);
      const decoded = Replay.decode(encoded);
      
      expect(decoded).not.toBeNull();
      expect(decoded!.version).toBe(1);
      expect(decoded!.timestamp).toBe(1234567890000);
      expect(decoded!.duration).toBe(5000);
      expect(decoded!.playerCount).toBe(2);
      expect(decoded!.finalWinner).toBe(0);
      expect(decoded!.roundsPlayed).toBe(3);
      expect(decoded!.dailyMode).toBe(true);
      expect(decoded!.frames.length).toBe(3);
    });

    it('should handle all directions', () => {
      const data: ReplayData = {
        version: 1,
        timestamp: 1000,
        duration: 500,
        frames: [
          { time: 0, playerId: 0, action: 'move', direction: Direction.Up },
          { time: 50, playerId: 0, action: 'move', direction: Direction.Down },
          { time: 100, playerId: 0, action: 'move', direction: Direction.Left },
          { time: 150, playerId: 0, action: 'move', direction: Direction.Right },
        ],
        playerCount: 2,
        finalWinner: 1,
        roundsPlayed: 2,
        dailyMode: false,
      };
      
      const decoded = Replay.decode(Replay.encode(data));
      
      expect(decoded!.frames[0].direction).toBe(Direction.Up);
      expect(decoded!.frames[1].direction).toBe(Direction.Down);
      expect(decoded!.frames[2].direction).toBe(Direction.Left);
      expect(decoded!.frames[3].direction).toBe(Direction.Right);
    });

    it('should handle null winner', () => {
      const data: ReplayData = {
        version: 1,
        timestamp: 1000,
        duration: 500,
        frames: [],
        playerCount: 2,
        finalWinner: null,
        roundsPlayed: 1,
        dailyMode: false,
      };
      
      const decoded = Replay.decode(Replay.encode(data));
      expect(decoded!.finalWinner).toBeNull();
    });

    it('should return null for invalid data', () => {
      expect(Replay.decode('invalid')).toBeNull();
      expect(Replay.decode('')).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should calculate action statistics', () => {
      const data: ReplayData = {
        version: 1,
        timestamp: 1000,
        duration: 10000,
        frames: [
          { time: 0, playerId: 0, action: 'move', direction: Direction.Up },
          { time: 100, playerId: 0, action: 'bomb' },
          { time: 200, playerId: 1, action: 'move', direction: Direction.Down },
          { time: 300, playerId: 1, action: 'move', direction: Direction.Left },
          { time: 400, playerId: 0, action: 'bomb' },
        ],
        playerCount: 2,
        finalWinner: 0,
        roundsPlayed: 3,
        dailyMode: false,
      };
      
      const stats = Replay.getStats(data);
      
      expect(stats.totalActions).toBe(5);
      expect(stats.moveCount).toBe(3);
      expect(stats.bombCount).toBe(2);
      expect(stats.playerActions.get(0)).toBe(3);
      expect(stats.playerActions.get(1)).toBe(2);
      expect(stats.durationSeconds).toBe(10);
    });
  });

  describe('generateShareCode', () => {
    it('should generate regular share code', () => {
      const data: ReplayData = {
        version: 1,
        timestamp: new Date('2026-03-06').getTime(),
        duration: 5000,
        frames: [],
        playerCount: 2,
        finalWinner: 0,
        roundsPlayed: 3,
        dailyMode: false,
      };
      
      const code = Replay.generateShareCode(data);
      expect(code).toBe('DETONATOR-20260306-P1-R3');
    });

    it('should generate daily share code', () => {
      const data: ReplayData = {
        version: 1,
        timestamp: new Date('2026-03-06').getTime(),
        duration: 5000,
        frames: [],
        playerCount: 2,
        finalWinner: null,
        roundsPlayed: 2,
        dailyMode: true,
      };
      
      const code = Replay.generateShareCode(data);
      expect(code).toBe('DETONATOR-D-20260306-DRAW-R2');
    });
  });
});
