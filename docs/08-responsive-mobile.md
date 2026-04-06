# 08 - Responsive Design & Mobile Compatibility

> Complete reference for rebuilding the responsive/mobile experience of KUST 10 - Pillows.
> Every threshold, breakpoint, zoom range, and touch gesture is documented with exact values from the source code.

---

## Table of Contents

1. [Device Detection System](#1-device-detection-system)
2. [Phaser Scale Configuration](#2-phaser-scale-configuration)
3. [Touch Input System](#3-touch-input-system)
4. [Camera System (Desktop vs Mobile)](#4-camera-system-desktop-vs-mobile)
5. [CSS Responsive Design](#5-css-responsive-design)
6. [Mobile-Specific UI Adaptations](#6-mobile-specific-ui-adaptations)
7. [Performance on Mobile](#7-performance-on-mobile)
8. [Text Scaling System](#8-text-scaling-system)
9. [Viewport Culling](#9-viewport-culling)
10. [Capacitor Native Mobile App](#10-capacitor-native-mobile-app)
11. [Touch Event Prevention & Browser Defaults](#11-touch-event-prevention--browser-defaults)
12. [Known Mobile Issues & Testing](#12-known-mobile-issues--testing)

---

## 1. Device Detection System

**File:** `client/src/utils/device.js`

### 1.1 Breakpoint Constants

```
MOBILE_BREAKPOINT  = 768   (width < 768 = mobile)
TABLET_BREAKPOINT  = 1200  (768 <= width < 1200 = tablet)
                           (width >= 1200 = desktop)
```

### 1.2 Device Type Functions

All width-based functions accept a `width` parameter (typically `camera.width` or `window.innerWidth`).

| Function | Signature | Returns |
|----------|-----------|---------|
| `getDeviceType(width)` | `(number) -> 'mobile' \| 'tablet' \| 'desktop'` | Device tier string |
| `isMobile(width)` | `(number) -> boolean` | `width < 768` |
| `isTablet(width)` | `(number) -> boolean` | `width >= 768 && width < 1200` |
| `isDesktop(width)` | `(number) -> boolean` | `width >= 1200` |

### 1.3 Touch Detection

```javascript
export function isTouch() {
  return navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
}
```

- Does NOT use `navigator.userAgent` parsing -- relies on capability detection only.
- Returns `true` on tablets with touch screens (even if a mouse is also connected).
- Used throughout the codebase to adjust tap thresholds and input behavior.

### 1.4 Responsive Value Picker

```javascript
export function pick(width, mobileVal, tabletVal, desktopVal)
```

Returns the appropriate value based on the 3-tier breakpoint system. Heavily used in Phaser UI code (AbilityBar, CameraSystem, etc.) to set sizes, spacings, and font sizes per device tier.

### 1.5 Vertical Scale & Compact Height

```javascript
export function getVerticalScale(height) {
  return Math.min(1, height / 700);
}

export function isCompactHeight(height) {
  return height < 500;
}
```

- Reference height: **700px**. Screens shorter than 700px get a proportional scale factor.
- Compact height threshold: **500px** (landscape mobile phones).

### 1.6 Safe Area Insets

```javascript
export function getSafeAreaInsets()
// Returns { top, bottom, left, right } in pixels
```

- Creates a temporary DOM element with `env(safe-area-inset-*)` CSS values.
- Requires `viewport-fit=cover` in the HTML meta tag (which is set).
- Falls back to `{ top: 0, bottom: 0, left: 0, right: 0 }` on error.
- Used by AbilityBar and CameraSystem reset button for notch/home indicator avoidance.

### 1.7 Scene Scrolling Utility

```javascript
export function enableSceneScroll(scene, contentBottomY)
```

- Enables touch drag and mouse wheel scrolling for Phaser scenes with overflowing content.
- Drag detection threshold: **8px** (Manhattan distance) before `_isScrollDragging` activates.
- Wheel scroll multiplier: **0.5x** (`deltaY * 0.5`).
- Camera max scroll: `contentBottomY - cameraHeight + 20`.
- Used in menu-style Phaser scenes (MenuScene, LobbyScene, etc.).

### 1.8 Usage Across Codebase

Files importing from `device.js`:

| File | Functions Used |
|------|---------------|
| `SelectionSystem.js` | `isTouch` |
| `AbilityBar.js` | `pick`, `getSafeAreaInsets`, `isTouch` |
| `CameraSystem.js` | `pick`, `isMobile`, `isTouch`, `getSafeAreaInsets` |
| `GameScene.js` | `isTouch` |
| `MenuScene.js` | `pick`, `enableSceneScroll`, `getVerticalScale`, `isCompactHeight` |
| `LobbyScene.js` | `pick`, `enableSceneScroll` |
| `GameOverScene.js` | `pick`, `enableSceneScroll` |
| `FriendsScene.js` | `pick`, `enableSceneScroll` |
| `AuthScene.js` | `pick`, `enableSceneScroll` |
| `TutorialScene.js` | `pick` |
| `UIOverlay.js` | `pick` |
| `CountdownOverlay.js` | `pick` |
| `StatsPanel.js` | `isTouch`, `isMobile` |
| `ToastManager.js` | `isTouch`, `isMobile` |

---

## 2. Phaser Scale Configuration

**File:** `client/src/index.js`

### 2.1 Game Config

```javascript
const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#134e6f',
  scale: {
    mode: Phaser.Scale.RESIZE,   // Canvas resizes with browser window
    parent: 'game',
    width: '100%',
    height: '100%',
  },
  dom: {
    createContainer: true        // Enable DOM elements inside Phaser
  },
  input: {
    activePointers: 3,           // Support up to 3 simultaneous touch pointers
    mouse: {
      preventDefaultWheel: true  // Prevent page scroll on mouse wheel
    },
    touch: {
      capture: true              // Capture all touch events
    }
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
    transparent: false,          // Disable alpha channel on main canvas (perf)
  },
  resolution: 1                  // Fixed 1x resolution (not device pixel ratio)
};
```

**Key decisions:**

- **Scale mode: `RESIZE`** -- The canvas resizes to fill 100% of the parent container. No fixed aspect ratio. No letterboxing. The game world adapts to whatever dimensions the browser provides.
- **No min/max width/height** -- The game accepts any screen size.
- **3 active pointers** -- Supports two-finger gestures (pinch/pan) plus one additional pointer.
- **Resolution: 1** -- Not using `window.devicePixelRatio`. The canvas renders at CSS pixel resolution, not native device pixels. This is a deliberate performance choice.
- **No auto-center** -- Not needed with RESIZE mode since the canvas fills the parent.

### 2.2 Parent Container

The `#game` div is the parent:

```html
<div id="game" style="display:none;">
  <div id="game-ui-root"></div>
</div>
```

CSS on `#game`:

```css
#game {
  position: relative;
  width: 100vw;
  height: 100vh;
  height: 100dvh;          /* Dynamic viewport height (respects mobile chrome) */
  touch-action: none;
  -webkit-touch-callout: none;
  overscroll-behavior: none;
}
```

### 2.3 How Canvas Resizes

1. Phaser's `RESIZE` scale mode watches for window resize events.
2. When the window resizes, the canvas element is resized to match the parent container dimensions.
3. `CameraSystem._onResize()` is triggered via `scene.scale.on('resize')`.
4. Camera zoom, bounds, and scroll position are recalculated in `CameraSystem._recalculate()`.
5. AbilityBar is destroyed and recreated to reposition at new dimensions.
6. `GameScene._checkOrientation()` runs for landscape detection.

---

## 3. Touch Input System

### 3.1 Tap vs Drag Thresholds

**File:** `client/src/systems/SelectionSystem.js`

```javascript
const TAP_THRESHOLD_DESKTOP = 15;  // px (pointer.getDistance())
const TAP_THRESHOLD_TOUCH   = 30;  // px (higher for finger imprecision)
const DRAG_ACTIVATE_THRESHOLD = 8; // px (Manhattan: dx + dy)
const MAX_SELECTED_REGIONS = 12;
```

- **`pointer.getDistance()`** is Phaser's built-in method that returns the total distance the pointer traveled from down to up.
- Touch devices get **double the threshold** (30 vs 15) because fingers are imprecise.
- These same thresholds are used in both SelectionSystem and AbilityBar.

### 3.2 Tap (Region Selection / Spawn)

**Selection tap flow (touch devices):**

1. `pointerdown` on own region: Does NOT activate immediately. Stores `_pendingSourceRegionId`, `_pendingStartX/Y`.
2. If `pointerup` occurs before DRAG_ACTIVATE_THRESHOLD is exceeded AND `pointer.getDistance() <= 30`:
   - Treat as a **tap**.
   - Activates selection, adds region to `sourceRegionIds`, highlights it.
   - Selection stays active for the **next tap** on a target region.
3. If the user then taps an enemy/neutral region:
   - Auto-selects up to 3 nearest owned regions within attack range.
   - Sends soldiers from those regions to the tapped target.

**Selection tap flow (desktop):**

1. `pointerdown` on own region: Activates selection immediately.
2. `pointerup` on target region with `pointer.getDistance() <= 15`: Sends soldiers.

**Spawn selection tap:**

```javascript
const spawnTapThreshold = isTouch() ? 30 : 15;
```

- During spawn phase, tapping a region (distance <= threshold) selects it as spawn point.
- Two-finger panning is ignored (checked via `cameraSystem.isTwoFingerPanning()`).

### 3.3 Drag (Send Soldiers via Arrow)

**Touch drag flow:**

1. `pointerdown` on own region: Stores `_pendingSourceRegionId`.
2. `pointermove`: When Manhattan distance (`dx + dy`) exceeds **8px** (`DRAG_ACTIVATE_THRESHOLD`):
   - Activates selection mode.
   - Clears pending state.
   - Starts drawing dashed arrows from source center to pointer world position.
3. As pointer moves over additional owned regions, they are added to selection (up to 12).
4. Arrow color: **green (0x22c55e)** for valid targets, **red (0xff4444)** for blocked, **gray (0x888888)** for empty space.
5. `pointerup`: Determines target region, validates attack range via BFS, sends soldiers via socket.

**Desktop drag flow:**

1. `pointerdown` on own region: Immediately activates selection.
2. Drag and release work the same as touch, but without the delayed activation.

**Arrow rendering:**

- Line style: 3px width, 0.6 alpha, dashed (12px dash, 8px gap).
- Arrowhead: 14px size, PI/6 angle, 0.8 alpha fill.
- Graphics depth: 100.

### 3.4 Pinch-to-Zoom

**File:** `client/src/systems/CameraSystem.js`

**Detection:**

```javascript
const pointer1 = scene.input.pointer1;
const pointer2 = scene.input.pointer2;
if (pointer1.isDown && pointer2.isDown && !this._twoFingerPanning) {
  this._twoFingerPanning = true;
  // Calculate initial midpoint and pinch distance
  const pdx = pointer1.x - pointer2.x;
  const pdy = pointer1.y - pointer2.y;
  this._initialPinchDist = Math.sqrt(pdx * pdx + pdy * pdy);
}
```

**Zoom calculation:**

```javascript
const currentDist = Math.sqrt(pdx * pdx + pdy * pdy);
const scaleFactor = currentDist / this._initialPinchDist;
this._zoomToward(midX, midY, scaleFactor);
// Update for continuous zooming:
this._initialPinchDist = currentDist;
```

- Scale factor is the ratio of current finger distance to previous finger distance.
- Zoom is applied toward the midpoint between the two fingers.
- After each frame, `_initialPinchDist` is updated so the next frame's factor is relative (continuous).

**Zoom clamping:**

```javascript
const newZoom = clamp(oldZoom * factor, this.minZoom, this.maxZoom);
```

**Zoom center preservation** (`_zoomToward`):

```javascript
const worldBefore = this.camera.getWorldPoint(screenX, screenY);
this.camera.zoom = newZoom;
const worldAfter = this.camera.getWorldPoint(screenX, screenY);
this.camera.scrollX += worldBefore.x - worldAfter.x;
this.camera.scrollY += worldBefore.y - worldAfter.y;
```

This ensures the point under the fingers/cursor stays fixed during zoom.

### 3.5 Two-Finger Pan

Handled simultaneously with pinch-to-zoom:

```javascript
const midX = (pointer1.x + pointer2.x) / 2;
const midY = (pointer1.y + pointer2.y) / 2;
const dx = (this._twoFingerMidX - midX) / this.camera.zoom;
const dy = (this._twoFingerMidY - midY) / this.camera.zoom;
this.camera.scrollX = this._twoFingerCamStartX + dx;
this.camera.scrollY = this._twoFingerCamStartY + dy;
```

- Pan offset is divided by zoom so movement speed is consistent regardless of zoom level.
- After pinch-zoom adjusts, the pan origin is re-anchored:
  ```javascript
  this._twoFingerMidX = midX;
  this._twoFingerMidY = midY;
  this._twoFingerCamStartX = this.camera.scrollX;
  this._twoFingerCamStartY = this.camera.scrollY;
  ```

**Two-finger gesture end:**

- Ends when either finger lifts (`!pointer1.isDown || !pointer2.isDown`).
- Also cancels any pending single-finger pan to prevent accidental pan after releasing one finger.

### 3.6 Single-Finger Pan (Camera Drag)

**Touch pan activation:**

```javascript
const panThreshold = _isTouch() ? 15 : 10; // px (Manhattan: movedX + movedY)
```

1. `pointerdown` anywhere (left click or touch): Sets `_panCandidate = true`.
2. `pointermove`: Once `movedX + movedY > panThreshold`:
   - Checks that SelectionSystem is NOT blocking (neither `active` nor `_pendingSourceRegionId`).
   - If not blocked, confirms pan: `this.isDragging = true`.
3. Pan movement:
   ```javascript
   const dx = (this.dragStartX - activePointer.x) / this.camera.zoom;
   const dy = (this.dragStartY - activePointer.y) / this.camera.zoom;
   this.camera.scrollX = this.cameraStartX + dx;
   this.camera.scrollY = this.cameraStartY + dy;
   ```
4. `pointerup`: Resets pan state.

**Touch vs selection conflict resolution:**

- When on a touch device and SelectionSystem has a `_pendingSourceRegionId`, the pan candidate check defers to selection.
- If the user drags 8px on their own region, SelectionSystem takes over (soldier send drag).
- If the user drags on empty space or enemy territory, camera pan activates.

### 3.7 Selection System & Two-Finger Conflict

When a two-finger gesture begins:

1. `CameraSystem`: Sets `_twoFingerPanning = true`, cancels any single-finger pan.
2. `SelectionSystem.pointermove`: Detects `cameraSystem.isTwoFingerPanning()`, cancels pending source, resets selection.
3. `SelectionSystem.pointerup`: If two-finger panning, does NOT send soldiers; resets selection.

### 3.8 Ability Targeting (Mobile)

**File:** `client/src/systems/AbilityBar.js`

**Activation:**

- Desktop: Press number keys 1-5 to activate ability mode.
- Mobile/Tablet: Tap the ability slot (`pointerup` event on hit area).
  ```javascript
  if (this._deviceType === 'mobile' || this._deviceType === 'tablet') {
    hitArea.on('pointerup', () => this._activateMode(ab.key));
  }
  ```

**Target selection:**

```javascript
const tapThreshold = isTouch() ? 30 : 15;
scene.input.on('pointerup', (pointer) => {
  if (!this.activeMode) return;
  if (pointer.getDistance() > tapThreshold) return; // was a drag, not a tap
  // ... validate target region type (enemy/own/self)
  this._emitAbility(ab.event, { targetRegionId: regionId });
  this._deactivateMode();
});
```

- `self` type abilities (speed boost, freeze) activate immediately without target selection.
- `enemy` type abilities require tapping an enemy region.
- `own` type abilities require tapping an owned region.
- ESC key cancels targeting mode.
- Visual indicator: "HEDEF SEC" or "BOLGE SEC" text appears.

### 3.9 Haptic Feedback

```javascript
// In SelectionSystem, after sending soldiers:
if (navigator.vibrate) navigator.vibrate(40);  // 40ms vibration
```

- Only on devices that support the Vibration API.
- iOS Safari does NOT support `navigator.vibrate` (no-op check).
- Triggered on both direct send and first-time intercepted send.

---

## 4. Camera System (Desktop vs Mobile)

**File:** `client/src/systems/CameraSystem.js`

### 4.1 Zoom Limits

```javascript
// Large maps (area > 8,000,000 px^2):
this.maxZoom = 3.0;
this.minZoom = Math.max(0.15, fitZoom * 0.4);

// Normal maps:
this.maxZoom = 2.5;
this.minZoom = Math.max(0.2, fitZoom * 0.5);
```

Where `fitZoom` is calculated as:

```javascript
const availW = camW - panelW; // panelW is 0 on mobile, uiLeftWidth on desktop
const baseZoom = Math.min(availW / this.mapWidth, camH / this.mapHeight);
const fitZoom = baseZoom * pick(cam.width, 0.85, 0.92, 0.9);
//                                        mobile  tablet  desktop
```

This means:

- On mobile, the initial zoom is 85% of what would fill the screen (giving slight overview).
- On tablet, 92%.
- On desktop, 90%.

### 4.2 Initial Camera Position

```javascript
// No camera bounds - free panning like OpenFront
this.camera.removeBounds();

// Center map in the available area
this.camera.scrollX = this.mapWidth / 2 - camW / 2 - panelW / (2 * fitZoom);
this.camera.scrollY = this.mapHeight / 2 - camH / 2;
```

- No pan bounds enforced -- the user can pan freely in any direction.
- The left panel width offset is only applied on non-mobile devices.

### 4.3 Desktop Controls

| Input | Action | Details |
|-------|--------|---------|
| Mouse wheel | Zoom | Factor: `deltaY > 0 ? 0.92 : 1.08` (8% per tick) |
| Middle/right mouse drag | Pan | Immediate activation, divides by zoom for speed consistency |
| Left click drag (empty space) | Pan | Activates after 10px threshold, blocked by selection |
| W/A/S/D keys | Pan | Speed: `400 / cam.zoom` px/sec |
| Z key | Zoom in | Factor: `1 + 1.5 * dt` per frame |
| X key | Zoom out | Factor: `1 - 1.5 * dt` per frame |
| Right-click | Context menu disabled | `canvas.addEventListener('contextmenu', e => e.preventDefault())` |

### 4.4 Mobile Controls

| Input | Action | Details |
|-------|--------|---------|
| Two-finger pinch | Zoom | Continuous ratio-based (see Section 3.4) |
| Two-finger drag | Pan | Midpoint-based (see Section 3.5) |
| Single-finger drag | Pan | 15px threshold, blocked by selection (see Section 3.6) |
| Double-tap zoom | NOT IMPLEMENTED | No double-tap-to-zoom feature |
| Inertia/momentum | NOT IMPLEMENTED | No momentum scrolling after releasing |

### 4.5 Zoom-to-Fit on Game Start

Initial `_recalculate()` computes `fitZoom` and sets it as the camera's initial zoom. This ensures the entire map is visible when the game loads.

### 4.6 Camera Focus on Spawn Region

After spawn selection ends (`endSpawnSelection()`):

```javascript
const targetZoom = focusRegion ? Math.min(cam.zoom * 1.6, 1.8) : cam.zoom;
const targetScrollX = focusRegion.center.x - cam.width / (2 * targetZoom);
const targetScrollY = focusRegion.center.y - cam.height / (2 * targetZoom);
this.tweens.add({
  targets: cam,
  scrollX: targetScrollX,
  scrollY: targetScrollY,
  zoom: targetZoom,
  duration: 1200,
  ease: 'Cubic.easeInOut',
});
```

- Zooms in to **1.6x current zoom**, capped at **1.8**.
- Centers on spawn region.
- Smooth tween over **1200ms** with cubic ease-in-out.
- Falls back to any owned region if spawn region not found.

### 4.7 Camera Focus from HUD (Click Army)

```javascript
this.tweens.add({
  targets: cam,
  scrollX: data.x - cam.width / (2 * cam.zoom),
  scrollY: data.y - cam.height / (2 * cam.zoom),
  duration: 400,
  ease: 'Cubic.easeOut',
});
```

### 4.8 Camera Reset Button

A Phaser-rendered reset button in the bottom-right corner:

```javascript
const btnW = pick(cam.width, 36, 40, 44);   // width: mobile/tablet/desktop
const btnH = pick(cam.width, 28, 30, 34);   // height
const margin = 12;
const x = cam.width - btnW / 2 - margin - safeArea.right;
const y = cam.height - btnH / 2 - margin - 60 - safeArea.bottom; // 60px above ability bar area
```

- Shows a reset icon (Unicode `\u21BA`).
- Font size: `pick(cam.width, '16px', '18px', '20px')`.
- Clicking recalculates camera to initial fit-zoom and centered position.
- Depth: 490-492 (below ability bar at 500-501).

### 4.9 UI Camera Offset

```javascript
const isMobileForCamera = this.cameras.main.width < 768;
const cameraUiWidth = isMobileForCamera ? 0 : (cam.width < 1200 ? 165 : 185);
```

- Mobile: No offset (left panel is hidden behind toggle).
- Tablet: 165px offset for left panel.
- Desktop: 185px offset for left panel.

### 4.10 Two-Camera Setup

GameScene uses two cameras:

1. **Main camera** (`this.cameras.main`): Follows the game world, zooms and pans.
2. **UI camera** (`this.uiCamera`): Fixed position, no zoom/pan. Renders scrollFactor=0 elements (ability bar, reset button).

```javascript
this.uiCamera = this.cameras.add(0, 0);
this.uiCamera.setName('uiCamera');

for (const child of this.children.list) {
  if (child.scrollFactorX === 0) {
    mainCam.ignore(child);  // UI elements: only on uiCamera
  } else {
    this.uiCamera.ignore(child);  // World elements: only on mainCam
  }
}
```

---

## 5. CSS Responsive Design

### 5.1 Auth / Login Page

**File:** `client/src/auth/auth.css`

#### Breakpoints:

| Breakpoint | Condition | Purpose |
|------------|-----------|---------|
| Desktop (default) | `>1024px width` | Panel right-aligned, 400px wide, 40px/60px padding |
| Tablet portrait | `601px <= width <= 1024px` | Panel centered, 420px wide, 30px padding |
| Tablet landscape | `width >= 901px AND height <= 700px` | Panel right-aligned, 380px wide, compact spacing |
| Mobile portrait | `width <= 600px` | Full-width panel, 24px/20px padding |
| Mobile landscape | `height <= 500px` | Right-aligned, 340px panel, very compact |
| Very small phones | `width <= 375px` | Reduced title/padding |

#### Key Values Per Breakpoint:

| Element | Desktop | Tablet Portrait | Mobile Portrait | Mobile Landscape | iPhone SE |
|---------|---------|-----------------|-----------------|------------------|-----------|
| `.auth-panel` width | 400px | 420px | 100% | 340px | 100% |
| `.auth-panel` padding | 36px 32px | 32px 28px | 24px 20px | 14px 18px | 20px 16px |
| `.auth-title` font-size | 52px | 48px | 38px | 28px | 32px |
| `.auth-title` letter-spacing | 10px | 10px | 6px | 4px | 4px |
| `.auth-subtitle` | visible | visible | 10px / 3px spacing | `display: none` | visible |
| `.auth-field input` font-size | 16px | 16px | 16px | 14px | 16px |
| `.auth-field input` padding | 12px 14px | 12px 14px | 12px 14px | 8px 10px | 12px 14px |
| `.auth-submit` min-height | 48px | 44px | 48px | 40px | 48px |
| `.auth-guest` min-height | 48px | 44px | 48px | 40px | 48px |
| `.auth-tab` font-size | 13px | 13px | 12px | 11px | 12px |

**Input font-size note:** Input fields use `font-size: 16px` on all breakpoints except landscape mobile (14px). The 16px prevents iOS Safari from auto-zooming into focused input fields.

**Safe area support:**

```css
/* Mobile portrait */
padding-top: max(16px, env(safe-area-inset-top));
padding-bottom: max(16px, env(safe-area-inset-bottom));

/* Mobile landscape */
padding-left: max(10px, env(safe-area-inset-left));
padding-right: max(20px, env(safe-area-inset-right));
```

### 5.2 Menu / Main Screen

**File:** `client/src/menu/menu.css`

#### Breakpoints:

| Breakpoint | Condition | Purpose |
|------------|-----------|---------|
| Desktop (default) | `>768px` | Full layout, multi-column grids |
| Tablet | `max-width: 768px` | Single column, horizontal scroll maps |
| Mobile portrait | `max-width: 480px` | Minimal header, hidden right section |
| Landscape | `max-height: 500px` | Compact vertical spacing |

#### Key Values:

| Element | Desktop | Tablet (768px) | Mobile (480px) | Landscape (500px height) |
|---------|---------|-----------------|-----------------|--------------------------|
| `.menu-header` height | 56px | 52px | 48px | 44px |
| `.menu-logo` font-size | 28px | 22px | 20px | -- |
| `.menu-logo-sub` | visible | `display: none` | `display: none` | -- |
| `.menu-nav-item` font-size | 11px | 10px | 9px | -- |
| `.menu-nav-item` padding | 8px 20px | 6px 14px | 5px 10px | -- |
| `.menu-modes` grid | multi-column | `1fr` (single column) | single column | -- |
| `.menu-maps` layout | flex-wrap | horizontal scroll, `overflow-x: auto` | same | -- |
| `.menu-map-card` | normal | `flex-shrink: 0`, 8px 14px, 12px font | same | -- |
| `.menu-player-code` | visible | `display: none` | `display: none` | -- |
| `.menu-header-right` | visible | visible | `display: none` | -- |
| `.menu-content` padding | 24px | 20px 16px | 20px 16px | 12px 20px |
| `.lobby-panel` padding | 40px 36px | same | 28px 24px, 260px min | 20px 24px |
| `.lobby-countdown` font-size | 64px | same | 52px | 48px |

**Map selection:** On tablet/mobile, maps become a horizontal scrollable strip with `-webkit-overflow-scrolling: touch`.

**Ranked section:**

- `max-width: 768px`: Grid becomes `1fr` (single column), ranked center gets `order: -1`.
- `max-width: 480px`: Title shrinks to 16px, league icon to 22px.

**Store section:**

- `max-width: 768px`: Skin grid becomes `minmax(140px, 1fr)`, tab padding shrinks.
- `max-width: 480px`: Skin grid becomes `repeat(2, 1fr)`, diamond display shrinks.

**Daily rewards:**

- `max-width: 600px`: Cell min-width drops from 72px to 60px, popup width to 300px.

**Admin panel:**

- `max-width: 600px`: Stats grid goes `1fr 1fr`, charts/top grids go `1fr`, tabs shrink.

### 5.3 Game HUD

**File:** `client/src/game-ui/game-hud.css`

#### Breakpoints:

| Breakpoint | Condition | Purpose |
|------------|-----------|---------|
| Desktop (default) | `>1199px` | Full left panel (185px), all badges visible |
| Tablet | `max-width: 1199px` | Narrower left panel (165px), smaller badges |
| Mobile | `max-width: 767px` | Left panel hidden (toggle), smaller header |
| Spawn mobile | `max-width: 768px` | Compact spawn overlay |
| Mobile landscape | `max-height: 500px` | Ultra-compact header (36px), all elements shrunk |

#### Desktop (>= 1200px):

| Element | Value |
|---------|-------|
| `.ghud-header` height | 44px |
| `.ghud-left` width | 185px |
| `.ghud-left` top | 52px |
| `.ghud-logo` font-size | 18px |
| `.ghud-badge` font-size | 10px |
| `.ghud-timer` font-size | 16px |
| `.ghud-resource` font-size | 13px |
| `.ghud-dialog-btn` min-height | 44px |
| `.ghud-spawn-title` font-size | 24px |
| `.ghud-spawn-seconds` font-size | 48px |
| `.ghud-preview-title` font-size | 28px |
| `.ghud-preview-count` font-size | 72px |
| `.ghud-mobile-toggle` | `display: none` |

#### Tablet (max-width: 1199px):

| Element | Change |
|---------|--------|
| `.ghud-left` width | 165px |
| `.ghud-logo` font-size | 16px, letter-spacing: 3px |
| `.ghud-badge` | 9px, 2px 6px padding |

#### Mobile (max-width: 767px):

| Element | Value |
|---------|-------|
| `.ghud-header` height | 40px |
| `.ghud-logo` font-size | 14px, letter-spacing: 2px |
| `.ghud-badge` | `display: none` (mode and map badges hidden) |
| `.ghud-timer` font-size | 14px |
| `.ghud-resource` font-size | 11px, gap: 2px |
| `.ghud-res-icon` font-size | 11px |
| `.ghud-left` | `display: none` (hidden by default) |
| `.ghud-left.mobile-open` | `display: flex`, width: 170px, top: 48px |
| `.ghud-mobile-toggle` | `display: flex`, 36x36px, top: 52px |
| `.ghud-quit-btn` | 36x36px, 12px font |
| `.ghud-toasts` bottom | 60px |
| `.ghud-toast` | 12px font, 6px 12px padding |
| `.ghud-spawn-phase` | padding-top: 48px |
| `.ghud-spawn-title` font-size | 18px |
| `.ghud-spawn-seconds` font-size | 36px |
| `.ghud-preview-card` | 24px 32px padding, max-width: 85vw |
| `.ghud-preview-title` font-size | 20px |
| `.ghud-preview-count` font-size | 52px |
| `.ghud-dialog` | 20px 24px padding, max-width: 85vw |
| `.ghud-dialog-title` font-size | 17px |
| `.ghud-dialog-btn` padding | 10px 20px |

**Safe area on mobile:**

```css
.ghud-header {
  padding-left: max(10px, env(safe-area-inset-left));
  padding-right: max(10px, env(safe-area-inset-right));
}
```

#### Mobile Landscape (max-height: 500px):

| Element | Value |
|---------|-------|
| `.ghud-header` height | 36px, padding: 0 8px |
| `.ghud-logo` font-size | 12px |
| `.ghud-timer` font-size | 12px |
| `.ghud-mobile-toggle` | top: 42px, 30x30px, 14px font |
| `.ghud-left` | top: 42px, width: 150px |
| `.ghud-toasts` bottom | 50px |
| `.ghud-preview-title` font-size | 16px |
| `.ghud-preview-count` font-size | 44px |
| `.ghud-dialog` padding | 16px 20px |
| `.ghud-dialog-title` font-size | 16px |
| `.ghud-dialog-text` font-size | 12px |
| `.ghud-dialog-btn` | 8px 16px, 11px font |

**Safe area on landscape:**

```css
padding-left: max(8px, env(safe-area-inset-left));
padding-right: max(8px, env(safe-area-inset-right));
```

#### Spawn Mobile (max-width: 768px):

```css
.ghud-spawn-phase { padding-top: 20px; }
.ghud-spawn-card { padding: 12px 20px; }
.ghud-spawn-title { font-size: 14px; letter-spacing: 1px; margin-bottom: 4px; }
.ghud-spawn-subtitle { font-size: 11px; margin-bottom: 8px; }
.ghud-spawn-seconds { font-size: 28px; min-width: 36px; }
```

### 5.4 Building Bar (Bottom Bar)

**File:** `client/src/game-ui/game-hud.css`

```css
.building-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 6px 12px;
  z-index: 20;
}
.building-btn {
  min-width: 60px;
  padding: 6px 10px;
}
.building-btn-icon { font-size: 18px; }
.building-btn-name { font-size: 9px; }
.building-bar-items {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  justify-content: center;
}
```

The building bar is always full-width at the bottom. On smaller screens, items become horizontally scrollable (`overflow-x: auto`).

### 5.5 Toast Notifications

```css
.ghud-toasts {
  position: absolute;
  bottom: 80px;  /* above building bar */
  left: 50%;
  transform: translateX(-50%);
}
.ghud-toast {
  font-size: 13px;
  padding: 8px 16px;
  max-width: 90vw;
}
```

- Mobile (767px): bottom: 60px, font-size: 12px, padding: 6px 12px.
- Mobile landscape (500px height): bottom: 50px.

### 5.6 Settings Panel

```css
.ghud-settings-panel {
  position: absolute;
  top: 52px;
  right: 16px;
  width: 260px;
}
```

No responsive breakpoints -- always 260px wide, positioned top-right. On mobile, it overlaps the game area.

---

## 6. Mobile-Specific UI Adaptations

### 6.1 Mobile Toggle Button (Hamburger Menu)

**CSS:** `.ghud-mobile-toggle`

- Hidden on desktop/tablet (`display: none`).
- Shown on mobile (`max-width: 767px`): `display: flex`, 36x36px.
- Position: `top: 52px; left: 8px`.
- Shows hamburger icon (`\u2630`) when closed, X icon (`\u2715`) when open.
- Background changes when open: `rgba(200, 168, 78, 0.15)`.

**JSX:**

```jsx
<button
  className={`ghud-mobile-toggle ${mobileOpen ? 'open' : ''}`}
  onClick={() => setMobileOpen(v => !v)}
>
  {mobileOpen ? '\u2715' : '\u2630'}
</button>
```

The left panel (`ghud-left`) is toggled via the `mobile-open` class.

### 6.2 Mobile Hint Toast

On first game load on mobile (`cam.width < 768`):

```javascript
if (isMobile && !localStorage.getItem('kust_mobile_hint_shown')) {
  this.time.delayedCall(4000, () => {
    gameBridge.emit('game:toast', {
      message: t('game.mobileHint'),
      options: { duration: 4000 },
    });
  });
  localStorage.setItem('kust_mobile_hint_shown', '1');
}
```

- Shown once per device (persisted via localStorage key `kust_mobile_hint_shown`).
- Delayed 4 seconds after scene creation.
- Displayed for 4 seconds.

### 6.3 Touch Target Sizes

All interactive buttons maintain minimum touch-friendly sizes:

| Element | Min Size | Notes |
|---------|----------|-------|
| `.auth-submit` | 48px height | `min-height: 48px` (44px on landscape) |
| `.auth-guest` | 48px height | `min-height: 48px` (44px on landscape) |
| `.auth-link` | 40px height | `min-height: 40px` |
| `.ghud-dialog-btn` | 44px height | `min-height: 44px` on all breakpoints |
| `.ghud-quit-btn` | 32x32px / 36x36px | 32px desktop, 36px mobile |
| `.ghud-settings-btn` | 32x32px | All breakpoints |
| `.ghud-mute-btn` | 32x32px | All breakpoints |
| `.ghud-icon-btn` | 30x30px | Fullscreen toggle |
| `.ghud-mobile-toggle` | 36x36px | Mobile only |
| AbilityBar slots | 48x48px (mobile), 52x52 (tablet), 56x56 (desktop) | `pick(width, 48, 52, 56)` |
| Camera reset button | 36x28 (mobile), 40x30 (tablet), 44x34 (desktop) | Phaser graphics button |

### 6.4 Tap Highlight Prevention

Applied globally on all interactive elements:

```css
-webkit-tap-highlight-color: transparent;
```

Present on: `.auth-tab`, `.auth-submit`, `.auth-link`, `.auth-guest`, `.ghud-settings-btn`, `.ghud-mute-btn`, `.ghud-quit-btn`, `.ghud-mobile-toggle`, `.ghud-dialog-btn`, `.ghud-stats-toggle`.

### 6.5 Text Selection Prevention

```css
.ghud {
  user-select: none;
  -webkit-user-select: none;
}
```

Also applied programmatically:

```javascript
gameContainer.style.webkitUserSelect = 'none';
gameContainer.style.userSelect = 'none';
```

### 6.6 Orientation Handling

**Capacitor native app:** Forces landscape orientation:

```javascript
ScreenOrientation.lock({ orientation: 'landscape' });
```

**Web browser:** No orientation lock (cannot be enforced in browsers). The game adapts to both portrait and landscape via responsive CSS.

**Landscape detection in GameScene:**

```javascript
_checkOrientation() {
  const cam = this.cameras.main;
  const isMobile = cam.width < 768 || cam.height < 768;
  const isLandscape = cam.width > cam.height && isMobile;
  // Tracked but currently no action taken (AbilityBar positions itself internally)
}
```

Listens for `scale.on('resize')` to re-check on rotation.

---

## 7. Performance on Mobile

### 7.1 Auto Performance Mode

**File:** `client/src/scenes/GameScene.js`, method `_autoPerf_checkLowFps(delta)`

**Detection algorithm:**

1. Skips during preview phase (not representative).
2. Starts collecting FPS samples **after 5 seconds** of gameplay.
3. Samples FPS every **500ms** via `this.game.loop.actualFps`.
4. Keeps last **10 samples** (sliding window of 5 seconds).
5. After collecting **6+ samples**, calculates average.
6. If average FPS **< 30**: Activates low-perf mode.

**What gets disabled:**

| Optimization | Description | Flag |
|-------------|-------------|------|
| Owner glow animations | Per-frame sine-wave redraw of ownership glow graphics | `mapRenderer._glowsDisabled = true` |
| All existing glow graphics | Stops tweens, hides graphics | Iterates `ownerGlows` map |
| Army trail particles | Particle emitter for moving armies | `armyRenderer._autoLowPerf = true` |
| Siege animation tick rate | Reduced from every 6th frame to every **12th frame** | `siegeRenderer._autoLowPerf = true` |
| New glow creation | Prevents new glows when regions change ownership | `localStorage.setItem('kust_low_perf', '1')` |

**User notification:** Toast message: "Dusuk FPS algilandi - performans modu aktif" (3 seconds).

### 7.2 Manual Performance Settings

**Menu settings (via MenuApp.jsx):**

- `kust_low_perf`: Low performance mode toggle in menu settings panel.
  - Stored in `localStorage`.
  - Read by MapRenderer to skip glow creation.

**In-game settings (via GameHUD.jsx):**

| Setting Key | localStorage Key | Default | Effect |
|-------------|-----------------|---------|--------|
| `glow` | `kust_glow` | ON (`!== '0'`) | Toggles owner glow visibility |
| `particles` | `kust_particles` | ON (`!== '0'`) | Toggles particle effects |
| `fps` | `kust_show_fps` | OFF (`=== '1'`) | Shows FPS counter in header |
| `ping` | `kust_show_ping` | OFF (`=== '1'`) | Shows ping in header |

Settings changes are broadcast via `gameBridge.emit('settings:changed', settingsObject)`.

### 7.3 Canvas Resolution

- `resolution: 1` in Phaser config -- canvas renders at CSS pixels, NOT device pixels.
- BattleCanvas (auth background) uses `Math.min(window.devicePixelRatio || 1, 2)` -- capped at 2x DPR.
  ```javascript
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  this.canvas.width = this.w * dpr;
  this.canvas.height = this.h * dpr;
  this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  this._mobile = this.w < 768; // Mobile terrain uses scale 2 vs 1.5
  ```

### 7.4 Viewport Culling Frame Throttling

```javascript
// GameScene.update():
if (!this._vpCullFrame) this._vpCullFrame = 0;
if (++this._vpCullFrame % 6 === 0) {
  this.mapRenderer.updateViewportCulling(cam);
}
```

- Viewport culling runs every **6th frame** (approximately 10 times per second at 60 FPS).
- This avoids per-frame overhead of checking all regions.

### 7.5 Frustum Culling (Every Frame)

The base `MapRenderer.update()` runs every frame and performs AABB overlap tests for region graphics visibility. This is cheaper than the viewport culling (which handles text/decoration detail).

---

## 8. Text Scaling System

### 8.1 Inverse Zoom Scaling

**File:** `client/src/scenes/GameScene.js`, in `update()`:

```javascript
if (this.mapRenderer && this.mapRenderer.regionTexts && cam.zoom !== this._lastTextZoom) {
  this._lastTextZoom = cam.zoom;
  const invZoom = 1 / cam.zoom;

  for (const [, texts] of this.mapRenderer.regionTexts) {
    if (texts.hpText) texts.hpText.setScale(invZoom);
    if (texts.resourceText) texts.resourceText.setScale(invZoom);
    if (texts.badgeText) texts.badgeText.setScale(invZoom);
  }

  // Army count texts
  if (this.armyRenderer && this.armyRenderer.sprites) {
    for (const [, sprite] of this.armyRenderer.sprites) {
      if (sprite.countText) sprite.countText.setScale(invZoom);
    }
  }
}
```

- Text is scaled inversely with camera zoom so it appears at a **constant screen size** regardless of zoom level.
- Only updates when zoom actually changes (`cam.zoom !== this._lastTextZoom`).

### 8.2 Text Visibility Threshold

```javascript
// In updateViewportCulling:
const zoomVisible = cam.zoom >= 0.3;
```

- When `cam.zoom < 0.3`, ALL region texts are hidden (unreadable at that zoom level).
- When `cam.zoom >= 0.3`, text visibility depends on being within the viewport.

### 8.3 HP Text Visibility Rules

```javascript
if (texts.hpText) texts.hpText.setVisible(visible && data.hp > 0);
```

- HP text is hidden when `hp <= 0` (unowned/empty regions).
- HP text is hidden when region is fogged.
- HP text is hidden when outside the viewport.
- HP text is hidden during spawn phase (`_detailsHidden`).

---

## 9. Viewport Culling

### 9.1 Frustum Culling (MapRenderer.update)

Runs every frame. Uses AABB (axis-aligned bounding box) precomputed during map render.

```javascript
const pad = 100; // px padding to avoid pop-in at edges
const vx = cam.scrollX - pad;
const vy = cam.scrollY - pad;
const vw = cam.width / cam.zoom + pad * 2;
const vh = cam.height / cam.zoom + pad * 2;
const vRight = vx + vw;
const vBottom = vy + vh;
```

**Elements culled:**

- Region graphics (the polygon shapes)
- Region highlights (selection outlines)
- Owner glow graphics
- Tower/spawn/mountain/snow/rocky/speed decorations
- Fog overlays
- Text labels (when outside viewport -- but fog system manages visibility when inside)

### 9.2 Viewport Culling (updateViewportCulling)

Runs every 6th frame. Has a **larger margin** than frustum culling:

```javascript
const margin = 200; // px (larger to prevent edge flicker at high zoom)
const vpLeft = cam.scrollX - margin;
const vpRight = cam.scrollX + cam.width / cam.zoom + margin;
const vpTop = cam.scrollY - margin;
const vpBottom = cam.scrollY + cam.height / cam.zoom + margin;
```

**Additional logic:**

- Uses AABB bounds if available, falls back to center point.
- Skips fogged regions (already hidden by fog system).
- Combines with zoom threshold (`cam.zoom >= 0.3`).

### 9.3 AABB Computation

Computed once during `_drawRegion()`:

```javascript
let bMinX = Infinity, bMinY = Infinity, bMaxX = -Infinity, bMaxY = -Infinity;
for (const v of vertices) {
  if (v.x < bMinX) bMinX = v.x;
  if (v.y < bMinY) bMinY = v.y;
  if (v.x > bMaxX) bMaxX = v.x;
  if (v.y > bMaxY) bMaxY = v.y;
}
this.regionBounds.set(id, { minX: bMinX, minY: bMinY, maxX: bMaxX, maxY: bMaxY });
```

---

## 10. Capacitor Native Mobile App

### 10.1 Platform Initialization

**File:** `client/src/index.js`, `initMobilePlatform()`

```javascript
async function initMobilePlatform() {
  const { Capacitor } = await import('@capacitor/core');
  if (!Capacitor.isNativePlatform()) return;

  const [{ StatusBar, Style }, { SplashScreen }, { ScreenOrientation }] = await Promise.all([
    import('@capacitor/status-bar'),
    import('@capacitor/splash-screen'),
    import('@capacitor/screen-orientation'),
  ]);

  await Promise.allSettled([
    StatusBar.hide(),
    StatusBar.setStyle({ style: Style.Dark }),
    ScreenOrientation.lock({ orientation: 'landscape' }),
  ]);

  setTimeout(() => SplashScreen.hide(), 500);
}
```

**Actions on native platform:**

1. Hides the status bar.
2. Sets status bar style to Dark.
3. Locks screen orientation to **landscape**.
4. Hides splash screen after 500ms.

### 10.2 Capacitor Config

**File:** `mobile/capacitor.config.ts`

```typescript
{
  appId: 'com.kust.game',
  appName: 'KUST',
  webDir: '../client/dist',

  server: {
    allowNavigation: ['kust.frkn.com.tr'],
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a2e',
      showSpinner: false,
      launchFadeOutDuration: 500,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a1a2e',
    },
    Keyboard: {
      resize: 'none',          // Don't resize WebView when keyboard appears
      resizeOnFullScreen: false,
    },
  },

  ios: {
    contentInset: 'always',
    allowsLinkPreview: false,
    scrollEnabled: false,
    backgroundColor: '#1a1a2e',
    preferredContentMode: 'mobile',
  },

  android: {
    backgroundColor: '#1a1a2e',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
}
```

---

## 11. Touch Event Prevention & Browser Defaults

### 11.1 HTML Meta Viewport

**File:** `client/index.html`

```html
<meta name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

- `maximum-scale=1.0, user-scalable=no`: Prevents browser pinch-to-zoom on the page itself.
- `viewport-fit=cover`: Enables `env(safe-area-inset-*)` CSS values for notch avoidance.

### 11.2 CSS touch-action Prevention

Applied in multiple layers for defense-in-depth:

**HTML inline styles (index.html):**

```css
#game { touch-action: none; -webkit-touch-callout: none; overscroll-behavior: none; }
#game canvas { touch-action: none; }
#game-ui-root { touch-action: none; }
```

**Game HUD CSS:**

```css
.ghud { touch-action: none; }
```

**Body styles:**

```css
body { overflow: hidden; }
```

### 11.3 JavaScript Runtime Prevention

**File:** `client/src/index.js`

```javascript
const gameContainer = document.getElementById('game');
gameContainer.style.touchAction = 'none';
gameContainer.style.webkitTouchCallout = 'none';
gameContainer.style.webkitUserSelect = 'none';
gameContainer.style.userSelect = 'none';
gameContainer.style.overscrollBehavior = 'none';

// Also on canvas (next frame to ensure it exists)
requestAnimationFrame(() => {
  const canvas = gameContainer.querySelector('canvas');
  if (canvas) canvas.style.touchAction = 'none';
});
```

### 11.4 Phaser Config Prevention

```javascript
input: {
  mouse: { preventDefaultWheel: true },
  touch: { capture: true },
}
```

- `preventDefaultWheel`: Prevents page scroll on mouse wheel over the canvas.
- `capture: true`: Phaser captures all touch events.

### 11.5 Context Menu Prevention

```javascript
scene.game.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
```

---

## 12. Known Mobile Issues & Testing

### 12.1 iOS Safari Considerations

- **Input zoom prevention:** All `<input>` fields use `font-size: 16px` minimum to prevent iOS auto-zoom on focus.
- **`navigator.vibrate()`:** Not supported on iOS Safari. The guard `if (navigator.vibrate)` prevents errors.
- **`-webkit-overflow-scrolling: touch`:** Used on menu map scroll for smooth inertia scrolling.
- **`-webkit-backdrop-filter`:** Prefixed version used alongside standard `backdrop-filter` for glass effect on panels.
- **100vh issue:** Mitigated with `height: 100dvh` (dynamic viewport height) as fallback after `100vh`.

### 12.2 Android WebView

- `allowMixedContent: true` in Capacitor config to handle mixed HTTP/HTTPS content.
- `captureInput: true` for full input capture in Android WebView.
- `webContentsDebuggingEnabled: false` in production.

### 12.3 Touch Conflict Resolution

The system handles several potential conflicts:

1. **Two-finger pan vs selection drag:** Two-finger detection cancels any active selection.
2. **Single-finger pan vs selection:** Touch on own region defers activation (8px drag threshold). Pan activates only when selection is not blocking.
3. **Ability targeting vs selection:** `this.scene.abilityBar.activeMode` check in SelectionSystem prevents selection when targeting.
4. **Two-finger pan vs spawn selection:** Spawn click handler checks `cameraSystem.isTwoFingerPanning()`.

### 12.4 Recommended Test Screen Sizes

Based on breakpoints used in the codebase:

| Device | Resolution | Key Breakpoints Hit |
|--------|-----------|---------------------|
| iPhone SE | 375x667 | 375px (very small), 600px (mobile portrait) |
| iPhone 14 | 390x844 | 600px (mobile portrait) |
| iPhone 14 Pro Max | 430x932 | 600px (mobile portrait) |
| iPhone landscape | 844x390 | 500px height (landscape) |
| iPad Mini | 768x1024 | 768px (tablet), 1024px (tablet portrait) |
| iPad Pro 11" | 834x1194 | 768px, 1024px |
| iPad Pro 12.9" | 1024x1366 | 1024px (tablet landscape) |
| iPad landscape | 1024x768 | 1024px, 700px height |
| Laptop | 1280x800 | 1200px (desktop) |
| Desktop | 1920x1080 | 1200px (desktop) |

### 12.5 PWA / Fullscreen Behavior

The game supports toggling fullscreen via the HUD header button:

```javascript
const toggleFullscreen = useCallback(() => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
}, []);
```

Listens for browser ESC key exiting fullscreen:

```javascript
document.addEventListener('fullscreenchange', () =>
  setIsFullscreen(!!document.fullscreenElement)
);
```

### 12.6 BattleCanvas (Auth Background) Mobile Adaptation

```javascript
this._mobile = this.w < 768;
// Mobile terrain uses scale 2 (lower quality) vs 1.5 (desktop)
const scale = this._mobile ? 2 : 1.5;
```

The auth/menu background canvas animation uses larger sampling grid on mobile for better performance.

---

## Summary of All Breakpoint Thresholds

| Threshold | Value | Where Used |
|-----------|-------|------------|
| Mobile width | `< 768px` | device.js, CameraSystem, GameScene, game-hud.css |
| Tablet width | `768px - 1199px` | device.js, game-hud.css |
| Desktop width | `>= 1200px` | device.js, game-hud.css |
| Compact height | `< 500px` | device.js, auth.css, menu.css, game-hud.css |
| Auth mobile | `<= 600px` | auth.css |
| Auth tablet | `601px - 1024px` | auth.css |
| Auth landscape | `width >= 901 AND height <= 700` | auth.css |
| Small phone | `<= 375px` | auth.css |
| Menu tablet | `<= 768px` | menu.css |
| Menu mobile | `<= 480px` | menu.css |
| Menu landscape | `height <= 500px` | menu.css |
| Daily rewards mobile | `<= 600px` | menu.css |
| Admin mobile | `<= 600px` | menu.css |
| HUD tablet | `<= 1199px` | game-hud.css |
| HUD mobile | `<= 767px` | game-hud.css |
| HUD landscape | `height <= 500px` | game-hud.css |
| Spawn mobile | `<= 768px` | game-hud.css |

## Summary of All Touch/Input Thresholds

| Threshold | Value | Where Used |
|-----------|-------|------------|
| Tap (desktop) | 15px | SelectionSystem, AbilityBar, GameScene spawn |
| Tap (touch) | 30px | SelectionSystem, AbilityBar, GameScene spawn |
| Drag activate (touch) | 8px (Manhattan) | SelectionSystem |
| Pan activate (desktop) | 10px (Manhattan) | CameraSystem |
| Pan activate (touch) | 15px (Manhattan) | CameraSystem |
| Scroll drag threshold | 8px | device.js `enableSceneScroll` |
| Building place tap | 20px | GameScene building mode |
| Haptic vibration | 40ms | SelectionSystem, GameScene |
| Max selected regions | 12 | SelectionSystem |
| Max click-to-select sources | 3 | SelectionSystem |

## Summary of All Zoom Values

| Parameter | Value | Condition |
|-----------|-------|-----------|
| Max zoom (large maps) | 3.0 | `mapArea > 8,000,000` |
| Max zoom (normal maps) | 2.5 | `mapArea <= 8,000,000` |
| Min zoom (large maps) | `max(0.15, fitZoom * 0.4)` | `mapArea > 8,000,000` |
| Min zoom (normal maps) | `max(0.2, fitZoom * 0.5)` | `mapArea <= 8,000,000` |
| Fit zoom multiplier (mobile) | 0.85 | `width < 768` |
| Fit zoom multiplier (tablet) | 0.92 | `768 <= width < 1200` |
| Fit zoom multiplier (desktop) | 0.90 | `width >= 1200` |
| Scroll wheel zoom factor | 0.92 / 1.08 | Per wheel tick |
| Keyboard zoom speed | `1.5 * dt` per frame | Z/X keys |
| Spawn focus zoom | `min(currentZoom * 1.6, 1.8)` | After spawn selection ends |
| Text hide threshold | `< 0.3` | All region texts hidden below this zoom |
