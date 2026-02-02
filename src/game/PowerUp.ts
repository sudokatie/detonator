import { Position, PowerUpType } from './types';
import { POWERUP_LIFETIME } from './constants';

export class PowerUp {
  private _position: Position;
  private _type: PowerUpType;
  private _timer: number;

  constructor(position: Position, type: PowerUpType) {
    this._position = { ...position };
    this._type = type;
    this._timer = POWERUP_LIFETIME;
  }

  get position(): Position {
    return { ...this._position };
  }

  get type(): PowerUpType {
    return this._type;
  }

  get timer(): number {
    return this._timer;
  }

  update(dt: number): boolean {
    this._timer -= dt;
    return this._timer <= 0;
  }

  getTimeRemaining(): number {
    return Math.max(0, this._timer);
  }

  isExpired(): boolean {
    return this._timer <= 0;
  }
}

export class PowerUpManager {
  private _powerUps: PowerUp[];

  constructor() {
    this._powerUps = [];
  }

  get powerUps(): PowerUp[] {
    return [...this._powerUps];
  }

  spawn(position: Position, type: PowerUpType): void {
    // Don't spawn if one already exists at this position
    if (this.getPowerUpAt(position)) {
      return;
    }
    this._powerUps.push(new PowerUp(position, type));
  }

  update(dt: number): Position[] {
    const expired: Position[] = [];
    const remaining: PowerUp[] = [];

    for (const powerUp of this._powerUps) {
      if (powerUp.update(dt)) {
        expired.push(powerUp.position);
      } else {
        remaining.push(powerUp);
      }
    }

    this._powerUps = remaining;
    return expired;
  }

  getPowerUpAt(position: Position): PowerUp | null {
    return this._powerUps.find(
      p => p.position.x === position.x && p.position.y === position.y
    ) || null;
  }

  collect(position: Position): PowerUpType | null {
    const index = this._powerUps.findIndex(
      p => p.position.x === position.x && p.position.y === position.y
    );

    if (index === -1) {
      return null;
    }

    const powerUp = this._powerUps[index];
    this._powerUps.splice(index, 1);
    return powerUp.type;
  }

  removeAt(position: Position): boolean {
    const index = this._powerUps.findIndex(
      p => p.position.x === position.x && p.position.y === position.y
    );

    if (index === -1) {
      return false;
    }

    this._powerUps.splice(index, 1);
    return true;
  }

  clear(): void {
    this._powerUps = [];
  }

  getCount(): number {
    return this._powerUps.length;
  }
}
