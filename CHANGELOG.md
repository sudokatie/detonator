# Changelog

## [0.1.2] - 2026-02-01

### Fixed
- Round winner now correctly displayed (was always showing "DRAW")
- Added onRoundEnd callback to communicate winner from Game to UI

### Added
- Explosion 3-phase animation (expand, full, fade) per spec
- Explosion class now has progress, phase, scale, opacity getters
- 10 new explosion animation tests

### Changed
- Renderer now scales and fades explosions based on phase
- Total tests: 201

## [0.1.1] - 2026-02-01

### Added
- Walk animation (4 frames, 100ms each) - players bob while moving
- Death animation (shrink + fade, 300ms) - visual feedback when killed
- 13 new animation tests

### Changed
- Player class now tracks animation state (walkFrame, deathTimer)
- Renderer draws death animation for recently killed players

## [0.1.0] - 2026-02-01

### Added
- Initial release
- 2-4 player local multiplayer
- 13x11 arena with standard layout
- Bomb placement and chain reactions
- Three power-up types (BombUp, FireUp, SpeedUp)
- Power-up lifetime and explosion destruction
- Round-based scoring (best of 3)
- Pause menu with ESC
- Canvas rendering with animations
- Full keyboard controls for 4 players
