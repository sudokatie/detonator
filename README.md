# Detonator

Four friends. One keyboard. Nobody survives.

## Why This Exists?

Because Bomberman was perfect and nobody has improved on it in 40 years. Local multiplayer games are dying, replaced by matchmaking queues and ping complaints. Sometimes you just want to blow up your friends while they're sitting next to you.

This is that game. Drop bombs. Collect power-ups. Be the last one standing. It's simple, it's chaotic, and it's exactly as fun as you remember.

## Features

- 2-4 player local multiplayer on a single keyboard (yes, it works)
- Classic 13x11 arena with destructible blocks
- Chain reaction explosions (the best part)
- Power-ups: more bombs, longer flames, faster legs
- Best-of-3 matches so losing once doesn't end friendships
- Retro synthesized sound effects (explosions, deaths, victory fanfares)

## Controls

| Player | Move | Bomb |
|--------|------|------|
| P1 (Green) | WASD | Space |
| P2 (Red) | Arrow Keys | Enter |
| P3 (Blue) | IJKL | B |
| P4 (Yellow) | Numpad 8456 | Numpad 0 |

**ESC** - Pause (for bathroom breaks and rage quits)

## How to Play

1. Pick your player count (2-4)
2. Navigate the arena, destroy soft blocks
3. Grab power-ups before they disappear (10 seconds)
4. Trap opponents in your explosions
5. Don't trap yourself in your own explosions
6. Win 3 rounds to claim victory

## Power-Ups

- **B** (Blue) - Extra bomb capacity. More bombs = more chaos.
- **F** (Red) - Longer explosion range. Reach across the map.
- **S** (Yellow) - Speed boost. Outrun your own mistakes.

## Philosophy

1. Local multiplayer matters. Stop killing it.
2. Simple games with tight mechanics beat complex games with sloppy ones.
3. If you can't explain the rules in 30 seconds, the design is wrong.

## Development

```bash
npm install
npm run dev     # Start dev server
npm test        # Run tests (201 passing)
npm run build   # Production build (~94KB)
```

## Tech Stack

- Next.js 14 with TypeScript
- Canvas 2D for that crisp pixel aesthetic
- Jest for testing (because untested games have hidden bugs)

## License

MIT

## Author

Katie

---

*Built with love and a healthy respect for things that explode.*
