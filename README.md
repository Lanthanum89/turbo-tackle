# Turbo Tackle 🏎️

A pixel-art racer for young kids: dodge the footballs, don't lose all your lives. Built as an installable PWA, no build step required.

**Play it:** https://lanthanum89.github.io/turbo-tackle/

## Controls

- **Keyboard:** Arrow keys or `A` / `D` to switch lanes
- **Touch:** Swipe left/right, or tap the on-screen arrow buttons

## Tech stack

- Vanilla HTML/CSS/JS, ES modules — no framework, no build step
- Canvas-based rendering with hand-pixeled sprites (`js/sprites.js`)
- PWA manifest + service worker for offline/installable play
- `localStorage` for the high score
- Node.js is dev tooling only, used for local preview (`npx serve`), not a runtime dependency

## Running locally

```
npx serve .
```

Then open the printed local URL in a browser.

## Project structure

- `index.html`, `style.css` — page shell and styling
- `js/app.js` — UI wiring (screens, controls, service worker registration)
- `js/game.js` — game loop, physics, collisions, rendering
- `js/sprites.js` — pixel-art sprite data and the sprite renderer
- `js/storage.js` — high score persistence
- `manifest.json`, `sw.js`, `icons/` — PWA support

## Status

Live and playable, with difficulty select (easy/normal/hard), pixel-art car and football sprites, and a mobile/tablet-aware layout. Still open: tuned difficulty pacing for younger kids, sound, and a decision on endless-dodge vs. discrete levels.
