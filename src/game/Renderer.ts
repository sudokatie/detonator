import { TileType, Direction, PowerUpType, PowerUpData } from './types';
import { Arena } from './Arena';
import { Player } from './Player';
import { Bomb, Explosion, BombManager } from './Bomb';
import {
  TILE_SIZE,
  CANVAS_SCALE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLORS,
} from './constants';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private animFrame: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.animFrame = 0;
  }

  clear(): void {
    this.ctx.fillStyle = COLORS.background;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  drawArena(arena: Arena): void {
    const grid = arena.getGrid();
    
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        this.drawTile(x, y, grid[y][x]);
      }
    }
  }

  private drawTile(x: number, y: number, type: TileType): void {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;

    switch (type) {
      case TileType.Floor:
        this.ctx.fillStyle = COLORS.floor;
        this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        break;

      case TileType.HardWall:
        this.drawHardWall(px, py);
        break;

      case TileType.SoftBlock:
        this.drawSoftBlock(px, py);
        break;

      case TileType.PowerUp:
        this.ctx.fillStyle = COLORS.floor;
        this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        break;

      default:
        this.ctx.fillStyle = COLORS.floor;
        this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    }
  }

  private drawHardWall(px: number, py: number): void {
    // Base color
    this.ctx.fillStyle = COLORS.hardWall;
    this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    
    // Light edge (top and left)
    this.ctx.fillStyle = COLORS.hardWallLight;
    this.ctx.fillRect(px, py, TILE_SIZE, 2);
    this.ctx.fillRect(px, py, 2, TILE_SIZE);
    
    // Dark edge (bottom and right)
    this.ctx.fillStyle = '#3a3a5a';
    this.ctx.fillRect(px, py + TILE_SIZE - 2, TILE_SIZE, 2);
    this.ctx.fillRect(px + TILE_SIZE - 2, py, 2, TILE_SIZE);
  }

  private drawSoftBlock(px: number, py: number): void {
    // Base color
    this.ctx.fillStyle = COLORS.softBlock;
    this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    
    // Brick pattern
    this.ctx.fillStyle = COLORS.softBlockDark;
    const brickH = TILE_SIZE / 2;
    this.ctx.fillRect(px, py + brickH - 1, TILE_SIZE, 2);
    this.ctx.fillRect(px + TILE_SIZE / 2 - 1, py, 2, brickH);
    this.ctx.fillRect(px, py + brickH, 2, brickH);
    this.ctx.fillRect(px + TILE_SIZE - 2, py + brickH, 2, brickH);
  }

  drawPlayers(players: Player[]): void {
    for (const player of players) {
      if (player.isAlive()) {
        this.drawPlayer(player);
      }
    }
  }

  private drawPlayer(player: Player): void {
    const pos = player.position;
    const px = pos.x * TILE_SIZE;
    const py = pos.y * TILE_SIZE;
    const size = TILE_SIZE - 4;
    const offset = 2;

    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.ellipse(px + TILE_SIZE / 2 + 2, py + TILE_SIZE - 4, size / 2.5, 4, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Body
    this.ctx.fillStyle = player.color;
    this.ctx.fillRect(px + offset, py + offset, size, size);
    
    // Inner highlight
    this.ctx.fillStyle = this.lightenColor(player.color);
    this.ctx.fillRect(px + offset + 2, py + offset + 2, size / 3, size / 3);

    // Eyes based on direction
    this.drawPlayerEyes(px, py, player.direction);
  }

  private drawPlayerEyes(px: number, py: number, direction: Direction): void {
    const eyeSize = 4;
    const eyeY = py + 10;
    let leftEyeX = px + 8;
    let rightEyeX = px + 20;

    // Offset eyes based on direction
    if (direction === Direction.Left) {
      leftEyeX -= 2;
      rightEyeX -= 2;
    } else if (direction === Direction.Right) {
      leftEyeX += 2;
      rightEyeX += 2;
    }

    // White of eyes
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(leftEyeX, eyeY, eyeSize, eyeSize);
    this.ctx.fillRect(rightEyeX, eyeY, eyeSize, eyeSize);

    // Pupils
    this.ctx.fillStyle = '#000000';
    let pupilOffsetX = 0;
    let pupilOffsetY = 0;
    
    switch (direction) {
      case Direction.Up:
        pupilOffsetY = -1;
        break;
      case Direction.Down:
        pupilOffsetY = 1;
        break;
      case Direction.Left:
        pupilOffsetX = -1;
        break;
      case Direction.Right:
        pupilOffsetX = 1;
        break;
    }

    this.ctx.fillRect(leftEyeX + 1 + pupilOffsetX, eyeY + 1 + pupilOffsetY, 2, 2);
    this.ctx.fillRect(rightEyeX + 1 + pupilOffsetX, eyeY + 1 + pupilOffsetY, 2, 2);
  }

  drawBombs(bombManager: BombManager): void {
    for (const bomb of bombManager.bombs) {
      this.drawBomb(bomb);
    }
  }

  private drawBomb(bomb: Bomb): void {
    const pos = bomb.position;
    const px = pos.x * TILE_SIZE + TILE_SIZE / 2;
    const py = pos.y * TILE_SIZE + TILE_SIZE / 2;
    
    // Pulsing size based on remaining time
    const pulse = Math.sin(bomb.getTimeRemaining() * 10) * 2;
    const radius = 10 + pulse;

    // Bomb body
    this.ctx.fillStyle = COLORS.bomb;
    this.ctx.beginPath();
    this.ctx.arc(px, py, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Highlight
    this.ctx.fillStyle = '#333333';
    this.ctx.beginPath();
    this.ctx.arc(px - 3, py - 3, radius * 0.3, 0, Math.PI * 2);
    this.ctx.fill();

    // Fuse
    this.ctx.strokeStyle = COLORS.bombFuse;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(px + radius - 3, py - radius + 3);
    this.ctx.lineTo(px + radius + 4, py - radius - 4);
    this.ctx.stroke();

    // Fuse spark (animated)
    if (Math.sin(this.animFrame * 0.5) > 0) {
      this.ctx.fillStyle = '#ffff00';
      this.ctx.beginPath();
      this.ctx.arc(px + radius + 4, py - radius - 4, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawExplosions(bombManager: BombManager): void {
    for (const explosion of bombManager.explosions) {
      this.drawExplosion(explosion);
    }
  }

  private drawExplosion(explosion: Explosion): void {
    const tiles = explosion.tiles;
    const center = explosion.center;

    for (const tile of tiles) {
      const px = tile.x * TILE_SIZE;
      const py = tile.y * TILE_SIZE;
      const isCenter = tile.x === center.x && tile.y === center.y;

      // Gradient from center
      const gradient = this.ctx.createRadialGradient(
        px + TILE_SIZE / 2, py + TILE_SIZE / 2, 0,
        px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE / 2
      );
      
      if (isCenter) {
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.4, COLORS.explosionCenter);
        gradient.addColorStop(1, COLORS.explosionOuter);
      } else {
        gradient.addColorStop(0, COLORS.explosionCenter);
        gradient.addColorStop(1, COLORS.explosionOuter);
      }

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    }
  }

  drawPowerUps(powerUps: PowerUpData[]): void {
    for (const pu of powerUps) {
      this.drawPowerUp(pu);
    }
  }

  private drawPowerUp(powerUp: PowerUpData): void {
    const px = powerUp.position.x * TILE_SIZE;
    const py = powerUp.position.y * TILE_SIZE;
    const bounce = Math.sin(this.animFrame * 0.1) * 2;

    let color: string;
    let symbol: string;

    switch (powerUp.type) {
      case PowerUpType.BombUp:
        color = COLORS.powerUpBomb;
        symbol = 'B';
        break;
      case PowerUpType.FireUp:
        color = COLORS.powerUpFire;
        symbol = 'F';
        break;
      case PowerUpType.SpeedUp:
        color = COLORS.powerUpSpeed;
        symbol = 'S';
        break;
      default:
        color = '#ffffff';
        symbol = '?';
    }

    // Background
    this.ctx.fillStyle = color;
    this.ctx.fillRect(px + 4, py + 4 + bounce, TILE_SIZE - 8, TILE_SIZE - 8);

    // Border
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(px + 4, py + 4 + bounce, TILE_SIZE - 8, TILE_SIZE - 8);

    // Symbol
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(symbol, px + TILE_SIZE / 2, py + TILE_SIZE / 2 + bounce);
  }

  drawHUD(players: Player[], timer: number): void {
    // Timer
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    const minutes = Math.floor(timer / 60);
    const seconds = Math.floor(timer % 60);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    this.ctx.fillText(timeStr, CANVAS_WIDTH / 2, 5);

    // Player stats (bottom of screen)
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';
    
    const statsY = CANVAS_HEIGHT - 18;
    const playerWidth = CANVAS_WIDTH / players.length;
    
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const x = i * playerWidth + 5;
      
      // Player color indicator
      this.ctx.fillStyle = player.color;
      this.ctx.fillRect(x, statsY, 8, 8);
      
      // Alive/dead indicator
      if (!player.isAlive()) {
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, statsY);
        this.ctx.lineTo(x + 8, statsY + 8);
        this.ctx.moveTo(x + 8, statsY);
        this.ctx.lineTo(x, statsY + 8);
        this.ctx.stroke();
      }
      
      // Stats text: P1 B:2 F:3 W:1
      this.ctx.fillStyle = '#ffffff';
      const stats = player.stats;
      const text = `P${i + 1} B:${stats.bombs} F:${stats.fire} W:${stats.wins}`;
      this.ctx.fillText(text, x + 12, statsY + 7);
    }
  }

  update(): void {
    this.animFrame++;
  }

  private lightenColor(color: string): string {
    // Simple color lightening
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    const lighten = (c: number) => Math.min(255, c + 60);
    
    return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
  }
}
