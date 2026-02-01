import { Renderer } from '../game/Renderer';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants';

// Mock canvas context
const createMockContext = () => ({
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  font: '',
  textAlign: '',
  textBaseline: '',
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  fillText: jest.fn(),
  beginPath: jest.fn(),
  arc: jest.fn(),
  ellipse: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
});

const createMockCanvas = () => {
  const ctx = createMockContext();
  return {
    canvas: {
      width: 0,
      height: 0,
      getContext: jest.fn(() => ctx),
    },
    ctx,
  };
};

describe('Renderer', () => {
  let renderer: Renderer;
  let mockCanvas: ReturnType<typeof createMockCanvas>;

  beforeEach(() => {
    mockCanvas = createMockCanvas();
    renderer = new Renderer(mockCanvas.canvas as unknown as HTMLCanvasElement);
  });

  describe('constructor', () => {
    it('should set canvas dimensions', () => {
      expect(mockCanvas.canvas.width).toBe(CANVAS_WIDTH);
      expect(mockCanvas.canvas.height).toBe(CANVAS_HEIGHT);
    });

    it('should get 2d context', () => {
      expect(mockCanvas.canvas.getContext).toHaveBeenCalledWith('2d');
    });
  });

  describe('clear', () => {
    it('should fill canvas with background color', () => {
      renderer.clear();
      expect(mockCanvas.ctx.fillRect).toHaveBeenCalledWith(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    });
  });

  describe('update', () => {
    it('should not throw', () => {
      expect(() => renderer.update()).not.toThrow();
    });
  });
});
