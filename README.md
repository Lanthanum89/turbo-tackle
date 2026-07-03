# Turbo Dash

*(Formerly "Turbo Tackle" — renamed once the game grew beyond a single dodge mechanic. Still hosted at the `/turbo-tackle/` URL below for continuity.)*

A pixel-art racer for young kids with three selectable modes: **Dodge** (just avoid the rocks), **Collect & Avoid** (grab stars, dodge rocks), and **Rainbow Rocket** (follow a rainbow lane that drifts between lanes, no fail state). Built as an installable PWA, no build step required.

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

Live and playable, with three modes (Dodge, Collect & Avoid, Rainbow Rocket), each with its own difficulty select (easy/normal/hard) and independent high score, pixel-art car/star/rock sprites, and a mobile/tablet-aware layout.
