import { render, screen, fireEvent } from '@testing-library/react';
import RoomView from '../RoomView';
import type { RoomState } from '../../game/Multiplayer';

describe('RoomView', () => {
  const createRoom = (overrides?: Partial<RoomState>): RoomState => ({
    code: 'ABCD',
    hostId: 'player1',
    players: [
      { id: 'player1', name: 'Host', ready: true, slot: 0, connected: true },
      { id: 'player2', name: 'Guest', ready: false, slot: 1, connected: true },
    ],
    state: 'lobby',
    ...overrides,
  });

  const defaultProps = {
    room: createRoom(),
    playerId: 'player1',
    isHost: true,
    onReady: jest.fn(),
    onStart: jest.fn(),
    onLeave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('room code display', () => {
    it('should display room code', () => {
      render(<RoomView {...defaultProps} />);
      expect(screen.getByText('ABCD')).toBeInTheDocument();
    });

    it('should copy room code to clipboard on click', async () => {
      const writeText = jest.fn();
      Object.assign(navigator, {
        clipboard: { writeText },
      });

      render(<RoomView {...defaultProps} />);
      fireEvent.click(screen.getByText('ABCD'));
      expect(writeText).toHaveBeenCalledWith('ABCD');
    });
  });

  describe('player list', () => {
    it('should display player count', () => {
      render(<RoomView {...defaultProps} />);
      expect(screen.getByText('Players (2/4)')).toBeInTheDocument();
    });

    it('should display player names', () => {
      render(<RoomView {...defaultProps} />);
      expect(screen.getByText('Host')).toBeInTheDocument();
      expect(screen.getByText('Guest')).toBeInTheDocument();
    });

    it('should mark host with HOST badge', () => {
      render(<RoomView {...defaultProps} />);
      expect(screen.getByText('HOST')).toBeInTheDocument();
    });

    it('should mark current player with YOU badge', () => {
      render(<RoomView {...defaultProps} />);
      expect(screen.getByText('YOU')).toBeInTheDocument();
    });

    it('should show ready status for each player', () => {
      render(<RoomView {...defaultProps} />);
      const readyTexts = screen.getAllByText('Ready');
      const notReadyTexts = screen.getAllByText('Not Ready');
      expect(readyTexts).toHaveLength(1);
      expect(notReadyTexts).toHaveLength(1);
    });

    it('should show empty slots as waiting', () => {
      render(<RoomView {...defaultProps} />);
      const waitingSlots = screen.getAllByText('Waiting...');
      expect(waitingSlots).toHaveLength(2); // Slots 2 and 3
    });
  });

  describe('ready button', () => {
    it('should show Ready Up when not ready', () => {
      render(<RoomView {...defaultProps} room={createRoom({
        players: [
          { id: 'player1', name: 'Host', ready: false, slot: 0, connected: true },
        ],
      })} />);
      expect(screen.getByText('Ready Up')).toBeInTheDocument();
    });

    it('should show Cancel Ready when ready', () => {
      render(<RoomView {...defaultProps} />);
      expect(screen.getByText('Cancel Ready')).toBeInTheDocument();
    });

    it('should call onReady when clicked', () => {
      render(<RoomView {...defaultProps} />);
      fireEvent.click(screen.getByText('Cancel Ready'));
      expect(defaultProps.onReady).toHaveBeenCalled();
    });
  });

  describe('start button', () => {
    it('should show start button for host', () => {
      render(<RoomView {...defaultProps} />);
      expect(screen.getByText(/Start Game|Waiting for players/)).toBeInTheDocument();
    });

    it('should not show start button for non-host', () => {
      render(<RoomView {...defaultProps} isHost={false} playerId="player2" />);
      expect(screen.queryByText(/Start Game|Waiting for players/)).not.toBeInTheDocument();
    });

    it('should disable start when not enough ready players', () => {
      render(<RoomView {...defaultProps} room={createRoom({
        players: [
          { id: 'player1', name: 'Host', ready: true, slot: 0, connected: true },
        ],
      })} />);
      expect(screen.getByText(/Waiting for players \(1\/2 ready\)/)).toBeInTheDocument();
    });

    it('should enable start when 2+ players ready', () => {
      render(<RoomView {...defaultProps} room={createRoom({
        players: [
          { id: 'player1', name: 'Host', ready: true, slot: 0, connected: true },
          { id: 'player2', name: 'Guest', ready: true, slot: 1, connected: true },
        ],
      })} />);
      expect(screen.getByText('Start Game')).toBeEnabled();
    });

    it('should call onStart when clicked', () => {
      render(<RoomView {...defaultProps} room={createRoom({
        players: [
          { id: 'player1', name: 'Host', ready: true, slot: 0, connected: true },
          { id: 'player2', name: 'Guest', ready: true, slot: 1, connected: true },
        ],
      })} />);
      fireEvent.click(screen.getByText('Start Game'));
      expect(defaultProps.onStart).toHaveBeenCalled();
    });
  });

  describe('leave button', () => {
    it('should display leave button', () => {
      render(<RoomView {...defaultProps} />);
      expect(screen.getByText('Leave Room')).toBeInTheDocument();
    });

    it('should call onLeave when clicked', () => {
      render(<RoomView {...defaultProps} />);
      fireEvent.click(screen.getByText('Leave Room'));
      expect(defaultProps.onLeave).toHaveBeenCalled();
    });
  });
});
