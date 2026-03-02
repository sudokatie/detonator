import { render, screen, fireEvent } from '@testing-library/react';
import LobbyMenu from '../LobbyMenu';

describe('LobbyMenu', () => {
  const defaultProps = {
    onCreateRoom: jest.fn(),
    onJoinRoom: jest.fn(),
    onBack: jest.fn(),
    connectionState: 'connected' as const,
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render title and connection status', () => {
      render(<LobbyMenu {...defaultProps} />);
      expect(screen.getByText('DETONATOR')).toBeInTheDocument();
      expect(screen.getByText('Online Multiplayer')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should show connecting status', () => {
      render(<LobbyMenu {...defaultProps} connectionState="connecting" />);
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('should show disconnected status', () => {
      render(<LobbyMenu {...defaultProps} connectionState="disconnected" />);
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    it('should display error message', () => {
      render(<LobbyMenu {...defaultProps} error="Room not found" />);
      expect(screen.getByText('Room not found')).toBeInTheDocument();
    });
  });

  describe('name input', () => {
    it('should allow entering name', () => {
      render(<LobbyMenu {...defaultProps} />);
      const input = screen.getByPlaceholderText('Enter name (2-16 chars)');
      fireEvent.change(input, { target: { value: 'Player1' } });
      expect(input).toHaveValue('Player1');
    });

    it('should limit name to 16 characters', () => {
      render(<LobbyMenu {...defaultProps} />);
      const input = screen.getByPlaceholderText('Enter name (2-16 chars)');
      fireEvent.change(input, { target: { value: 'ThisNameIsTooLongForTheGame' } });
      expect(input).toHaveValue('ThisNameIsTooLon');
    });
  });

  describe('create room flow', () => {
    it('should show create room button initially', () => {
      render(<LobbyMenu {...defaultProps} />);
      expect(screen.getByText('Create Room')).toBeInTheDocument();
    });

    it('should disable create button when disconnected', () => {
      render(<LobbyMenu {...defaultProps} connectionState="disconnected" />);
      const input = screen.getByPlaceholderText('Enter name (2-16 chars)');
      fireEvent.change(input, { target: { value: 'Player1' } });
      expect(screen.getByText('Create Room')).toBeDisabled();
    });

    it('should disable create button when name too short', () => {
      render(<LobbyMenu {...defaultProps} />);
      const input = screen.getByPlaceholderText('Enter name (2-16 chars)');
      fireEvent.change(input, { target: { value: 'A' } });
      expect(screen.getByText('Create Room')).toBeDisabled();
    });

    it('should call onCreateRoom when creating room', () => {
      render(<LobbyMenu {...defaultProps} />);
      const input = screen.getByPlaceholderText('Enter name (2-16 chars)');
      fireEvent.change(input, { target: { value: 'Player1' } });
      fireEvent.click(screen.getByText('Create Room'));
      // Now in create mode, click again to actually create
      fireEvent.click(screen.getByText('Create Room'));
      expect(defaultProps.onCreateRoom).toHaveBeenCalledWith('Player1');
    });
  });

  describe('join room flow', () => {
    it('should show join room button initially', () => {
      render(<LobbyMenu {...defaultProps} />);
      expect(screen.getByText('Join Room')).toBeInTheDocument();
    });

    it('should show room code input after clicking join', () => {
      render(<LobbyMenu {...defaultProps} />);
      const input = screen.getByPlaceholderText('Enter name (2-16 chars)');
      fireEvent.change(input, { target: { value: 'Player1' } });
      fireEvent.click(screen.getByText('Join Room'));
      expect(screen.getByPlaceholderText('XXXX')).toBeInTheDocument();
    });

    it('should uppercase room code', () => {
      render(<LobbyMenu {...defaultProps} />);
      const nameInput = screen.getByPlaceholderText('Enter name (2-16 chars)');
      fireEvent.change(nameInput, { target: { value: 'Player1' } });
      fireEvent.click(screen.getByText('Join Room'));
      const codeInput = screen.getByPlaceholderText('XXXX');
      fireEvent.change(codeInput, { target: { value: 'abcd' } });
      expect(codeInput).toHaveValue('ABCD');
    });

    it('should call onJoinRoom with correct values', () => {
      render(<LobbyMenu {...defaultProps} />);
      const nameInput = screen.getByPlaceholderText('Enter name (2-16 chars)');
      fireEvent.change(nameInput, { target: { value: 'Player1' } });
      fireEvent.click(screen.getByText('Join Room'));
      const codeInput = screen.getByPlaceholderText('XXXX');
      fireEvent.change(codeInput, { target: { value: 'ABCD' } });
      fireEvent.click(screen.getByText('Join Room'));
      expect(defaultProps.onJoinRoom).toHaveBeenCalledWith('Player1', 'ABCD');
    });

    it('should disable join button when code incomplete', () => {
      render(<LobbyMenu {...defaultProps} />);
      const nameInput = screen.getByPlaceholderText('Enter name (2-16 chars)');
      fireEvent.change(nameInput, { target: { value: 'Player1' } });
      fireEvent.click(screen.getByText('Join Room'));
      const codeInput = screen.getByPlaceholderText('XXXX');
      fireEvent.change(codeInput, { target: { value: 'AB' } });
      expect(screen.getByText('Join Room')).toBeDisabled();
    });
  });

  describe('navigation', () => {
    it('should call onBack when back button clicked', () => {
      render(<LobbyMenu {...defaultProps} />);
      fireEvent.click(screen.getByText('Back to Main Menu'));
      expect(defaultProps.onBack).toHaveBeenCalled();
    });

    it('should return to select mode when back clicked in create mode', () => {
      render(<LobbyMenu {...defaultProps} />);
      const nameInput = screen.getByPlaceholderText('Enter name (2-16 chars)');
      fireEvent.change(nameInput, { target: { value: 'Player1' } });
      fireEvent.click(screen.getByText('Create Room'));
      fireEvent.click(screen.getByText('Back'));
      // Should now see both Create and Join buttons
      expect(screen.getAllByText('Create Room')).toHaveLength(1);
      expect(screen.getByText('Join Room')).toBeInTheDocument();
    });
  });
});
