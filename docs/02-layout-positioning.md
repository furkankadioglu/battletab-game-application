# KUST 10 - Pillows: Complete UI Layout & Positioning Reference

This document describes every UI element's position, size, alignment, spacing, z-index, and responsive behavior across all screens. Values are extracted directly from source code.

---

## Table of Contents

1. [Global Architecture & DOM Hierarchy](#1-global-architecture--dom-hierarchy)
2. [Auth Screen (React)](#2-auth-screen-react)
3. [Main Menu (React)](#3-main-menu-react)
4. [In-Game HUD (React overlay on Phaser)](#4-in-game-hud-react-overlay-on-phaser)
5. [Building Bar (React)](#5-building-bar-react)
6. [Ability Bar (Phaser)](#6-ability-bar-phaser)
7. [Camera System (Phaser)](#7-camera-system-phaser)
8. [Map Renderer (Phaser)](#8-map-renderer-phaser)
9. [Army Renderer (Phaser)](#9-army-renderer-phaser)
10. [Selection System (Phaser)](#10-selection-system-phaser)
11. [Gate Renderer (Phaser)](#11-gate-renderer-phaser)
12. [Siege Renderer (Phaser)](#12-siege-renderer-phaser)
13. [Toast Manager (Phaser - legacy)](#13-toast-manager-phaser---legacy)
14. [Lobby Scene (Phaser)](#14-lobby-scene-phaser)
15. [Friends Scene (Phaser)](#15-friends-scene-phaser)
16. [Tutorial Scene (Phaser)](#16-tutorial-scene-phaser)
17. [Game Over Scene (Phaser)](#17-game-over-scene-phaser)
18. [Boot Scene (Phaser)](#18-boot-scene-phaser)
19. [Auth Scene (Phaser - legacy fallback)](#19-auth-scene-phaser---legacy-fallback)
20. [Menu Scene (Phaser - legacy fallback)](#20-menu-scene-phaser---legacy-fallback)

---

## 1. Global Architecture & DOM Hierarchy

### HTML Structure (`client/index.html`)

```
<body> (background: #06060e, overflow: hidden, 100vw x 100dvh)
  |
  +-- <canvas id="bg-canvas">
  |     position: fixed, inset: 0, z-index: 0
  |     transform: perspective(1500px) rotateX(5deg) scale(1.08)
  |     transform-origin: center 55%
  |     Used for: animated battle background behind auth/menu
  |
  +-- <div id="auth-root">
  |     position: fixed, inset: 0, z-index: 9999
  |     Used for: React AuthApp.jsx
  |
  +-- <div id="menu-root">
  |     position: fixed, inset: 0, z-index: 100
  |     Used for: React MenuApp.jsx
  |
  +-- <div id="game"> (display: none until game starts)
        position: relative, 100vw x 100dvh
        touch-action: none, overscroll-behavior: none
        |
        +-- Phaser <canvas> (injected by Phaser.Game, touch-action: none)
        |
        +-- <div id="game-ui-root">
              position: absolute, inset: 0, z-index: 10
              pointer-events: none, touch-action: none, overflow: hidden
              Used for: React GameHUD.jsx overlay on top of Phaser
```

### Phaser Configuration

```js
{
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#134e6f',
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  dom: { createContainer: true },
  input: { activePointers: 3, mouse: { preventDefaultWheel: true }, touch: { capture: true } },
  render: { antialias: true, pixelArt: false, transparent: false },
  resolution: 1
}
```

### Screen Flow

```
init() -> isLoggedIn? -> showMenu() : showAuth()
showAuth() -> #auth-root (React AuthApp) -> success -> showMenu()
showMenu() -> #menu-root (React MenuApp) -> onStartGame -> startPhaser(gameData)
startPhaser() -> hide menu-root, show #game -> Phaser.Game + React GameHUD
__kustReturnToMenu() -> destroy Phaser, show menu-root -> showMenu()
```

### Responsive Breakpoints (used everywhere via `pick()` utility)

```
Mobile:  width < 768px
Tablet:  768px <= width < 1200px
Desktop: width >= 1200px
Compact: height < ~500px (landscape mobile, detected by isCompactHeight())
```

### Font Stacks

- Primary: `'Inter', sans-serif` (body text, UI labels)
- Display: `'Cinzel', serif` (titles, buttons, timer)
- Code: `'Courier New', monospace` (player codes)
- Fallback (Phaser scenes): `'Arial', sans-serif`

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Gold/Primary | `#c8a84e` | Logo, titles, accents, borders |
| Dark BG | `rgba(6,6,14,0.82-0.95)` | Panel backgrounds |
| Text Primary | `#d0d0e0` | Body text |
| Error/Red | `#d94a4a` | Errors, quit, elimination |
| Success/Green | `#4ad94a` | Success, spawn selection |
| Blue | `#4A90D9` / `#3b82f6` | Links, online mode |
| Iron resource | `#aabbcc` | Iron display |
| Crystal resource | `#cc88ff` | Crystal display |
| Uranium resource | `#44ff88` | Uranium display |
| FPS indicator | `#44ff44` | FPS counter |
| Ping indicator | `#ffaa44` | Ping counter |

---

## 2. Auth Screen (React)

**File:** `client/src/auth/AuthApp.jsx` + `client/src/auth/auth.css`
**Mount:** `#auth-root` (position: fixed, inset: 0, z-index: 9999)
**Background:** `<canvas id="bg-canvas">` with `BattleCanvas.js` animation underneath

### Container

```css
.auth-container {
  position: fixed; inset: 0;
  background: transparent;
  z-index: 9999;
  font-family: 'Inter', sans-serif;
}
```

### Overlay (positions the panel)

```css
.auth-overlay {
  position: absolute; inset: 0; z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;     /* Panel on the RIGHT side on desktop */
  padding: 40px 60px;
  overflow-y: auto;
  animation: authFadeIn 0.8s ease-out;
}
```

### Auth Panel

```css
.auth-panel {
  width: 400px; max-width: 100%;
  background: rgba(8, 8, 20, 0.92);
  border: 1px solid rgba(200, 168, 78, 0.25);
  border-radius: 2px;
  padding: 36px 32px;
  position: relative;
  /* Ornamental corners via ::before (top-left) and ::after (bottom-right) */
  /* 24x24 corner decorations, 2px border, positioned 6px from edges */
}
```

### Logo

```css
.auth-logo { text-align: center; margin-bottom: 28px; }
.auth-logo-img { height: 80px; width: auto; filter: drop-shadow(0 0 20px rgba(200,168,78,0.4)); }
```

### Language Selector

```css
.auth-lang-row { display: flex; justify-content: center; margin-bottom: 16px; }
.auth-lang-select { padding: 6px 12px; font-size: 12px; }
```

### Tabs (Login/Register)

```css
.auth-tabs { display: flex; margin-bottom: 24px; border-bottom: 1px solid rgba(200,168,78,0.15); }
.auth-tab { flex: 1; padding: 10px 0; font-family: 'Cinzel'; font-size: 13px; font-weight: 700; letter-spacing: 2px; }
.auth-tab.active { color: #c8a84e; border-bottom: 2px solid #c8a84e; }
```

### Form Fields

```css
.auth-field { margin-bottom: 18px; }
.auth-field label { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(200,168,78,0.5); margin-bottom: 6px; }
.auth-field input { width: 100%; padding: 12px 14px; font-size: 16px; /* 16px prevents iOS zoom */ background: rgba(12,12,30,0.8); border: 1px solid rgba(200,168,78,0.15); border-radius: 3px; }
```

### Submit Button

```css
.auth-submit { width: 100%; padding: 14px; min-height: 48px; font-family: 'Cinzel'; font-size: 14px; font-weight: 700; letter-spacing: 3px; background: linear-gradient(135deg, rgba(200,168,78,0.18) 0%, rgba(200,168,78,0.08) 100%); border: 1px solid rgba(200,168,78,0.35); border-radius: 3px; color: #c8a84e; }
```

### Guest Button

```css
.auth-guest { width: 100%; padding: 12px; min-height: 48px; font-size: 14px; background: rgba(50,50,80,0.25); border: 1px solid rgba(120,120,170,0.2); border-radius: 3px; }
```

### Divider

```css
.auth-divider { margin: 20px 0; /* horizontal line with centered "OR" text */ }
```

### Verification Code Input

```css
.auth-code-input { text-align: center; font-size: 24px; letter-spacing: 8px; font-weight: 600; font-family: 'Cinzel'; color: #c8a84e; }
```

### Responsive Behavior

| Breakpoint | Alignment | Panel Width | Padding | Font Adjustments |
|-----------|-----------|-------------|---------|------------------|
| Desktop (>1024px) | `flex-end` (right-aligned) | 400px | 40px 60px | Full sizes |
| Tablet portrait (601-1024px) | `center` | 420px | 30px | Title 48px |
| Tablet landscape (>901px, <700px height) | `flex-end` | 380px | 20px 40px | Title 38px, compact spacing |
| Mobile portrait (<600px) | `center`, `flex-start` | 100% | 16px + safe-area | Title 38px |
| Mobile landscape (<500px height) | `flex-end`, `flex-start` | 340px | 10px 20px + safe-area | Title 28px, subtitle hidden, fields 6px gap |
| Very small (<375px) | Same as mobile | 100% | 20px 16px | Title 32px |

---

## 3. Main Menu (React)

**File:** `client/src/menu/MenuApp.jsx` + `client/src/menu/menu.css`
**Mount:** `#menu-root` (position: fixed, inset: 0, z-index: 100)

### Container Layout

```css
.menu-container {
  position: fixed; inset: 0; z-index: 100;
  display: flex; flex-direction: column;
  font-family: 'Inter', sans-serif;
  color: #d0d0e0;
}
```

### Header Bar

```css
.menu-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 32px; height: 60px;
  background: rgba(6, 6, 14, 0.88);
  border-bottom: 1px solid rgba(200, 168, 78, 0.12);
  backdrop-filter: blur(16px);
  flex-shrink: 0; z-index: 10;
}
```

**Header-Left:** Logo image (48px height) + subtitle text
**Header-Center:** Navigation tabs (flex row, gap: 2px)
**Header-Right:** Diamond counter, language select, user info (username + player code), mute button, logout button

### Navigation Tabs

```css
.menu-nav { display: flex; gap: 2px; }
.menu-nav-item {
  padding: 8px 24px;
  font-family: 'Cinzel'; font-size: 12px; font-weight: 700;
  letter-spacing: 2px;
  border-bottom: 2px solid transparent;
}
.menu-nav-item.active { color: #c8a84e; border-bottom-color: #c8a84e; }
```

Tabs: `play` | `store` | `friends` | `profile` | `settings` | `admin` (admin only)

### Content Area

```css
.menu-content {
  flex: 1;
  display: flex; flex-direction: column; align-items: center;
  padding: 28px 32px;
  overflow-y: auto;
}
```

### Play Tab Layout

```css
.menu-play { width: 100%; max-width: 680px; }
```

#### Map Selection

- **Map Preview Card:** flex row with SVG preview + info panel
  - Preview: 100% width, 220px height with radial gradient background
  - Info panel: 180px wide on desktop; 100% on mobile (stacks vertically)
- **Map Card Grid:** flex-wrap row, 8px gap
  - Each card: `padding: 10px 16px`, border-radius 4px, colored dot (8x8px) + label
  - Selected card: colored border + box-shadow glow

#### Mode Cards (2x2 Grid)

```css
.menu-modes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.menu-mode-card { padding: 22px 20px; min-height: 100px; border-radius: 6px; }
/* Top accent bar (2px) appears on hover via ::before */
```

Modes: Bot Match | Online PvP | Ranked | Tutorial

#### Stats Mini Bar

```css
.menu-stats-mini { display: flex; gap: 16px; padding: 12px 16px; }
```

### Store Tab

```css
.menu-store { width: 100%; max-width: 580px; }
```

- Diamond counter at top
- Category tabs (skin/trail)
- Grid of skin cards: `display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px;`
- Each skin card: 140px min, includes preview, name, price/owned badge, action button

### Friends Tab

```css
.menu-friends { width: 100%; max-width: 480px; }
```

- Player code display: flex row, code in `22px Cinzel`, copy button beside it
- Add friend input + button row
- Tabs: "Friends" / "Requests"
- Friend list rows: flex, background panel, username + code + action button

### Profile Tab

- Stats grid: wins, losses, games played per mode (bot/normal/ranked)
- Rank badge display (color-coded by rank tier)

### Settings Tab

- Toggle rows: label + description on left, ON/OFF toggle on right
- Settings: Music On/Off, Music Volume slider, SFX Mute, Show FPS, Low Performance Mode, Language dropdown, Changelog button

### Lobby Overlay (inline within Play tab)

When matchmaking is active, a lobby panel overlays inside the play tab:
- Spinner animation
- Status text
- Player list (name + ready dot)
- Cancel button
- Countdown display

### Responsive Behavior

| Breakpoint | Header Padding | Content Padding | Mode Grid | Map Detail |
|-----------|---------------|-----------------|-----------|------------|
| Desktop | 0 32px | 28px 32px | 2 columns | Side-by-side |
| Tablet (<1199px) | 0 24px | 20px 24px | 2 columns | Side-by-side |
| Mobile (<768px) | 0 12px | 12px 16px | 1 column | Stacked |
| Landscape (<500px height) | 0 8px | 8px 12px | 1 column | Stacked |

---

## 4. In-Game HUD (React overlay on Phaser)

**File:** `client/src/game-ui/GameHUD.jsx` + `client/src/game-ui/game-hud.css`
**Mount:** `#game-ui-root` (absolute, inset: 0, z-index: 10, pointer-events: none)

### Root Element

```css
.ghud {
  position: absolute; inset: 0; z-index: 10;
  pointer-events: none; touch-action: none;
  font-family: 'Inter', sans-serif;
  color: #d0d0e0;
  overflow: hidden; user-select: none;
}
```

### Header Bar

```css
.ghud-header {
  pointer-events: auto;
  display: flex; align-items: center; justify-content: space-between;
  height: 44px; padding: 0 16px;
  background: rgba(6, 6, 14, 0.82);
  border-bottom: 1px solid rgba(200, 168, 78, 0.15);
  backdrop-filter: blur(12px);
}
```

**Header-Left:** `KUST` logo (Cinzel 18px, gold) + mode badge + map badge
**Header-Center:** Resource display (iron, crystal, uranium) with values + rates
**Header-Right:** Timer (Cinzel 16px), FPS, ping, fullscreen btn, settings btn (32x32), mute btn (32x32), quit btn (32x32)

#### Resource Display

```css
.ghud-resources { display: flex; gap: 14px; align-items: center; }
.ghud-resource { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; }
.ghud-res-icon { font-size: 14px; }
.ghud-res-rate { font-size: 10px; opacity: 0.5; }
```

Colors: Iron `#aabbcc`, Crystal `#cc88ff`, Uranium `#44ff88`

#### Timer

```css
.ghud-timer {
  font-family: 'Cinzel'; font-size: 16px; font-weight: 700;
  color: #c8a84e; letter-spacing: 2px; min-width: 48px; text-align: right;
}
```

#### Header Buttons

```css
/* All icon buttons: */
width: 32px; height: 32px; border-radius: 4px;
background: rgba(10, 10, 25, 0.5);
border: 1px solid rgba(200, 168, 78, 0.15);
font-size: 14-16px;

/* Quit button special: */
background: rgba(139, 0, 0, 0.5);
border: 1px solid rgba(217, 74, 74, 0.3);
color: #d94a4a;
```

### Mobile Toggle Button

```css
.ghud-mobile-toggle {
  display: none; /* shown only on mobile (<768px) */
  position: absolute; top: 52px; left: 8px;
  width: 36px; height: 36px;
  background: rgba(6, 6, 14, 0.85);
  border: 1px solid rgba(200, 168, 78, 0.2);
  border-radius: 6px; color: #c8a84e; font-size: 18px;
  z-index: 20;
}
```

### Left Panel (Player List + Stats)

```css
.ghud-left {
  pointer-events: auto;
  position: absolute; top: 52px; left: 8px;
  width: 185px;
  display: flex; flex-direction: column; gap: 4px;
  max-height: calc(100% - 60px);
  overflow-y: auto;
}
```

#### Panel Container

```css
.ghud-panel {
  background: rgba(6, 6, 14, 0.85);
  border: 1px solid rgba(200, 168, 78, 0.1);
  border-radius: 6px;
  backdrop-filter: blur(8px);
}
```

#### Player List Rows

```css
.ghud-player-row {
  display: flex; align-items: center;
  padding: 4px 10px; gap: 6px;
}
.ghud-player-dot { width: 8px; height: 8px; border-radius: 50%; }
.ghud-player-name { font-size: 11px; flex: 1; }
.ghud-player-regions { font-size: 11px; font-weight: 600; min-width: 16px; text-align: right; }
```

#### Stats Section

- Collapsible toggle: `.ghud-stats-toggle` (padding 8px 10px, font-size 11px)
- Map Control bar: `.ghud-control-bar` (height: 6px, border-radius: 3px, flex segments)
- Production + Army stat rows: `.ghud-stat-row` (flex, gap 6px, color dot 6x6)

#### Moving Armies Panel

```css
.ghud-armies-panel { margin-top: 8px; }
.ghud-army-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 5px 8px; margin-bottom: 3px;
  background: rgba(200, 168, 78, 0.06);
  border: 1px solid rgba(200, 168, 78, 0.1);
  border-radius: 4px;
}
.ghud-army-recall { width: 20px; height: 20px; border-radius: 3px; }
```

### Region Hover Tooltip

```css
.ghud-region-tooltip {
  position: absolute; /* positioned via JS: left=pointer.x+15, top=pointer.y-10 */
  pointer-events: none; z-index: 60;
  background: rgba(6, 6, 14, 0.92);
  border: 1px solid rgba(200, 168, 78, 0.25);
  border-radius: 6px; padding: 6px 10px;
  font-size: 11px; backdrop-filter: blur(6px);
}
```

### Toast Notifications

```css
.ghud-toasts {
  position: absolute;
  bottom: 80px; /* 60px on mobile, 50px on landscape */
  left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column-reverse;
  align-items: center; gap: 8px;
  pointer-events: none;
}
.ghud-toast {
  background: rgba(6, 6, 14, 0.9);
  border: 1px solid rgba(200, 168, 78, 0.15);
  border-radius: 6px; padding: 8px 16px;
  font-size: 13px; max-width: 90vw;
  animation: ghud-toastIn 0.3s ease-out;
}
```

### Spawn Phase Overlay

```css
.ghud-spawn-phase {
  position: absolute; top: 0; left: 0; right: 0;
  pointer-events: none; display: flex; justify-content: center;
  z-index: 50; padding-top: 60px; /* 20px mobile, 48px small mobile */
}
.ghud-spawn-card {
  text-align: center; padding: 24px 48px;
  background: rgba(6, 6, 14, 0.85);
  border: 2px solid rgba(74, 217, 74, 0.4);
  border-radius: 12px; backdrop-filter: blur(12px);
  max-width: 90vw;
}
.ghud-spawn-title { font-family: 'Cinzel'; font-size: 24px; color: #4ad94a; letter-spacing: 3px; }
.ghud-spawn-seconds { font-family: 'Cinzel'; font-size: 48px; font-weight: 900; color: #4ad94a; min-width: 60px; }
```

Mobile: title 14px, timer 28px, padding 12px 20px

### Spawn Confirm Dialog

```css
.ghud-spawn-confirm-overlay { z-index: 55; }
.ghud-spawn-confirm-dialog { border-color: rgba(74, 217, 74, 0.3); }
.ghud-spawn-confirm-title { color: #4ad94a; }
.ghud-spawn-confirm-region { font-family: 'Cinzel'; font-size: 16px; color: #c8a84e; }
```

### Map Preview Overlay (3-2-1 countdown)

```css
.ghud-preview {
  position: absolute; inset: 0;
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.4);
  display: flex; align-items: center; justify-content: center;
  z-index: 50;
}
.ghud-preview-card {
  text-align: center; padding: 40px 60px;
  background: rgba(6, 6, 14, 0.75);
  border: 1px solid rgba(200, 168, 78, 0.2);
  border-radius: 8px; backdrop-filter: blur(12px);
  max-width: 90vw;
}
.ghud-preview-title { font-family: 'Cinzel'; font-size: 28px; color: #c8a84e; letter-spacing: 4px; }
.ghud-preview-count { font-family: 'Cinzel'; font-size: 72px; font-weight: 900; color: #4A90D9; }
```

Mobile: title 20px, count 52px, padding 24px 32px
Landscape: title 16px, count 44px, padding 16px 24px

### Dialog System (Quit, Eliminated)

```css
.ghud-overlay {
  position: absolute; inset: 0;
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
}
.ghud-dialog {
  background: rgba(8, 8, 20, 0.95);
  border: 1px solid rgba(200, 168, 78, 0.25);
  border-radius: 8px; padding: 28px 36px;
  text-align: center; min-width: 260px; position: relative;
  /* Ornamental corners: 16x16px, 2px border, 6px from edges */
}
.ghud-dialog-title { font-family: 'Cinzel'; font-size: 20px; font-weight: 700; color: #c8a84e; letter-spacing: 2px; }
.ghud-dialog-text { font-size: 14px; color: rgba(200,200,220,0.7); margin: 0 0 20px; }
.ghud-dialog-buttons { display: flex; gap: 12px; justify-content: center; }
.ghud-dialog-btn { padding: 10px 28px; border-radius: 4px; font-family: 'Cinzel'; font-size: 13px; font-weight: 700; letter-spacing: 2px; min-height: 44px; }
.ghud-dialog-btn.yes { background: rgba(139,0,0,0.5); color: #d94a4a; }
.ghud-dialog-btn.no { background: rgba(42,42,78,0.5); color: rgba(170,170,200,0.8); }
```

### Settings Panel

```css
.ghud-settings-panel {
  pointer-events: auto;
  position: absolute; top: 52px; right: 16px;
  width: 260px;
  background: rgba(6, 6, 14, 0.92);
  border: 1px solid rgba(200, 168, 78, 0.15);
  border-radius: 8px; backdrop-filter: blur(12px);
  padding: 12px; z-index: 40;
}
.ghud-settings-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; }
.ghud-settings-toggle { min-width: 40px; padding: 3px 8px; border-radius: 4px; font-size: 11px; }
.ghud-settings-toggle.on { background: rgba(74,217,74,0.2); color: #4ad94a; }
.ghud-settings-toggle.off { background: rgba(139,0,0,0.2); color: #d94a4a; }
```

### Responsive Summary (HUD)

| Breakpoint | Header | Left Panel | Toasts | Spawn | Preview | Dialog |
|-----------|--------|-----------|--------|-------|---------|--------|
| Desktop (>=1200px) | 44px, pad 16px | 185px, top 52px | bottom 80px | pad-top 60px, title 24px | title 28px, count 72px | pad 28px 36px, min 260px |
| Tablet (768-1199px) | 44px, pad 16px | 165px | bottom 80px | same | same | same |
| Mobile (<768px) | 40px, pad 10px | **hidden** (toggle), 170px | bottom 60px | pad-top 48px, title 18px | title 20px, count 52px | pad 20px 24px, max 85vw |
| Landscape (<500px h) | 36px, pad 8px + safe-area | 150px, top 42px | bottom 50px | pad-top 20px, title 14px, timer 28px | title 16px, count 44px | pad 16px 20px |

---

## 5. Building Bar (React)

**File:** `client/src/game-ui/BuildingBar.jsx` + CSS in `game-hud.css`
**Position:** Bottom of screen, full width

```css
.building-bar {
  pointer-events: auto;
  position: absolute; bottom: 0; left: 0; right: 0;
  background: rgba(6, 6, 14, 0.88);
  border-top: 1px solid rgba(200, 168, 78, 0.15);
  padding: 6px 12px; z-index: 20;
  backdrop-filter: blur(8px);
}
.building-bar-label { font-size: 10px; color: rgba(200,168,78,0.5); margin-bottom: 4px; }
.building-bar-items { display: flex; gap: 6px; overflow-x: auto; justify-content: center; }
```

### Building Buttons

```css
.building-btn {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 6px 10px; min-width: 60px;
  background: rgba(10, 10, 25, 0.6);
  border: 1px solid rgba(200, 168, 78, 0.15);
  border-radius: 6px;
}
.building-btn-icon { font-size: 18px; }
.building-btn-name { font-size: 9px; white-space: nowrap; }
.building-btn-count { font-size: 11px; font-weight: 700; color: #c8a84e; }
.building-btn.selected { border-color: #c8a84e; background: rgba(200,168,78,0.2); box-shadow: 0 0 8px rgba(200,168,78,0.3); }
.building-btn.cant-afford { opacity: 0.45; }
```

7 buildings: city_center, barracks, wall, iron_dome, stealth_tower, drone_facility, missile_base

### Building Tooltip (inline styles, portal to body)

```js
{
  position: 'fixed',
  left: tooltipPos.x, top: tooltipPos.y,
  transform: 'translate(-50%, -100%) translateY(-10px)',
  background: 'rgba(6,6,14,0.95)',
  border: '1px solid rgba(200,168,78,0.35)',
  borderRadius: 8, padding: '10px 14px', width: 230,
  zIndex: 99999, pointerEvents: 'none',
  backdropFilter: 'blur(8px)',
}
```

---

## 6. Ability Bar (Phaser)

**File:** `client/src/systems/AbilityBar.js`
**Position:** Right side of screen, vertical layout, scrollFactor: 0, depth: 500-501

### Layout

```js
// Slot dimensions (responsive):
slotW = pick(width, 48, 52, 56);  // mobile/tablet/desktop
slotH = pick(width, 48, 52, 56);
spacing = pick(width, 4, 6, 8);

// Position: right-aligned vertical column
startX = width - slotW/2 - pick(12, 16, 20) - safeArea.right;
barY = 52 + slotH/2 + 8;  // 52px from top (below header) + padding

// Panel background: rounded rect enclosing all 5 slots
panelPad = 8;
totalHeight = 5 * slotH + 4 * spacing;
// Rect: (startX - slotW/2 - 8, barY - slotH/2 - 8, slotW + 16, totalHeight + 16)
// Background: 0x0a0a1a alpha 0.85, border: 1px 0x333355 alpha 0.6, radius 8
```

### 5 Ability Slots (vertical, top to bottom)

| # | Key | Label | Color |
|---|-----|-------|-------|
| 1 | missile | `1` | `0xff4444` |
| 2 | nuclear | `2` | `0x44ff44` |
| 3 | barracks | `3` | `0x4488ff` |
| 4 | speedBoost | `4` | `0xffaa00` |
| 5 | freeze | `5` | `0x00ddff` |

Each slot contains:
- Background rect (rounded, radius 6)
- Icon (custom Phaser graphics, scaled 0.8 on mobile)
- Key label text (bottom of slot, monospace, 9-11px)
- Cooldown overlay (top-to-bottom sweep)
- Cooldown text (centered, 14px bold)
- Charge badge (top-right corner, 10px with bg #333366)
- Hit area (full slot size, depth 501)

### Tooltip (on hover, appears left of slot)

```js
// Position: startX - slotW, y based on hovered slot
// Text: name + desc, 10-12px
// Background: 0x0a0a1a alpha 0.92, border 0x444466, radius 6, padding 6
```

### Mode Indicator

```js
// Position: startX - slotW, barY + 20
// Text: "HEDEF SEC" or "BOLGE SEC", 10-12px bold #ff6644, hidden until ability active
```

---

## 7. Camera System (Phaser)

**File:** `client/src/systems/CameraSystem.js`

### Initial Setup

```js
mapWidth = data.map.width || 1600;
mapHeight = data.map.height || 900;

// UI panel offset for camera centering
panelW = isMobile ? 0 : (width < 1200 ? 165 : 185);

// Zoom to fit
availW = camW - panelW;
baseZoom = Math.min(availW / mapWidth, camH / mapHeight);
fitZoom = baseZoom * pick(width, 0.85, 0.92, 0.9);

// Zoom limits
minZoom = mapArea > 8_000_000 ? max(0.15, fitZoom * 0.4) : max(0.2, fitZoom * 0.5);
maxZoom = mapArea > 8_000_000 ? 3.0 : 2.5;

// Camera centered on map, offset by panel
scrollX = mapWidth/2 - camW/2 - panelW/(2 * fitZoom);
scrollY = mapHeight/2 - camH/2;

// No camera bounds (free pan, like OpenFront)
```

### Reset Button

```js
// Position: bottom-right corner
btnW = pick(width, 36, 40, 44);
btnH = pick(width, 28, 30, 34);
margin = 12;
x = camWidth - btnW/2 - margin - safeArea.right;
y = camHeight - btnH/2 - margin - 60 - safeArea.bottom;  // above building bar area
// Depth: bg=490, text=491, hit=492
// Background: 0x0a0a1a alpha 0.8, border 0x444466
// Icon: "↺" character
```

### Controls

- **Desktop mouse:** Middle/right-click drag to pan; left-click drag on empty space to pan; scroll wheel to zoom
- **Touch single finger:** Pan (after 15px threshold, cancelled if selection system is active)
- **Touch two fingers:** Simultaneous pan + pinch-to-zoom
- **Keyboard:** WASD pan (400px/s at zoom 1), Z/X zoom in/out

---

## 8. Map Renderer (Phaser)

**File:** `client/src/systems/MapRenderer.js`

### Layer Depths

| Layer | Depth | Content |
|-------|-------|---------|
| Ocean background | 0 | `0x134e6f` fill, wave lines every 40px |
| Ocean with grid | 1 | 300px padding, grid lines every 60px |
| Outer landmass glow | 5 | 6px lineStyle `0x1a3a6a` alpha 0.4 |
| Region graphics | 10 | Fill polygons (container) |
| Region highlights | 15 | Selection highlights (container) |
| Region texts (HP, badge, resource) | 20-25 | Text overlays on regions |
| Tower/spawn/mountain decorations | 28-35 | Container-based decorations |
| Owner glow effects | varies | Per-region pulsing glow |
| Fog overlays | 40 | Dark polygon overlays for fog of war |
| Armies | 50-51 | Army graphics + count text |
| Gate portals | 50 | Gate container |
| Selection arrows | 100 | Arrow graphics during drag |

### Region Text Positioning

- **HP Text:** Positioned at region centroid, font-size 12px, bold, white with black stroke (3px), origin (0.5, 0.5)
- **Resource Icon:** Below HP text, offset y+14, font-size 10px
- **Badge Text:** Above HP text, offset y-10, font-size 9px
- All texts scale inversely with camera zoom: `setScale(1/cam.zoom)`

### Fog of War

- Fogged regions get dark polygon overlays at depth 40
- Background color: `rgba(5, 8, 18, 0.55)` (via DOMFogManager, currently disabled)
- Phaser polygon overlays: filled with dark color, block region text visibility

---

## 9. Army Renderer (Phaser)

**File:** `client/src/systems/ArmyRenderer.js`

### Army Visual

```js
// Size based on count
function _getArmySize(count) {
  // Returns radius 4-12 based on soldier count
}

// Shape: Circle with inner details (weapon icon overlay)
// Depth: 50 (graphics), 51 (count text)
// Position: tracks server position, interpolated

// Count text above army:
fontSize: '12px', fontFamily: 'Arial', fontStyle: 'bold',
color: '#ffffff', stroke: '#000000', strokeThickness: 3,
resolution: 2, origin: (0.5, 1), y offset: -size - 4

// Count text scales with camera: setScale(1/cam.zoom)
```

### Trails

Skins can add trail effects: sparkle, fire, ice, rainbow particles following armies.

---

## 10. Selection System (Phaser)

**File:** `client/src/systems/SelectionSystem.js`

### Arrow Graphics

```js
arrowGraphics.setDepth(100);
// Draws line from source region center(s) to current pointer position
// Arrow head at end
// Color: attacker player color
```

### Thresholds

```js
TAP_THRESHOLD_DESKTOP = 15;    // max px to count as tap (not drag)
TAP_THRESHOLD_TOUCH = 30;      // higher on touch for finger imprecision
DRAG_ACTIVATE_THRESHOLD = 8;   // min px before selection activates on touch
MAX_SELECTED_REGIONS = 12;
```

---

## 11. Gate Renderer (Phaser)

**File:** `client/src/systems/GateRenderer.js`

### Gate Portal Visual

```js
portalRadius = 11;
depth = 50;

// Layered circles:
// Outer glow: fillCircle radius 11*2.8 (alpha 0.06), 11*2.0 (0.12), 11*1.44 (0.22)
// Ring: lineStyle 4px + 2px inner + 1px outer
// Inner fill: solid circle
// Diamond/rhombus rotating shape inside
// 4 orbiting particle dots
// "GATE" label below portal

// Connection lines between paired gates: shown on hover only
```

---

## 12. Siege Renderer (Phaser)

**File:** `client/src/systems/SiegeRenderer.js`

### Pixel-based spread

```js
SCALE = 0.5;  // 1 grid cell = 0.5 world pixels (2x resolution)
MAX_PIXELS_PER_FRAME = 300;

// Creates HTML canvas per region being sieged
// BFS flood-fill from attacker entry point
// Renders as Phaser texture updated per frame
// Multiple attackers can spread simultaneously with different colors
```

---

## 13. Toast Manager (Phaser - legacy)

**File:** `client/src/systems/ToastManager.js`
**Note:** Largely replaced by React-based ghud-toasts, but still available for Phaser scenes.

```js
// Position: center-bottom of screen
baseY = H - (isMobile ? 80 : 100) - stackOffset;
// Stack: each additional toast shifts up by (isMobile ? 42 : 48) px

// Text: centered, 13-15px
// Background: rounded rect, 0x1a1a2e alpha 0.9, border 0x444466
// Depth: bg=599, text=600
// ScrollFactor: 0 (screen-fixed)

// Animation: slide up 30px + fade in, hold duration, then slide up 15px + fade out
```

---

## 14. Lobby Scene (Phaser)

**File:** `client/src/scenes/LobbyScene.js`
**Note:** Legacy Phaser lobby, mostly replaced by React MenuApp inline lobby. Still used when navigating within Phaser.

### Layout (top to bottom)

```
Background: gradient #0a0e1a -> #111836, hex grid, floating particles

Title "KUST" (centered):
  Y = (compact ? 28 : 50) * vy + safeArea.top
  FontSize: compact 24px : pick(36px, 42px, 48px)
  Glow layer + main text with blue stroke

Mode/Map Info Card (centered):
  Y = (compact ? 60 : 100) * vy + safeArea.top
  Width: pick(min(compact?240:280, W-40), 300, 320)
  Height: compact ? 36 : pick(44, 47, 50)
  Mode name: 13-16px bold colored
  Map name: 10-12px #6b7fa8

Spinner Ring (centered):
  Y = (compact ? 100 : 170) * vy + safeArea.top
  Radius: 28px, 3px blue arc, animated rotation

Status Text: Y = spinnerY + 50
Queue Info: Y = spinnerY + 75

Players Panel (centered):
  Y = (compact ? 165 : 275) * vy + safeArea.top
  Width: pick(min(compact?280:320, W-30), 340, 360)
  Height: compact ? 100 : pick(160, 170, 180)
  Background: rounded rect, 0x0f1732 alpha 0.5
  Player slots: 26-30px height, 34-38px vertical spacing
    Status dot: 4px radius, green(ready) or yellow(waiting)
    Name: 12-14px

Back Button (centered at bottom):
  Width: pick(110, 120, 130), Height: pick(36, 38, 40)
  Y = H - pick(40, 47, 55) - safeArea.bottom

Version Footer: Y = H - pick(12, 15, 18) - safeArea.bottom, 8-10px
```

---

## 15. Friends Scene (Phaser)

**File:** `client/src/scenes/FriendsScene.js`
**Note:** Legacy Phaser friends, also available as React tab in MenuApp.

### Layout (top to bottom)

```
Background: same gradient + hex grid as other scenes

Header "ARKADASLAR" (centered):
  Y = pick(compact?22:30, 35, 40) + safeArea.top
  Font: 20-32px Arial Black bold, blue stroke

Back Button "< Geri" (left side):
  X = pick(40, 45, 50)
  Y = same as header
  Hit area: 80x40

Player Code Section (centered):
  Y = pick(compact?50:70, 80, 90) + safeArea.top
  "Oyuncu Kodun" label: 10-12px
  Code: 26-32px Courier, gold, letter-spacing 4px
  Copy hint: 9-11px below code

Add Friend Section (centered):
  Y = pick(compact?115:155, 165, 175)
  "ARKADAS EKLE" label
  Input: DOM input, Courier monospace, uppercase, letter-spacing 3px
  "EKLE" button: width 60-70px, height 36-40px, blue

Tab Buttons (centered):
  Y = pick(compact?195:260, 280, 300)
  Tab width: pick(130, 145, 160), height: pick(34, 37, 40)
  Two tabs: "Arkadaslarim" / "Istekler" with 10-15px spacing
  Active: bg 0x1e2d50, border 0x3b82f6
  Request count badge: top-right, red bg, white text

Friend List (starts below tabs):
  Y = pick(compact?225:295, 317, 340)
  Row height: pick(52, 56, 60)
  Row width: pick(min(340, W-30), 380, 420)
  Row bg: 0x0f1732 alpha 0.6, border-radius 8
  Row height: mobile 44px, desktop 50px
  Username: 13-15px bold, left-aligned with 15px padding
  Player code: 9-10px Courier, below username
  Remove button: 55-65px wide, 28-32px high, dark red
```

---

## 16. Tutorial Scene (Phaser)

**File:** `client/src/scenes/TutorialScene.js`

### Map Constants

```js
MAP_WIDTH = 1600;
MAP_HEIGHT = 900;
HEX_RADIUS = 130;
MAP_CX = 800;  // center X
MAP_CY = 450;  // center Y
```

### Map Layout

7 hexagonal regions in a flower pattern:
- R0: Center (NORMAL)
- R1: Top-left (MOUNTAIN)
- R2: Top-right (NORMAL)
- R3: Left (SPAWN - player)
- R4: Right (SPAWN - bot)
- R5: Bottom-left (SNOW)
- R6: Bottom-right (TOWER)

### Tutorial Overlay

```js
_showOverlay({ title, lines, buttonText, onButton, secondButton }) {
  // Dark overlay: fullscreen rectangle, 0x000000 alpha 0.7, depth 800
  // Card: centered, width pick(min(440, W-20), 480, 520), borderRadius 12
  //   Background: 0x080814 alpha 0.95
  //   Border: 1px 0xc8a84e alpha 0.25
  //   Gold accent bar on top: 4px height

  // Title: Cinzel 20-26px bold, gold, centered
  // Body lines: 12-14px, rgba(200,200,220,0.8), 18-22px line spacing
  // Primary button: 180-220px wide, 42-48px tall, blue bg, centered
  // Secondary button (optional): below primary, different color

  // Depth: overlay 800, card children 801-802
}
```

### Hand Animation (drag hint)

```js
// Animated hand icon moving from source region to target region
// Uses tweens for smooth movement
// Shows "drag from here to here" visual guidance
```

### Surrender Button (Stage 6)

```js
// Top-right corner
// Width: pick(80, 90, 100), Height: pick(36, 38, 40)
// Position: W - width/2 - pick(12, 16, 20), pick(12, 14, 16) + safeArea.top
// Background: 0x8B0000, depth 500
```

---

## 17. Game Over Scene (Phaser)

**File:** `client/src/scenes/GameOverScene.js`

### Main Card Layout

```js
// Background: #06060e, floating particles (gold for win, red for loss)

// Card dimensions
cardW = pick(min(420, W-20), min(480, W-30), min(520, W-40));
cardH = min(640, height - 30);
cardX = width / 2;  // centered
cardY = height / 2;  // centered

// Card visual:
// - Outer glow: 8px larger, gold (win) or red (loss), alpha 0.06
// - Background: 0x080814 alpha 0.95, border-radius 12
// - Border: 1px 0xC8A84E alpha 0.2
// - Top accent bar: 4px gold, rounded top corners
```

### Content (top to bottom within card)

```
Y starts at: cardY - cardH/2 + 30

1. Result Title "ZAFER" / "YENILGI"
   Font: Cinzel 28-42px bold
   Color: gold (win) / red (loss)
   Animated scale-in (Back.easeOut)

2. Winner Badge (Y += 45-55)
   Width: mobile min(220, cardW-40) : 260
   Height: 32px, border-radius 8
   Color dot (5px) + winner name text

3. Separator line

4. Battle Stats (Y += 14)
   "SAVAS ISTATISTIKLERI" section title
   Stat rows: label left-aligned, value right-aligned
   4 stats: regions captured, armies sent, peak power, time
   Font: 11-13px labels, 12-14px values bold

5. Diamond Reward (if awarded, Y += 6)
   Width: mobile min(200, cardW-60) : 220
   Height: 36px, Cinzel 16-20px gold text
   Animated scale-in with delay

6. Separator line

7. Scoreboard
   "SKOR TABLOSU" section title
   Header row: Player | Status | Regions
   Player rows sorted by winner first:
     - Color bar (3x16px) + name + status badge + region count
     - Self row: highlighted background rgba(0xC8A84E, 0.06)
     - Status badges: won(gold) / eliminated(red) / active(blue)
     - Row spacing: mobile 30px : 34px

8. Ranked Section (if ranked game)
   ELO change: Cinzel 20-26px, gold(+) or red(-), animated
   Current rating + rank name
   Rank promotion/demotion notice

9. Buttons (fixed to bottom of card)
   "Ana Menu" button:
     Y = cardY + cardH/2 - (mobile ? 60 : 65)
     Width: pick(160, 175, 190), Height: pick(36, 37, 38)
     Font: Cinzel 13-15px
     Color: gold bg, dark text

10. Winner confetti: 50 particles falling from top, depth 900
```

---

## 18. Boot Scene (Phaser)

**File:** `client/src/scenes/BootScene.js`

```
Loading Text: "Loading..."
  Position: camera center (W/2, H/2)
  Font: 32px Arial, white, origin (0.5)

Generates placeholder textures:
  - Arrow: 32x24px white arrow shape
  - Soldier: 8x8px white square

Routes to: GameScene (with data), TutorialScene, or MenuScene (fallback)
```

---

## 19. Auth Scene (Phaser - legacy fallback)

**File:** `client/src/scenes/AuthScene.js`
**Note:** Legacy Phaser-rendered auth. Replaced by React AuthApp but still in codebase.

### Layout

```
Background: dark with star field (40-80 stars)
vy = min(1, H / 700) - vertical scaling factor

Title "KUST":
  Y = round(80 * vy) + safeArea.top
  FontSize: pick(36px, 60px, 72px), compact pick(36px...)
  White text with blue stroke

Subtitle "Real-Time Strategy" (hidden on compact):
  Y = round(140 * vy) + safeArea.top

Tab Buttons (Login / Register):
  Y = titleY + (compact ? 38 : round(110 * vy))
  Tab width: pick(compact?110:130, 145, 160)
  Tab height: pick(compact?30:36, 40, 42)
  Gap: 10px, centered horizontally

Form Fields:
  Y starts at tabsY + (compact ? 32 : round(60 * vy))
  Label gap: compact 20 : 30
  Field gap: compact 34 : 55
  Button gap: compact 38 : 65
  Input style: pick(240, 320, 280)px wide, centered DOM input
  Background: #2a2a4e, border: 2px solid #4A90D9, radius 8px

Submit Button:
  Width: pick(compact?220:240, 310, 280)
  Height: pick(compact?36:42, 46, 48)

Guest Button:
  Same dimensions as submit, color 0x555577

Status/Error Text:
  Y = formBottomY + (compact ? 12 : 20)
  Font: 14px, red/blue

Version Text:
  Y = max(guestY + (compact?35:50), H - pick(20,25,30) - safeArea.bottom)
```

---

## 20. Menu Scene (Phaser - legacy fallback)

**File:** `client/src/scenes/MenuScene.js`
**Note:** Legacy Phaser-rendered menu. Replaced by React MenuApp but still in codebase.

### Layout

```
Background: gradient #0a0e1a -> #111836
  Hex grid: 40px hexagons, 0x1a2744 alpha 0.3
  Floating particles: 20-50 dots, animated drift
  Accent lines (desktop only): subtle diagonal lines

Title "KUST" (centered):
  Y = round((compact?30:80) * vy) + safeArea.top
  FontSize: pick(compact?28:40, 60, 80)px
  Glow layer + main text, blue stroke
  Breathing animation: +-3-5px vertical, 2400ms cycle

Subtitle "Strateji & Fetih" (hidden on compact):
  Y = titleY + round(42 * vy)
  FontSize: pick(13, 16, 18)px, gold
  Decorative diamond + line below

User Area (if authenticated):
  "Hosgeldin," label + username display
  Logout button: positioned to right of username
  Button: pick(compact?60:72, 80, 90) x pick(compact?20:22, 24, 26)

Stats Bar (desktop only, authenticated):
  Centered bar showing Bot/Online/Ranked win/loss
  Bar width: pick(min(360, W-40), min(400, W-40), 420)

Map Selection:
  "HARITA SEC" label
  Dynamic grid from GAME_MAPS config
  Button dimensions: pick(min(compact?80:100, (W-50)/4-6), min(120), 130) x (compact?32 : pick(42,48,55))
  Row spacing: mapBtnSpacing = compact ? 5 : pick(6, 10, 12)

Error Text: centered, red

Play Buttons (5 vertical, centered):
  Spacing: compact ? 36 : pick(50, 55, 65)
  1. "BOTLARA KARSI" - green 0x22c55e
  2. "ONLINE OYNA" - blue 0x3b82f6
  3. "RANKED" - gold 0xf59e0b (disabled for guests)
  4. "TUTORIAL" - purple 0x8b5cf6
  5. "ARKADASLAR" - cyan 0x06b6d4 (disabled for non-auth)
  Rank info text beside ranked button

Version Footer:
  Y = max(contentBottom+10, H - pick(15,20,25) - safeArea.bottom)
```

---

## Z-Index / Depth Summary

### HTML z-index

| Element | z-index |
|---------|---------|
| `#bg-canvas` | 0 |
| `#menu-root` | 100 |
| `#auth-root` | 9999 |
| `#game-ui-root` | 10 |

### CSS z-index (within `#game-ui-root`)

| Element | z-index |
|---------|---------|
| `.ghud` root | 10 |
| `.ghud-left` (mobile) | 15 |
| `.building-bar` | 20 |
| `.ghud-mobile-toggle` | 20 |
| `.ghud-settings-panel` | 40 |
| `.ghud-spawn-phase` | 50 |
| `.ghud-preview` | 50 |
| `.ghud-spawn-confirm-overlay` | 55 |
| `.ghud-region-tooltip` | 60 |
| `.ghud-overlay` (dialogs) | 100 |
| Building tooltip (portal) | 99999 |

### Phaser Depth

| System | Depth |
|--------|-------|
| Ocean background | 0-1 |
| Landmass glow | 5 |
| Region polygons | 10 |
| Region highlights | 15 |
| Region text (HP, badge) | 20-25 |
| Decorations (tower/spawn) | 28-35 |
| Fog overlays | 40 |
| Army graphics | 50 |
| Army count text | 51 |
| Gate portals | 50 |
| Selection arrows | 100 |
| UI Overlay (legacy) | 200-203 |
| Ability Bar panel | 500 |
| Ability Bar hit areas | 501 |
| Camera Reset button | 490-492 |
| Surrender button | 500 |
| Toast text | 599-600 |
| Tutorial overlay | 800-802 |
| Quit dialog (legacy) | 900-903 |
| Confetti | 900 |

---

## Safe Area Handling

All scenes call `getSafeAreaInsets()` which returns:

```js
{
  top: env(safe-area-inset-top),
  bottom: env(safe-area-inset-bottom),
  left: env(safe-area-inset-left),
  right: env(safe-area-inset-right)
}
```

Applied via:
- CSS: `padding-left: max(10px, env(safe-area-inset-left))` etc.
- Phaser: added to Y/X offsets for all UI elements, buttons, panels

---

## Two-Camera System (In-Game)

The GameScene uses two Phaser cameras:

1. **Main Camera** (`cameras.main`): Renders the game world (map, armies, regions). Supports zoom and pan.
2. **UI Camera** (`cameras.add(0,0)`, named `uiCamera`): Renders scrollFactor=0 elements (ability bar, reset button, legacy UI). Fixed to screen.

Elements with `scrollFactor = 0` are ignored by mainCam and shown only on uiCamera.
Elements with `scrollFactor = 1` (default) are ignored by uiCamera and shown only on mainCam.

This prevents UI elements from drifting when the camera pans/zooms.
