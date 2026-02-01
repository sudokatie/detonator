# Detonator

A local multiplayer Bomberman-style arena game. Drop bombs, collect power-ups, and be the last one standing.

## Features

- 2-4 player local multiplayer
- Classic arena with destructible blocks
- Power-ups: extra bombs, longer flames, faster movement
- Chain reaction explosions
- Best-of-3 match format

## Controls

| Player | Move | Bomb |
|--------|------|------|
| P1 (Green) | WASD | Space |
| P2 (Red) | Arrow Keys | Enter |
| P3 (Blue) | IJKL | B |
| P4 (Yellow) | Numpad 8456 | Numpad 0 |

**ESC** - Pause game

## How to Play

1. Select number of players (2-4)
2. Navigate the arena and destroy soft blocks
3. Collect power-ups to gain advantages
4. Trap opponents in your explosions
5. Last player alive wins the round
6. First to 3 round wins takes the match

## Power-Ups

- **B** (Blue) - Extra bomb capacity
- **F** (Red) - Longer explosion range
- **S** (Yellow) - Faster movement speed

## Development

```bash
npm install
npm run dev     # Start dev server
npm test        # Run tests
npm run build   # Production build
```

## Tech Stack

- Next.js 14 with TypeScript
- Canvas 2D rendering
- Jest for testing

## License

MIT
