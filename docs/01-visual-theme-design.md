# KUST 10 - Pillows: Complete Visual/Theme Design System

> Exhaustive visual documentation for rebuilding the game from scratch.
> Every color, font, size, opacity, animation, and icon is documented.

---

## Table of Contents

1. [Global Design Language](#1-global-design-language)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Icon System](#4-icon-system)
5. [Auth/Login Page](#5-authlogin-page)
6. [Menu/Main Screen](#6-menumain-screen)
7. [Lobby/Matchmaking](#7-lobbymatchmaking)
8. [Store/Shop](#8-storeshop)
9. [Friends Tab](#9-friends-tab)
10. [Profile Tab](#10-profile-tab)
11. [Ranked Tab](#11-ranked-tab)
12. [Settings Tab](#12-settings-tab)
13. [Daily Rewards](#13-daily-rewards)
14. [In-Game HUD](#14-in-game-hud)
15. [Game Map Rendering](#15-game-map-rendering)
16. [Game Over Screen](#16-game-over-screen)
17. [Game UI Overlays](#17-game-ui-overlays)
18. [CSS Patterns & Variables](#18-css-patterns--variables)
19. [Responsive Breakpoints](#19-responsive-breakpoints)
20. [Z-Index Layering](#20-z-index-layering)
21. [Animation Catalog](#21-animation-catalog)
22. [Asset Inventory](#22-asset-inventory)

---

## 1. Global Design Language

### Design Philosophy
- **LoL-inspired dark luxury RTS** aesthetic
- Dark backgrounds with gold (`#c8a84e`) as primary accent
- Glassmorphism panels: semi-transparent dark backgrounds with `backdrop-filter: blur()`
- Ornamental corner decorations on key panels (L-shaped gold borders)
- Glowing text shadows and drop-shadow filters for emphasis
- All interactive elements have smooth transitions (0.2s-0.3s ease)

### Shared Visual Motifs
- **Ornamental Corners**: `::before` and `::after` pseudo-elements with 2px gold borders on top-left and bottom-right
- **Panel Glass Effect**: `rgba(6, 6, 14, 0.85-0.95)` background + `backdrop-filter: blur(8-16px)`
- **Gold Accent Lines**: `1px solid rgba(200, 168, 78, 0.12-0.25)` borders
- **Touch Friendly**: All buttons min-height 40-48px, `-webkit-tap-highlight-color: transparent`

### Game Canvas Configuration
- **Engine**: PhaserJS with `Phaser.AUTO` renderer
- **Canvas Background**: `#134e6f` (deep ocean blue)
- **Scale Mode**: `Phaser.Scale.RESIZE` (fills container)
- **Resolution**: 1x (non-retina), `antialias: true`, `pixelArt: false`

---

## 2. Color System

### Primary Brand Colors
| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| Gold Primary | `#c8a84e` | `rgb(200, 168, 78)` | Titles, active tabs, buttons, icons, logo text |
| Gold Dark | `#a8882e` | `rgb(168, 136, 46)` | Gradient endpoints, dark gold accents |
| Gold Light | `#d8b85e` | `rgb(216, 184, 94)` | Hover states on gold elements |

### Background Colors
| Token | Value | Usage |
|-------|-------|-------|
| Deep Dark | `rgba(8, 8, 20, 0.92-0.95)` | Auth panel, dialog backgrounds |
| Panel Dark | `rgba(6, 6, 14, 0.82-0.92)` | HUD header, settings panel, toasts |
| Input Dark | `rgba(12, 12, 30, 0.8)` | Input fields, language selectors |
| Card Dark | `rgba(10, 10, 25, 0.4-0.8)` | Mode cards, stat cards, skin cards |
| Skin Card Dark | `rgba(15, 15, 30, 0.7)` | Store skin cards |
| Game Over BG | `#06060e` / `#080814` | Game over scene background / card |
| Ocean Blue | `0x134e6f` / `#134e6f` | Phaser canvas / ocean background |
| Overlay Black | `rgba(0, 0, 0, 0.4-0.75)` | Modal overlays, fog overlay |
| Lobby Overlay | `rgba(4, 4, 12, 0.75)` | Lobby matchmaking overlay |

### Text Colors
| Token | Value | Usage |
|-------|-------|-------|
| Primary Text | `#d0d0e0` | Body text, labels, menu text |
| White | `#ffffff` | HP text (in-game), bold values |
| Gold Text | `#c8a84e` | Titles, active states, accent text |
| Gold Dim | `rgba(200, 168, 78, 0.3-0.6)` | Subtitles, section titles, labels |
| Muted Text | `rgba(200, 200, 220, 0.25-0.5)` | Placeholder text, empty states |
| Error Red | `#d94a4a` | Error messages, quit buttons, eliminated |
| Success Green | `#4ad94a` | Success messages, spawn overlay, equip buttons |
| FPS Green | `#44ff44` | FPS counter |
| Ping Orange | `#ffaa44` | Ping display |
| Blue Accent | `#6ab0f0` / `#4A90D9` | Map badge, countdown number |
| Link Muted | `rgba(200, 168, 78, 0.4)` | Auth links, footer text |
| Version Text | `rgba(120, 120, 160, 0.2-0.25)` | Version number, footer |

### Player Colors (16 Total)
```
Index 0:  Red          #E94560  (0xE94560)
Index 1:  Green        #06D6A0  (0x06D6A0)
Index 2:  Purple       #8338EC  (0x8338EC)
Index 3:  Gold         #FFD166  (0xFFD166)
Index 4:  Cyan         #4CC9F0  (0x4CC9F0)
Index 5:  Orange       #FF6B35  (0xFF6B35)
Index 6:  Lime         #8AC926  (0x8AC926)
Index 7:  Pink         #F72585  (0xF72585)
Index 8:  Teal         #2EC4B6  (0x2EC4B6)
Index 9:  Deep Orange  #FB5607  (0xFB5607)
Index 10: Violet       #7209B7  (0x7209B7)
Index 11: Amber        #FFBE0B  (0xFFBE0B)
Index 12: Plum         #6A4C93  (0x6A4C93)
Index 13: Coral        #FF595E  (0xFF595E)
Index 14: Bronze       #E07C24  (0xE07C24)
Index 15: Magenta      #FF006E  (0xFF006E)
```

### Neutral / Region Colors
| Token | Value | Usage |
|-------|-------|-------|
| Neutral Gray | `#555555` / `0x555555` | Unowned regions (data layer) |
| Neutral Dark Fill | `0x1e2030` | Unowned region fill on map |
| Rocky Region | `0x2a2a2a` | Impassable rocky regions |

### Neutral Palette (Varied tones for unowned regions)
```
0x4a5568  Slate Gray
0x4b6858  Teal Gray
0x5c5470  Purple Gray
0x6b5b4b  Warm Brown
0x485570  Blue Gray
0x5a6048  Olive Gray
```

### Resource Colors
| Resource | Icon Color | HUD Class | Hex |
|----------|-----------|-----------|-----|
| Iron | `#aabbcc` | `.ghud-res-iron` | `#aabbcc` |
| Crystal | `#cc88ff` | `.ghud-res-crystal` | `#cc88ff` |
| Uranium | `#44ff88` | `.ghud-res-uranium` | `#44ff88` |

### Game Mode Colors
| Mode | Color | Usage |
|------|-------|-------|
| Bot / VS Bots | `#22c55e` | Mode card accent, stat mini |
| Online PvP | `#3b82f6` | Mode card accent, stat mini |
| Ranked | `#f59e0b` | Mode card accent, stat mini, ranked play btn |
| Tutorial | `#8b5cf6` | Mode card accent |

### Rank / League Colors
| Rank (Turkish Key) | Color | Admin Badge BG |
|---------------------|-------|---------------|
| Bronz (Bronze) | `#CD7F32` | `rgba(139, 105, 20, 0.25)` |
| Gumus (Silver) | `#C0C0C0` | `rgba(160, 160, 160, 0.2)` |
| Altin (Gold) | `#FFD700` | `rgba(255, 215, 0, 0.15)` |
| Elmas (Diamond) | `#B9F2FF` / `#4CC9F0` | `rgba(76, 201, 240, 0.15)` |
| Usta (Master) | `#FF4500` / `#E94560` | `rgba(233, 69, 96, 0.15)` |

### Skin Rarity Colors
| Rarity | Color | Background |
|--------|-------|-----------|
| Common | `#6B7FA8` | `rgba(107, 127, 168, 0.15)` |
| Rare | `#3B82F6` | `rgba(59, 130, 246, 0.15)` |
| Epic | `#8B5CF6` | `rgba(139, 92, 246, 0.15)` |
| Legendary | `#F59E0B` | `rgba(245, 158, 11, 0.15)` |

### Ability Colors (Phaser hex)
| Ability | Color | Hex |
|---------|-------|-----|
| Missile (Fuze) | Red | `0xff4444` |
| Nuclear (Nukleer) | Green | `0x44ff44` |
| Barracks (Baraka) | Blue | `0x4488ff` |
| Speed Boost (Hiz) | Orange | `0xffaa00` |
| Freeze (Dondur) | Cyan | `0x00ddff` |

### Trail Effect Colors (Army Skins)
```
sparkle:  [0xFFFFFF, 0xFFD700, 0xFFF8DC]
fire:     [0xFF4500, 0xFF6600, 0xFF8C00, 0xFFD700]
ice:      [0x00CED1, 0x87CEEB, 0xB0E0E6, 0xFFFFFF]
rainbow:  [0xFF0000, 0xFF7F00, 0xFFFF00, 0x00FF00, 0x0000FF, 0x8B00FF]
```

### Map Identity Colors
| Map | Color |
|-----|-------|
| Turkey | `#d94a4a` |
| Poland | `#dc143c` |
| China | `#de2910` |

### Confetti Colors (Victory)
```
[0xC8A84E, 0xFFD700, 0xE8C547, 0xD4A843, 0xF5D680, 0xffffff, 0xff8800]
```

### Battle Canvas Faction Colors (Auth Background)
```
Blue:   rgb(60, 120, 200)
Red:    rgb(200, 60, 60)
Green:  rgb(50, 180, 70)
Orange: rgb(200, 150, 50)
```

---

## 3. Typography

### Font Imports
```css
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Inter:wght@300;400;500;600&display=swap');
```

### Font Families
| Font | Usage | Fallback |
|------|-------|----------|
| `'Cinzel', serif` | Titles, logos, game labels, section headers, button labels, rank names, timer | `Georgia, serif` (in Phaser) |
| `'Inter', sans-serif` | Body text, form fields, descriptions, stats, menu items | `Arial, sans-serif` |
| `'Arial, sans-serif'` | All Phaser in-game text (HP, names, tooltips, ability labels) | N/A |
| `monospace` | Player codes, FPS/ping counters, ability key labels, friend code input | N/A |

### Font Size Catalog

#### Auth Screen
| Element | Size | Weight | Family |
|---------|------|--------|--------|
| Title "KUST" | 52px (desktop), 48px (tablet), 38px (mobile), 28px (landscape) | 900 | Cinzel |
| Subtitle | 12px (desktop), 10px (mobile) | 400 | Cinzel |
| Tab labels | 13px (desktop), 12px (mobile), 11px (landscape) | 700 | Cinzel |
| Field labels | 11px (desktop), 10px (landscape) | 500 | Inter |
| Input text | 16px (desktop), 14px (landscape) | 400 | Inter |
| Submit button | 14px (desktop), 12px (landscape) | 700 | Cinzel |
| Verification code | 24px | 600 | Cinzel |
| Error/success msg | 13px | 400 | Inter |
| Version text | 10px | 400 | Inter |
| Guest button | 14px (desktop), 12px (landscape) | 400 | Inter |
| Links | 13px | 400 | Inter |

#### Menu Screen
| Element | Size | Weight | Family |
|---------|------|--------|--------|
| Logo "KUST" | 26px (desktop), 22px (tablet), 20px (mobile) | 900 | Cinzel |
| Logo subtitle | 9px | 400 | Cinzel |
| Nav tab labels | 12px (desktop), 10px (tablet), 9px (mobile) | 700 | Cinzel |
| Nav icons | 16px | - | emoji |
| Section titles | 11px | 700 | Cinzel |
| Map preview name | 16px (desktop), 14px (mobile) | 700 | Cinzel |
| Map info title | 14px (desktop), 12px (mobile) | 700 | Cinzel |
| Map info label | 12px | 400 | Inter |
| Map info value | 13px | 600 | Inter |
| Map card text | 13px (desktop), 12px (mobile) | 400 | Inter |
| Mode card icon | 20px (desktop), 16px (mobile) | - | emoji |
| Mode card name | 14px (desktop), 12px (mobile) | 700 | Cinzel |
| Mode card desc | 12px (desktop), 11px (landscape) | 400 | Inter |
| Player code | 10px | 400 | monospace |
| Username | 13px | 500 | Inter |
| Error/success | 13px | 400 | Inter |
| Footer | 10px | 400 | Inter |

#### In-Game HUD
| Element | Size | Weight | Family |
|---------|------|--------|--------|
| Logo "KUST" | 18px (desktop), 16px (tablet), 14px (mobile), 12px (landscape) | 900 | Cinzel |
| Timer | 16px (desktop), 14px (mobile), 12px (landscape) | 700 | Cinzel |
| Resource values | 13px (desktop), 11px (mobile) | 600 | Inter |
| Resource icons | 14px (desktop), 11px (mobile) | - | emoji |
| Resource rate | 10px | 400 | Inter |
| Badge text | 10px (desktop), 9px (tablet) | 600 | Inter |
| Panel title | 10px | 700 | Cinzel |
| Player name | 11px | 400 | Inter |
| Player regions | 11px | 600 | Inter |
| "You" indicator | 9px | 400 | Inter |
| Bot indicator | 9px | 400 | Inter |
| Stats toggle | 11px | 600 | Inter |
| Stat label | 9px | 600 | Inter |
| Stat value | 11px | 500 | Inter |
| Control bar labels | 9px | 600 | Inter |
| FPS display | 11px | 400 | monospace |
| Ping display | 11px | 400 | monospace |
| Toast text | 13px (desktop), 12px (mobile) | 400 | Inter |
| Dialog title | 20px (desktop), 17px (mobile), 16px (landscape) | 700 | Cinzel |
| Dialog text | 14px (desktop), 12px (landscape) | 400 | Inter |
| Dialog button | 13px (desktop), 11px (landscape) | 700 | Cinzel |
| Settings title | 13px | 700 | Cinzel |
| Settings label | 12px | 400 | Inter |
| Settings desc | 10px | 400 | Inter |
| Settings toggle | 11px | 600 | Inter |
| Building bar label | 10px | 400 | Inter |
| Building icon | 18px | - | emoji |
| Building name | 9px | 400 | Inter |
| Building count | 11px | 700 | Inter |
| Tooltip name | 13px | 700 | Inter |
| Tooltip desc | 11px | 400 | Inter |
| Tooltip cost | 11px | 400 | Inter |
| Region tooltip HP | 11px | 600 | Inter |
| Region tooltip building | 11px (gold color) | 400 | Inter |
| Army badge | 12px | 600 | Inter |
| Army recall btn | 10px | 400 | Inter |

#### Phaser In-Game Text
| Element | Size | Weight | Family |
|---------|------|--------|--------|
| Region HP | 9-22px (area-based) | bold | Arial, sans-serif |
| Defense badge | 7-17px (hpFontSize - 5) | bold | Arial, sans-serif |
| Resource icon | 7-18px (hpFontSize - 4) | normal | Arial, sans-serif |
| Army count | 12px | bold | Arial, sans-serif |
| Spawn timer | 48px | 900 | Cinzel |
| Preview countdown | 72px (desktop), 52px (mobile), 44px (landscape) | 900 | Cinzel |
| Preview title | 28px (desktop), 20px (mobile), 16px (landscape) | 700 | Cinzel |
| Ability key label | 9-11px (responsive) | bold | monospace |
| Ability cooldown | 14px | bold | Arial, sans-serif |
| Ability charge badge | 10px | bold | Arial, sans-serif |
| Gate label | 10px | bold | Arial, sans-serif |
| Camera region name | 16-20px (responsive) | normal | Arial, sans-serif |

#### Game Over Scene
| Element | Size | Weight | Family |
|---------|------|--------|--------|
| Victory/Defeat title | 28px (mobile), 36px (tablet), 42px (desktop) | bold | Cinzel, Georgia, serif |
| Winner name | 14px | bold | Inter, Arial, sans-serif |
| Section headers | 10px | bold | Cinzel, Georgia, serif |
| Stat labels | 11-13px | normal | Inter, Arial, sans-serif |
| Stat values | 12-14px | bold | Inter, Arial, sans-serif |
| Player names | 11-13px | normal/bold | Inter, Arial, sans-serif |
| Status badges | 10px | bold | Inter, Arial, sans-serif |
| Column headers | 10px | normal | Inter, Arial, sans-serif |
| ELO change | 20-26px (responsive) | bold | Cinzel, Georgia, serif |
| Rank/Rating | 13px | normal | Inter, Arial, sans-serif |
| Diamond reward | 16-20px (responsive) | bold | Cinzel, Georgia, serif |
| Buttons | 13-15px (responsive) | bold | Cinzel, Georgia, serif |

### Letter Spacing Reference
| Context | Value |
|---------|-------|
| Auth title "KUST" | 10px (desktop), 6-7px (mobile), 4px (landscape) |
| Logo in menu | 6px (desktop), 4px (mobile) |
| Logo in HUD | 4px (desktop), 3px (tablet), 2px (mobile) |
| Tab labels | 2px |
| Section titles | 3px |
| Submit buttons | 3px |
| Field labels | 1.5px |
| Badge text | 1px |
| Auth subtitle | 5px (desktop), 3px (mobile) |

---

## 4. Icon System

### Emoji Icons Used (In-Game HUD & Building Bar)
| Icon | Unicode | Codepoint | Usage |
|------|---------|-----------|-------|
| `🏛` | U+1F3DB | `\uD83C\uDFDB` | City Center building |
| `⚔` | U+2694 | `\u2694` | Barracks building, army badge, swords |
| `🧱` | U+1F9F1 | `\uD83E\uDDF1` | Wall building |
| `🛡` | U+1F6E1 | `\uD83D\uDEE1` | Iron Dome building |
| `👁` | U+1F441 | `\uD83D\uDC41` | Stealth Tower building |
| `🚁` | U+1F681 | `\uD83D\uDE81` | Drone Facility building |
| `🚀` | U+1F680 | `\uD83D\uDE80` | Missile Base building |
| `⚒` | U+2692 | `\u2692` | Iron resource icon |
| `💎` | U+1F48E | `\uD83D\uDC8E` | Crystal resource icon |
| `☢` | U+2622 | `\u2622` | Uranium resource icon |
| `⚙` | U+2699 | `\u2699` | Settings button (HUD + menu) |
| `🔇` | U+1F507 | `\uD83D\uDD07` | Muted state |
| `🔊` | U+1F50A | `\uD83D\uDD0A` | Unmuted state |
| `✕` | U+2715 | `&#10005;` | Close/quit button, mobile menu close |
| `☰` | U+2630 | `\u2630` | Mobile hamburger menu |
| `⚶` | U+26F6 | `\u26F6` | Enter fullscreen |
| `⊙` | U+2299 | `\u2299` | Exit fullscreen |
| `◆` | U+25C6 | `&#9670;` | Diamond currency icon |
| `✓` | U+2713 | `&#10003;` | Checkmark (daily claimed) |
| `►` | U+25B6 | `\u25B6` | Stats panel expand arrow |
| `▼` | U+25BC | `\u25BC` | Stats panel collapse arrow |

### Menu Navigation Tab Icons
| Tab | Icon | Codepoint |
|-----|------|-----------|
| Play | `⚔` | U+2694 |
| Store | `🛍` | U+1F6CD |
| Friends | `👥` | U+1F465 |
| Profile | `👤` | U+1F464 |
| Settings | `⚙` | U+2699 |
| Admin | `⚙` | U+2699 |

### Game Mode Icons (Menu Mode Cards)
| Mode | HTML Entity | Symbol |
|------|-------------|--------|
| Bot Match | `&#9876;` | ⚔ (crossed swords) |
| Online PvP | `&#9889;` | ⚡ (lightning) |
| Ranked | `&#9733;` | ★ (star) |
| Tutorial | `&#9998;` | ✎ (pencil) |

### SVG / Image Assets
Located in `client/public/`:
| File | Usage |
|------|-------|
| `logo-full.svg` / `logo-full.png` | Full logo (auth screen) |
| `logo-icon.svg` / `logo-icon.png` | Icon-only logo |
| `favicon.svg` / `favicon.png` | Browser favicon |
| `icons/resource-iron.svg` | Iron resource icon (SVG) |
| `icons/resource-crystal.svg` | Crystal resource icon (SVG) |
| `icons/resource-uranium.svg` | Uranium resource icon (SVG) |
| `assets/fog/fog1.png` | Fog texture 1 |
| `assets/fog/fog2.png` | Fog texture 2 |

---

## 5. Auth/Login Page

### Background
- **Animated Battle Canvas**: Procedural simplex-noise terrain with 4 factions battling
  - Biomes: deep water, shallow water, sand, plains, forest, mountains, snow
  - Faction colors: Blue `(60,120,200)`, Red `(200,60,60)`, Green `(50,180,70)`, Orange `(200,150,50)`
  - Canvas element: `#bg-canvas`, rendered behind auth panel

### Container
- `.auth-container`: `position: fixed; inset: 0; z-index: 9999; background: transparent`

### Overlay Layout
- `.auth-overlay`: `justify-content: flex-end` (panel on right side), `padding: 40px 60px`
- Animation: `authFadeIn` 0.8s ease-out (fade up from `translateY(10px)`)

### Auth Panel
- `.auth-panel`: `width: 400px`
- Background: `rgba(8, 8, 20, 0.92)`
- Border: `1px solid rgba(200, 168, 78, 0.25)`
- Border radius: `2px`
- Padding: `36px 32px`
- Box shadow: `0 0 60px rgba(200, 168, 78, 0.06), 0 0 120px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(200, 168, 78, 0.1)`
- **Ornamental corners**: 24x24px L-shaped gold borders (`rgba(200, 168, 78, 0.4)`, 2px width) at top-left and bottom-right, offset 6px from edges

### Logo
- `.auth-logo-img`: `height: 80px`
- Filter: `drop-shadow(0 0 20px rgba(200, 168, 78, 0.4))`
- Animation: `logoGlow` 3s ease-in-out infinite alternate (drop-shadow intensity pulses between 20px/0.4 and 35px/0.6)

### Title "KUST"
- Font: Cinzel, 52px, weight 900, color `#c8a84e`
- Letter spacing: 10px
- Text shadow: `0 0 30px rgba(200, 168, 78, 0.4), 0 0 60px rgba(200, 168, 78, 0.15), 0 2px 4px rgba(0, 0, 0, 0.6)`
- Animation: `titleGlow` 3s infinite alternate (shadow intensity pulses)

### Subtitle
- Font: Cinzel, 12px, color `rgba(200, 168, 78, 0.5)`
- Letter spacing: 5px, uppercase

### Language Selector
- Background: `rgba(12, 12, 30, 0.8)`
- Border: `1px solid rgba(200, 168, 78, 0.2)`
- Color: `rgba(200, 168, 78, 0.7)`
- Font: Inter, 12px, weight 600, letter-spacing 1px

### Tabs (Login / Register)
- Bottom border: `1px solid rgba(200, 168, 78, 0.15)`
- Inactive: color `rgba(200, 168, 78, 0.35)`, 2px transparent bottom border
- Active: color `#c8a84e`, bottom border color `#c8a84e`
- Font: Cinzel, 13px, weight 700, letter-spacing 2px

### Input Fields
- Background: `rgba(12, 12, 30, 0.8)`
- Border: `1px solid rgba(200, 168, 78, 0.15)`
- Border radius: 3px
- Color: `#d0d0e0`
- Font: Inter, 16px (prevents iOS zoom)
- Focus: border `rgba(200, 168, 78, 0.45)`, box-shadow `0 0 12px rgba(200, 168, 78, 0.08)`
- Placeholder: `rgba(140, 140, 170, 0.35)`
- Labels: 11px, weight 500, color `rgba(200, 168, 78, 0.5)`, letter-spacing 1.5px, uppercase

### Submit Button
- Background: `linear-gradient(135deg, rgba(200, 168, 78, 0.18) 0%, rgba(200, 168, 78, 0.08) 100%)`
- Border: `1px solid rgba(200, 168, 78, 0.35)`
- Color: `#c8a84e`
- Font: Cinzel, 14px, weight 700, letter-spacing 3px
- Min-height: 48px
- Hover: gradient intensifies (0.28/0.14), `box-shadow: 0 0 20px rgba(200, 168, 78, 0.12)`, border to 0.5
- Active: `transform: scale(0.98)`
- Disabled: `opacity: 0.45`

### Guest Button
- Background: `rgba(50, 50, 80, 0.25)`
- Border: `1px solid rgba(120, 120, 170, 0.2)`
- Color: `rgba(170, 170, 200, 0.7)`
- Font: Inter, 14px
- Hover: bg `rgba(50, 50, 80, 0.45)`, color `#e0e0f0`

### Divider
- Color: `rgba(140, 140, 170, 0.25)`, 11px, letter-spacing 1px
- Line: `1px solid rgba(140, 140, 170, 0.12)`

### Verification Code Input
- Font: Cinzel, 24px, weight 600, color `#c8a84e`
- Letter-spacing: 8px, centered

### Messages
- Error: `#d94a4a`
- Success: `#4ad94a`
- Animation: `msgSlide` 0.3s (fade up from `translateY(-4px)`)

### Fade Out
- `.auth-container.fade-out`: `authFadeOut` 0.6s ease-in forwards (to `opacity: 0`)

---

## 6. Menu/Main Screen

### Container
- `.menu-container`: `position: fixed; inset: 0; z-index: 100; flex-direction: column`
- Animation: `menuFadeIn` 0.5s ease-out

### Header Bar
- `.menu-header`: height 60px (desktop), 52px (tablet), 48px (mobile), 44px (landscape)
- Background: `rgba(6, 6, 14, 0.88)`
- Border bottom: `1px solid rgba(200, 168, 78, 0.12)`
- Backdrop filter: `blur(16px)`
- Padding: `0 32px` (desktop), `0 16px` (tablet)

### Logo
- `.menu-logo`: Cinzel, 26px, weight 900, color `#c8a84e`, letter-spacing 6px
- Text shadow: `0 0 20px rgba(200, 168, 78, 0.25)`
- `.menu-logo-img`: height 48px, `drop-shadow(0 0 12px rgba(200, 168, 78, 0.3))`
- `.menu-logo-sub`: Cinzel, 9px, color `rgba(200, 168, 78, 0.3)`, letter-spacing 3px, uppercase

### Navigation Tabs
- `.menu-nav-item`: Cinzel, 12px, weight 700, letter-spacing 2px
- Inactive: `rgba(200, 168, 78, 0.35)`, transparent bottom border
- Hover: `rgba(200, 168, 78, 0.65)`
- Active: `#c8a84e` with matching bottom border
- Disabled: `opacity: 0.25`
- Layout: flex column with 2px gap (icon above label)
- Icon: 16px, Label: 12px

### Header Buttons
- `.menu-header-btn`: 32x32px, bg `rgba(10, 10, 25, 0.5)`, border `1px solid rgba(200, 168, 78, 0.15)`, border-radius 4px
- Hover: bg `rgba(10, 10, 25, 0.8)`, border `rgba(200, 168, 78, 0.3)`
- Logout variant: bg `rgba(139, 0, 0, 0.5)`, border `rgba(217, 74, 74, 0.3)`, color `#d94a4a`

### Diamond Display (Header)
- `.menu-diamond-display`: pill shape `border-radius: 20px`, bg `rgba(200, 168, 78, 0.12)`, border `1px solid rgba(200, 168, 78, 0.3)`
- Icon: `#C8A84E` 14px, Count: Cinzel 13px weight 700 `#C8A84E`

### Content Area
- `.menu-content`: `padding: 28px 32px` (desktop), `20px 16px` (tablet), `12px 20px` (landscape)
- Scrollable: `overflow-y: auto; -webkit-overflow-scrolling: touch`

### Map Preview
- `.map-preview`: border-radius 8px, bg `rgba(6, 6, 14, 0.6)`, border `1px solid rgba(200, 168, 78, 0.12)`
- Canvas area: height 220px (desktop), 160px (mobile)
- Background: `radial-gradient(ellipse at center, rgba(20, 20, 40, 0.8) 0%, rgba(6, 6, 14, 0.95) 100%)`
- Map name: Cinzel, 16px, weight 700, color `#c8a84e`, letter-spacing 2px, uppercase

### Map Cards
- `.menu-map-card`: bg `rgba(10, 10, 25, 0.5)`, border `1px solid rgba(200, 168, 78, 0.08)`, border-radius 4px
- Selected: border-color uses CSS variable `var(--map-color)`, bg `rgba(10, 10, 25, 0.8)`, color `#fff`, box-shadow with map color
- Map dot: 8x8px circle, color `var(--map-color)`, `opacity: 0.5` (1.0 when selected with glow)

### Mode Cards
- `.menu-mode-card`: 2-column grid, bg `rgba(10, 10, 25, 0.5)`, border `1px solid rgba(200, 168, 78, 0.08)`, border-radius 6px, min-height 100px
- Top accent bar: 2px `var(--mode-color)`, hidden by default, shown on hover
- Hover: `transform: translateY(-2px)`, border uses `color-mix(in srgb, var(--mode-color) 40%, transparent)`, box-shadow with mode color
- Locked: `opacity: 0.35`

### Stats Mini (Play Tab)
- bg `rgba(10, 10, 25, 0.4)`, border `1px solid rgba(200, 168, 78, 0.06)`, border-radius 4px
- Labels: 11px, weight 600, color uses `var(--stat-color)`
- Values: 11px, color `rgba(200, 200, 220, 0.5)`

### Error / Success Messages
- Error: color `#d94a4a`, bg `rgba(217, 74, 74, 0.08)`, border `1px solid rgba(217, 74, 74, 0.15)`
- Success: color `#4ad94a`, bg `rgba(74, 217, 74, 0.08)`, border `1px solid rgba(74, 217, 74, 0.15)`
- Animation: `menuSlide` 0.3s (fade up)

---

## 7. Lobby/Matchmaking

### Overlay
- `.lobby-overlay`: `position: fixed; inset: 0; z-index: 500`
- Background: `rgba(4, 4, 12, 0.75)`
- Backdrop: `blur(12px)`
- Animation: `lobbyIn` 0.3s ease-out (fade)

### Panel
- `.lobby-panel`: bg `rgba(8, 8, 20, 0.95)`, border `1px solid rgba(200, 168, 78, 0.18)`, border-radius 8px
- Padding: 40px 36px (desktop), 28px 24px (mobile), 20px 24px (landscape)
- Ornamental corners: 20x20px L-shaped, `rgba(200, 168, 78, 0.3)`, 2px, offset 6px

### Title
- `.lobby-title`: Cinzel, 16px (desktop), 14px (mobile), weight 700, color `#c8a84e`, letter-spacing 3px (2px mobile)

### Spinner
- `.lobby-spinner-ring`: 44x44px circle, border `2px solid rgba(200, 168, 78, 0.12)`, top border `#c8a84e`
- Animation: `lobbySpin` 1s linear infinite (360deg rotation)

### Countdown
- `.lobby-countdown`: Cinzel, 64px (desktop), 52px (mobile), 48px (landscape), weight 900, color `#c8a84e`
- Text shadow: `0 0 30px rgba(200, 168, 78, 0.5)`
- Animation: `countPulse` 0.5s (scale from 1.5 + fade)

### Player List
- `.lobby-player`: padding 8px 12px, border-radius 4px
- Self: bg `rgba(200, 168, 78, 0.05)`
- Player dot: 8x8px circle
  - Ready: bg `#4ad94a`, box-shadow `0 0 6px rgba(74, 217, 74, 0.4)`
  - Waiting: bg `#f59e0b`, animation `dotPulse` 1.5s infinite (opacity 0.4 to 1)
- Player name: `#d0d0e0`, 13px

### Cancel Button
- bg `rgba(217, 74, 74, 0.08)`, border `1px solid rgba(217, 74, 74, 0.25)`, color `#d94a4a`
- Cinzel, 12px, weight 700, letter-spacing 2px

---

## 8. Store/Shop

### Store Balance Header
- bg: `linear-gradient(135deg, rgba(200, 168, 78, 0.1), rgba(200, 168, 78, 0.05))`
- Border: `1px solid rgba(200, 168, 78, 0.25)`, border-radius 12px
- Diamond icon: `#C8A84E`, 28px (22px mobile), `drop-shadow(0 0 8px rgba(200, 168, 78, 0.5))`
- Amount: Cinzel, 28px (22px mobile), weight 700, `#C8A84E`
- Label: Inter, 12px, `rgba(200, 168, 78, 0.7)`, uppercase, letter-spacing 2px

### Category Tabs
- `.menu-store-tab`: bg `rgba(20, 20, 40, 0.6)`, border `1px solid rgba(100, 100, 140, 0.2)`, border-radius 8px
- Color: `#6B7FA8`, Inter 11px, weight 600, letter-spacing 1px
- Active: bg `rgba(200, 168, 78, 0.15)`, border `rgba(200, 168, 78, 0.4)`, color `#C8A84E`

### Skin Grid
- Grid: `repeat(auto-fill, minmax(160px, 1fr))`, gap 12px
- Mobile: `minmax(140px, 1fr)`, small phones: `repeat(2, 1fr)`

### Skin Card
- `.menu-skin-card`: bg `rgba(15, 15, 30, 0.7)`, border `1px solid rgba(100, 100, 140, 0.2)`, border-radius 12px, padding 14px
- Hover: `translateY(-2px)`, box-shadow `0 4px 16px rgba(0, 0, 0, 0.3)`
- Owned: border `rgba(34, 197, 94, 0.3)`
- Equipped: border `rgba(200, 168, 78, 0.5)`, box-shadow `0 0 12px rgba(200, 168, 78, 0.15)`
- Rarity top border (2px solid):
  - Common: `#6B7FA8`
  - Rare: `#3B82F6`
  - Epic: `#8B5CF6`
  - Legendary: `#F59E0B`

### Skin Preview Area
- Height 50px, centered
- Color dots: 24x24px circle, `2px solid rgba(255, 255, 255, 0.15)`, box-shadow `0 0 8px rgba(0, 0, 0, 0.3)`
- Shape icon: 32px, color `#D0D0E0`
- Effect icon: 30px

### Buy Button
- bg: `linear-gradient(135deg, rgba(200, 168, 78, 0.2), rgba(200, 168, 78, 0.1))`
- Border: `1px solid rgba(200, 168, 78, 0.4)`, border-radius 8px
- Color: `#C8A84E`, Cinzel, 13px, weight 700
- Disabled: `opacity: 0.4`

### Equip Button
- bg `rgba(34, 197, 94, 0.15)`, border `1px solid rgba(34, 197, 94, 0.3)`, color `#22C55E`
- Inter, weight 600, 12px

### Unequip Button
- bg `rgba(200, 168, 78, 0.15)`, border `1px solid rgba(200, 168, 78, 0.3)`, color `#C8A84E`

---

## 9. Friends Tab

### Layout
- Max-width: 480px

### Player Code Display
- bg `rgba(10, 10, 25, 0.6)`, border `1px solid rgba(200, 168, 78, 0.12)`, border-radius 6px
- Code text: Cinzel, 22px, weight 700, color `#c8a84e`, letter-spacing 6px
- Copy button: bg `rgba(200, 168, 78, 0.1)`, border `1px solid rgba(200, 168, 78, 0.2)`, color `#c8a84e`, 12px

### Add Friend Input
- bg `rgba(10, 10, 25, 0.7)`, border `1px solid rgba(200, 168, 78, 0.12)`, border-radius 4px
- Font: monospace, 16px, letter-spacing 4px, uppercase, centered

### Add Button
- bg `rgba(200, 168, 78, 0.12)`, border `1px solid rgba(200, 168, 78, 0.25)`, color `#c8a84e`
- Cinzel, 13px, weight 700, letter-spacing 2px

### Friend Sub-Tabs
- Inactive: color `rgba(200, 168, 78, 0.3)`, 2px transparent bottom
- Active: `#c8a84e` with matching bottom border
- Badge (request count): bg `#d94a4a`, color `#fff`, 10px, border-radius 10px

### Friend Row
- Padding: 10px 12px, bottom border `1px solid rgba(200, 168, 78, 0.04)`
- Name: `#d0d0e0`, 14px
- Code: `rgba(200, 168, 78, 0.4)`, monospace, 11px

### Accept/Reject Buttons
- Accept: bg `rgba(74, 217, 74, 0.08)`, border `1px solid rgba(74, 217, 74, 0.25)`, color `#4ad94a`
- Reject: bg `rgba(217, 74, 74, 0.08)`, border `1px solid rgba(217, 74, 74, 0.25)`, color `#d94a4a`

---

## 10. Profile Tab

### Layout
- Max-width: 600px

### Profile Card
- bg `rgba(10, 10, 25, 0.5)`, border `1px solid rgba(200, 168, 78, 0.08)`, border-radius 6px
- Rows: flex space-between, `8px 0` padding, bottom border `1px solid rgba(200, 168, 78, 0.04)`
- Labels: `rgba(200, 200, 220, 0.4)`, 13px
- Values: `#d0d0e0`, 13px, weight 500

### Stats Grid
- 3-column grid (1 column on mobile), gap 12px
- `.menu-stat-card`: bg `rgba(10, 10, 25, 0.5)`, border `1px solid rgba(200, 168, 78, 0.06)`, border-radius 6px, top border 2px `var(--stat-color)`
- Title: Cinzel, 11px, weight 700, color `var(--stat-color)`, letter-spacing 2px
- Numbers: 18px, weight 600, color `#d0d0e0`
- Win numbers: `#4ad94a`
- Loss numbers: `#d94a4a`
- Labels: 9px, `rgba(200, 200, 220, 0.35)`, uppercase

### Rank Card
- Padding: 18px 20px, bg `rgba(10, 10, 25, 0.5)`, border `1px solid rgba(200, 168, 78, 0.15)`, border-radius 6px
- Rank name: Cinzel, 18px, weight 700, `#c8a84e`
- Rating: `rgba(200, 168, 78, 0.5)`, 14px

---

## 11. Ranked Tab

### Layout
- Max-width: 1100px, 3-column grid `1fr 1.2fr 1fr` (1 column on mobile)

### Header
- Title: Cinzel, 22px (18px tablet, 16px mobile), weight 900, `#c8a84e`, letter-spacing 6px
- Text shadow: `0 0 20px rgba(200, 168, 78, 0.2)`
- Diamond display: Cinzel, 14px, weight 700, `#c8a84e`

### League Cards
- `.menu-league-card`: bg `rgba(10, 10, 25, 0.5)`, border `1px solid rgba(100, 100, 140, 0.1)`, left border 3px `var(--league-color)`, border-radius 6px
- Current league: bg `rgba(200, 168, 78, 0.06)`, border `rgba(200, 168, 78, 0.2)`, box-shadow `0 0 12px rgba(200, 168, 78, 0.08)`
- League name: Cinzel, 13px, weight 700, color `var(--league-color)`
- Range text: 10px, `rgba(200, 200, 220, 0.3)`
- Progress bar: 4px height, bg `rgba(200, 200, 220, 0.06)`, fill `var(--league-color)` at `opacity: 0.6`

### My Rank Card
- bg `rgba(10, 10, 25, 0.6)`, border `1px solid rgba(200, 168, 78, 0.15)`, border-radius 10px, max-width 280px
- League name: Cinzel, 28px (22px mobile), weight 900, text-shadow `0 0 20px currentColor`
- Rating: 16px, `rgba(200, 200, 220, 0.5)`
- Win stat: `#4ad94a`, weight 600
- Loss stat: `#d94a4a`, weight 600

### Ranked Play Button
- bg: `linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(200, 168, 78, 0.15))`
- Border: `1px solid rgba(245, 158, 11, 0.5)`, border-radius 8px
- Color: `#f59e0b`, Cinzel, 16px, weight 700, letter-spacing 3px
- Hover: gradient intensifies, box-shadow `0 0 24px rgba(245, 158, 11, 0.2)`, `translateY(-2px)`

### Leaderboard
- `.menu-lb-row`: 4-column grid `28px 1fr auto 50px`, border-radius 4px
- Me row: bg `rgba(200, 168, 78, 0.08)`, border `1px solid rgba(200, 168, 78, 0.12)`
- Top 3: bg `rgba(200, 168, 78, 0.03)`
- Gold position: `#c8a84e`, Cinzel, weight 700
- Name: 12px, `#d0d0e0`
- Rank badge: Cinzel, 10px, weight 700
- Rating: 11px, `rgba(200, 200, 220, 0.4)`

---

## 12. Settings Tab

### Layout
- `.menu-settings-page`: max-width 500px, flex column, gap 16px

### Header
- H2: Cinzel, 22px, color `#c8a84e`
- Gear icon: 32px, color `#c8a84e`, animation `gear-spin` 8s linear infinite

### Settings Card
- bg `rgba(15, 15, 30, 0.7)`, border `1px solid #333355`, border-radius 10px, padding 16px 20px
- Card title: `#e0e0e8`, 15px, weight 600, bottom border `1px solid #2a2a44`

### Audio Controls
- Label: `#c8c8d0`, 14px
- Toggle On: bg `#22c55e`, color `#fff`, border `#22c55e`
- Toggle Off: bg `#333348`, color `#888`, border `#444466`
- Slider: bg `#333348`, 6px height, thumb 16x16px circle bg `#c8a84e`
- Value: `#c8a84e`, 13px

### Language Selector
- Same as auth language selector style

### Version Card
- `.menu-version-text`: Cinzel, 13px, `rgba(200, 168, 78, 0.5)`
- Changelog button: bg `rgba(200, 168, 78, 0.1)`, border `1px solid rgba(200, 168, 78, 0.2)`, color `#c8a84e`, 12px

---

## 13. Daily Rewards

### Reward Strip
- Horizontal scrollable flex, gap 6px, no scrollbar

### Reward Cell
- Min-width: 72px (60px mobile), border-radius 10px
- Default: bg `rgba(12, 12, 30, 0.6)`, border `1px solid rgba(200, 168, 78, 0.1)`
- Claimed: bg `rgba(34, 197, 94, 0.12)`, border `rgba(34, 197, 94, 0.3)`, checkmark `#22c55e` at top-right
- Available: bg `rgba(200, 168, 78, 0.15)`, border `rgba(200, 168, 78, 0.5)`, box-shadow `0 0 12px rgba(200, 168, 78, 0.2)`
- Available hover: `translateY(-2px)`
- Locked: `opacity: 0.4`
- Pulse animation: `dailyPulse` 2s (box-shadow from 8px/0.2 to 20px/0.5)

### Cell Content
- Day label: Cinzel, 9px, weight 700, `rgba(200, 168, 78, 0.6)`, uppercase
- Diamond icon: 20px (16px mobile), color `#60a5fa`, text-shadow `0 0 8px rgba(96, 165, 250, 0.4)`
- Amount: 13px (11px mobile), weight 600, `#d0d0e0`

### Daily Popup
- Overlay: `rgba(0, 0, 0, 0.75)` + `blur(8px)`, z-index 200
- Panel: width 340px (300px mobile), bg `linear-gradient(145deg, #0e0e22 0%, #151535 50%, #0e0e22 100%)`
- Border: `1px solid rgba(200, 168, 78, 0.3)`, border-radius 16px
- Box shadow: `0 0 40px rgba(200, 168, 78, 0.15), 0 20px 60px rgba(0, 0, 0, 0.5)`
- Animation: `dailyPopupIn` 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) (bounce scale)
- Title: Cinzel, 18px, weight 900, `#c8a84e`, letter-spacing 3px
- Diamond box: bg `rgba(96, 165, 250, 0.08)`, border `1px solid rgba(96, 165, 250, 0.2)`, border-radius 12px
- Diamond icon: 36px (28px mobile), `#60a5fa`, animation `dailyDiamondSpin` 3s (Y-axis rotation)
- Collect button: bg `linear-gradient(135deg, #c8a84e 0%, #a8882e 100%)`, border-radius 10px, Cinzel 16px, weight 900, color `#0a0a1a`
- Collected state: `#22c55e`, Cinzel 16px, weight 700, with checkmark 24px

---

## 14. In-Game HUD

### Root
- `.ghud`: `position: absolute; inset: 0; z-index: 10; pointer-events: none; font-family: Inter; color: #d0d0e0`

### Header Bar
- Height: 44px (desktop), 40px (mobile), 36px (landscape)
- Background: `rgba(6, 6, 14, 0.82)`, border bottom `1px solid rgba(200, 168, 78, 0.15)`, `backdrop-filter: blur(12px)`
- Pointer-events: auto

### Resources Bar (Center)
- Gap: 14px (desktop), 8px (mobile)
- Icon size: 14px (11px mobile)
- Value: Inter monospace, 13px (11px mobile), weight 600, min-width 32px (24px mobile)
- Rate: 10px, opacity 0.5

### Badges
- `.ghud-mode-badge`: bg `rgba(200, 168, 78, 0.12)`, border `1px solid rgba(200, 168, 78, 0.25)`, color `#c8a84e`
- `.ghud-map-badge`: bg `rgba(74, 144, 217, 0.12)`, border `1px solid rgba(74, 144, 217, 0.25)`, color `#6ab0f0`
- Size: 10px (9px tablet), weight 600, letter-spacing 1px, uppercase, padding 3px 8px

### Timer
- Cinzel, 16px (14px mobile, 12px landscape), weight 700, `#c8a84e`, letter-spacing 2px
- Text shadow: `0 0 8px rgba(200, 168, 78, 0.2)`

### Left Panel
- Position: absolute, top 52px, left 8px, width 185px (165px tablet, 170px mobile)
- Hidden on mobile, toggled via hamburger button
- `.ghud-panel`: bg `rgba(6, 6, 14, 0.85)`, border `1px solid rgba(200, 168, 78, 0.1)`, border-radius 6px, `backdrop-filter: blur(8px)`

### Player List
- Player dot: 8x8px circle, box-shadow `0 0 4px currentColor`
- Self row: bg `rgba(200, 168, 78, 0.06)`
- Eliminated: `opacity: 0.4`, text-decoration `line-through`
- "You" tag: `rgba(200, 168, 78, 0.6)`, 9px
- "[BOT]" tag: `rgba(140, 140, 170, 0.5)`, 9px

### Stats Panel
- Map control bar: 6px height, border-radius 3px, bg `rgba(30, 30, 50, 0.6)`
- Segments: colored by player, min-width 1px, transition `width 0.5s ease`

### Moving Armies Panel
- Army item: bg `rgba(200, 168, 78, 0.06)`, border `1px solid rgba(200, 168, 78, 0.1)`, border-radius 4px
- Recall button: 20x20px, bg `rgba(139, 0, 0, 0.4)`, border `1px solid rgba(217, 74, 74, 0.3)`, color `#d94a4a`

### Enemy Armies
- Border: `rgba(217, 74, 74, 0.15)`
- Items: bg `rgba(217, 74, 74, 0.06)`
- Title color: `#d94a4a`

### Building Bar (Bottom)
- Position: absolute bottom, full width
- bg `rgba(6, 6, 14, 0.88)`, border top `1px solid rgba(200, 168, 78, 0.15)`, `backdrop-filter: blur(8px)`
- Button: bg `rgba(10, 10, 25, 0.6)`, border `1px solid rgba(200, 168, 78, 0.15)`, border-radius 6px, min-width 60px
- Selected: border `#c8a84e`, bg `rgba(200, 168, 78, 0.2)`, box-shadow `0 0 8px rgba(200, 168, 78, 0.3)`
- Can't afford: `opacity: 0.45`
- Tooltip (inline): bg `rgba(6,6,14,0.95)`, border `1px solid rgba(200,168,78,0.35)`, border-radius 8px, z-index 99999
- Cost lacking color: `#d94a4a`

### Settings Panel (In-Game)
- Position: absolute top 52px right 16px, width 260px
- bg `rgba(6, 6, 14, 0.92)`, border `1px solid rgba(200, 168, 78, 0.15)`, border-radius 8px
- Toggle On: bg `rgba(74, 217, 74, 0.2)`, color `#4ad94a`, border `rgba(74, 217, 74, 0.3)`
- Toggle Off: bg `rgba(139, 0, 0, 0.2)`, color `#d94a4a`, border `rgba(217, 74, 74, 0.2)`

### Quit Button
- bg `rgba(139, 0, 0, 0.5)`, border `1px solid rgba(217, 74, 74, 0.3)`, color `#d94a4a`
- Hover: bg `rgba(180, 30, 30, 0.6)`, border `rgba(217, 74, 74, 0.5)`, color `#ff6666`

### Mobile Toggle
- 36x36px (30x30 landscape), bg `rgba(6, 6, 14, 0.85)`, border `1px solid rgba(200, 168, 78, 0.2)`, border-radius 6px
- Color: `#c8a84e`, 18px (14px landscape)
- Open state: bg `rgba(200, 168, 78, 0.15)`

---

## 15. Game Map Rendering

### Ocean Background
- Fill: `0x134e6f` (deep teal/ocean blue)
- Grid pattern: `lineStyle(1, 0x1a4a7a, 0.15)`, 60px grid spacing
- Padding: 300px around map bounds

### Landmass Outer Glow
- `lineStyle(6, 0x1a3a6a, 0.4)` around all region outlines

### Region Rendering
- **Fill**: Player color (from PLAYER_COLORS) or `0x1e2030` (neutral) or `0x2a2a2a` (rocky)
- **Outset**: 1.5px outset from centroid (covers gaps between adjacent polygons)
- **Border**: `lineStyle(3, 0x000000, 0.8)` (3px black border)
- **Highlight edge**: Fill color lightened by 15% (applied per-vertex inner edge)

### Region Type Decorations

#### TOWER (Castle/Fortress)
- Glow: `0xFFD700` (gold), inner circle radius 20px at 0.12 alpha, outer 30px at 0.06
- Castle icon: drawn with Phaser graphics
  - Base: `0xFFD700` at 0.9 alpha
  - Three turrets with merlons (pixel rectangles)
  - Gate/door: `0x000000` at 0.5 alpha
  - Outline: `lineStyle(1, 0xB8860B, 0.8)` (dark gold)
- Glow animation: `Sine.easeInOut` 2000ms, scale 0.9-1.1, alpha 0.8-1.0, yoyo infinite

#### MOUNTAIN (Shield/Defense)
- Glow: `0x4488ff` (blue), inner 22px at 0.1, outer 30px at 0.06
- Shield icon: drawn with Phaser graphics
  - Body: `0x4488cc` at 0.85 (pointed bottom shape)
  - Border: `lineStyle(1.5, 0x88bbff, 0.7)`
  - Inner cross: `lineStyle(1.5, 0xffffff, 0.5)`
  - Highlight stripe: `0xffffff` at 0.15
- Defense badge text: color `#88bbff`, bold, font size based on area
- Glow animation: 2500ms cycle

#### SNOW
- Scattered white dots across polygon (spacing 12px, jitter 8px)
- Dot size: 1 to 2.8px radius, alpha 0.15-0.35
- Fill: `0xffffff`

#### ROCKY (Impassable)
- Hatched line pattern: `lineStyle(1.5, 0x666666, 0.5)`, diagonal lines at ~30deg spacing 12px
- No HP text displayed (always 0)

#### SPEED (Lightning)
- Green streaks: `lineStyle(1, 0x88ff44, alpha)` with varying opacity
- Lightning bolt pattern across region

#### SPAWN
- Player icon (shield shape) drawn with Phaser graphics
  - Glow: player color at 0.08 and 0.15 alpha
  - Shield: player color at 0.9 alpha
  - White cross: `lineStyle(1.5, 0xffffff, 0.6)` and fill `0xffffff` at 0.8

### Owner Glow
- Animated pulsing glow around owned regions
- Color: player's hex color
- Stripe pattern: alternating fill at 0.4 alpha

### Fog of War
- Overlay: `fillStyle(0x050812, 0.65)` polygon fill
- Depth: 18 (above regions, below text)
- When fogged: all text, decorations, and resource icons hidden
- When cleared: everything restored

### Region Text
| Element | Style |
|---------|-------|
| HP (health) | White, bold, 9-22px (area-based), black stroke 2-4px thickness, resolution 2 |
| Defense badge | `#88bbff`, bold, 7-17px, black stroke 2px, alpha 0.8 |
| Resource icon | Colored by resource type, 7-18px, black stroke 2px, resolution 3, alpha 0.85 |

### Army Sprites
- Shape: drawn with Phaser graphics (diamond/arrow shape)
- Size: calculated from army count
- Count text: white, bold, 12px, Arial, black stroke 3px, depth 51
- Skin support: custom shapes and trail effects

### Army Trail Effects
- **Sparkle**: white/gold/cream particles
- **Fire**: orange/red/gold particles
- **Ice**: teal/sky blue/white particles
- **Rainbow**: cycling ROYGBIV colors

### Capture Effects
| Effect | Visual |
|--------|--------|
| Sparkle | 14 particles radiating outward, colors `[playerColor, 0xFFD700, 0xFFFFFF]` |
| Shockwave | Expanding ring `lineStyle(3, color, 0.8)`, secondary white ring |
| Flames | Fire-colored particles `[0xFF4500, 0xFF6600, 0xFF8C00, 0xFFD700, 0xFF0000]` + red glow |
| Lightning | Jagged bolt lines `lineStyle(2, 0x88CCFF, 0.9)` + white flash + cyan sparks |

### Siege Rendering
- Pixel-based BFS territory spreading
- Scale: 0.5 (canvas 2x region size for crispness)
- Each attacker gets own color spread from entry point
- Multiple colors can spread simultaneously into same region
- Rendered on off-screen canvas, applied as Phaser texture

### Gate/Portal Rendering
- Outer glow circle (portal radius 11px)
- Rotating diamond/rhombus shape inside
- Orbiting particle dots
- "GATE" label: Arial, 10px, bold
- Pulsing scale animation with breathing effect
- Connection lines shown only on hover
- Color-matched portal pairs

---

## 16. Game Over Screen

### Background
- Camera: `#06060e`
- Floating particles: 30 dots, size 0.5-2px
  - Victory: `0xC8A84E` (gold), alpha 0.05-0.15
  - Defeat: `0x8B2020` (dark red), same alpha range
- Particles pulse: `Sine.easeInOut` 1500-3000ms, alpha doubles, yoyo infinite

### Main Card
- Width: min(420-520px, screenWidth - 20-40px), height: min(640px, screenHeight - 30px)
- Card glow: `0xC8A84E` (victory) or `0x8B2020` (defeat), alpha 0.06, 8px larger, border-radius 16px
- Card bg: `0x080814` at 0.95 alpha, border-radius 12px
- Card border: `lineStyle(1, 0xC8A84E, 0.2)`
- Top accent bar: `0xC8A84E` at 0.8, 4px tall, rounded top corners

### Victory/Defeat Title
- Font: Cinzel, 28-42px (responsive), bold
- Victory: `#C8A84E`, Defeat: `#D94A4A`
- Black stroke: 4px
- Entry animation: `Back.easeOut` 500ms (scale from 0 to 1)

### Winner Badge
- bg `0x0f0f1e`, border `lineStyle(1, 0xC8A84E, 0.25)`, border-radius 8px
- Player color dot: 5px radius, solid color
- Name text: 14px, bold, Inter, player color

### Battle Stats
- Section header: Cinzel, 10px, bold, `rgba(200,168,78,0.6)`, letter-spacing 2
- Labels: 11-13px, Inter, `rgba(200,168,78,0.45)`
- Values: 12-14px, Inter, bold, `#e8e0d0`

### Diamond Reward
- Badge bg: `0x1a1520`, border `lineStyle(1, 0xC8A84E, 0.3)`, border-radius 8px
- Text: Cinzel, 16-20px, bold, `#C8A84E`
- Entry: `Back.easeOut` 400ms, 300ms delay

### Scoreboard
- Player rows: 30-34px height
- My row: bg `0xC8A84E` at 0.06 alpha, border-radius 5px
- Winner position: `#C8A84E`, Cinzel, bold
- Player name bar: 3x16px rounded rect in player color (0.3 alpha if eliminated, 0.9 if active)
- Status badges:
  - Won: bg `0x3d3010` at 0.5, text `#C8A84E`
  - Eliminated: bg `0x7f1d1d` at 0.5, text `#f87171`
  - Active: bg `0x1e3a5f` at 0.5, text `#60a5fa`

### Ranked Section
- ELO change: bg `0x3d3010` (positive) or `0x7f1d1d` (negative) at 0.3, border-radius 8px
- ELO text: Cinzel, 20-26px, bold, `#C8A84E` (positive) or `#D94A4A` (negative), black stroke 2px

### Separator
- `lineStyle(1, 0xC8A84E, 0.12)`, horizontal line with 24px padding from card edges

### Buttons
- bg: `0xC8A84E` at 0.9, border-radius 8px
- Text: Cinzel, 13-15px, bold, `#0a0a14` (dark text on gold)
- Border: `lineStyle(1, 0xC8A84E, 0.3)` (0.5 on hover)
- Width: 160-190px, height: 36-38px

### Victory Confetti
- 50 particles: circles (size/2 radius) and rectangles (size x size*0.5)
- Colors: `[0xC8A84E, 0xFFD700, 0xE8C547, 0xD4A843, 0xF5D680, 0xffffff, 0xff8800]`
- Animation: fall from top, scatter +-100px, rotate +-360deg, `Quad.easeIn` 1500-2500ms

---

## 17. Game UI Overlays

### Toasts
- Position: absolute bottom 80px (60px mobile, 50px landscape), centered
- bg `rgba(6, 6, 14, 0.9)`, border `1px solid rgba(200, 168, 78, 0.15)`, border-radius 6px
- Font: 13px (12px mobile), `#d0d0e0`
- Backdrop: `blur(8px)`, text-shadow `0 1px 2px rgba(0, 0, 0, 0.5)`
- Animation: `ghud-toastIn` 0.3s (slide up from 10px)

### Region Hover Tooltip
- Position: absolute, follows cursor (left + 15px, top - 10px)
- bg `rgba(6, 6, 14, 0.92)`, border `1px solid rgba(200, 168, 78, 0.25)`, border-radius 6px
- Font: 11px
- HP: `#d0d0e0`, weight 600
- Building: `#c8a84e`
- Resource: `rgba(200,200,220,0.5)`

### Spawn Selection Overlay
- Full-width top overlay, z-index 50, padded 60px from top (20px mobile)
- Card: bg `rgba(6, 6, 14, 0.85)`, border `2px solid rgba(74, 217, 74, 0.4)`, border-radius 12px
- Box shadow: `0 0 40px rgba(74, 217, 74, 0.15), 0 4px 30px rgba(0, 0, 0, 0.5)`
- Title: Cinzel, 24px (14-18px mobile), weight 700, `#4ad94a`, text-shadow green glow
- Timer number: Cinzel, 48px (28-36px mobile), weight 900, `#4ad94a`, text-shadow green glow
- Animation: `ghud-countPulse` 0.5s (scale from 1.3)

### Spawn Confirm Dialog
- Border: `rgba(74, 217, 74, 0.3)`
- Title: `#4ad94a`
- Region name: Cinzel, 16px, `#c8a84e`
- Yes button: bg `rgba(74, 217, 74, 0.2)`, border `rgba(74, 217, 74, 0.4)`, color `#4ad94a`

### Map Preview Countdown
- Full-screen overlay: bg `rgba(0, 0, 0, 0.4)`, z-index 50
- Card: bg `rgba(6, 6, 14, 0.75)`, border `1px solid rgba(200, 168, 78, 0.2)`, border-radius 8px
- Box shadow: `0 0 80px rgba(0, 0, 0, 0.5)`
- Title: Cinzel, 28px (20px mobile, 16px landscape), weight 700, `#c8a84e`
- Count: Cinzel, 72px (52px mobile, 44px landscape), weight 900, `#4A90D9`, text-shadow blue glow
- Animation: `ghud-countPulse` scale from 1.3

### Quit/Eliminated Dialog
- Overlay: bg `rgba(0, 0, 0, 0.6)`, `blur(4px)`, z-index 100
- Dialog: bg `rgba(8, 8, 20, 0.95)`, border `1px solid rgba(200, 168, 78, 0.25)`, border-radius 8px
- Ornamental corners: 16x16px, `rgba(200, 168, 78, 0.35)`, 2px
- Title: Cinzel, 20px (17px mobile, 16px landscape), weight 700, `#c8a84e`
- Eliminated title: `#d94a4a`, text-shadow `0 0 20px rgba(217, 74, 74, 0.3)`
- Text: `rgba(200, 200, 220, 0.7)`, 14px (12px landscape)
- Button "Yes" (destructive): bg `rgba(139, 0, 0, 0.5)`, border `rgba(217, 74, 74, 0.4)`, color `#d94a4a`
- Button "No" (neutral): bg `rgba(42, 42, 78, 0.5)`, border `rgba(100, 100, 170, 0.3)`, color `rgba(170, 170, 200, 0.8)`

### Ability Bar (Right Side, Phaser)
- Vertical slot panel: bg `0x0a0e1a` at 0.85, border `1px solid #333355` at 0.6, border-radius 8px
- Slot: bg `0x1a1a2e` at 0.95, border-radius 6px, border `2px solid [ability.color]` at 0.5
- Cooldown overlay: semi-transparent dark overlay over slot
- Cooldown text: white, bold, 14px, Arial, black stroke 3px
- Charge badge: white 10px bold on `#333366` background
- Key label: `#888899`, monospace, bold, 9-11px
- Mode indicator: `#ff6644`, bold, 10-12px

---

## 18. CSS Patterns & Variables

### CSS Custom Properties Used
```css
var(--map-color)     /* Per-map accent color (set inline) */
var(--mode-color)    /* Per-mode accent color (set inline) */
var(--stat-color)    /* Per-stat category color (set inline) */
var(--league-color)  /* Per-league rank color (set inline) */
```

### `color-mix()` Usage
```css
color-mix(in srgb, var(--mode-color) 40%, transparent)   /* Mode card hover border */
color-mix(in srgb, var(--mode-color) 10%, transparent)    /* Mode card hover shadow */
color-mix(in srgb, var(--map-color) 15%, transparent)     /* Selected map card shadow */
```

### Common Panel Pattern
```css
background: rgba(6, 6, 14, 0.85);
border: 1px solid rgba(200, 168, 78, 0.1);
border-radius: 6px;
backdrop-filter: blur(8px);
-webkit-backdrop-filter: blur(8px);
```

### Common Button Pattern
```css
background: rgba(10, 10, 25, 0.5);
border: 1px solid rgba(200, 168, 78, 0.15);
border-radius: 4px;
color: #d0d0e0;
cursor: pointer;
transition: all 0.2s;
-webkit-tap-highlight-color: transparent;
```

### Scrollbar Styling
```css
::-webkit-scrollbar { width: 3-4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(200, 168, 78, 0.2); border-radius: 2px; }
/* Firefox */
scrollbar-width: thin;
scrollbar-color: rgba(200, 168, 78, 0.2) transparent;
```

### No Scrollbar Pattern
```css
scrollbar-width: none;
::-webkit-scrollbar { display: none; }
```

---

## 19. Responsive Breakpoints

### CSS Media Queries (Auth)
| Breakpoint | Target |
|-----------|--------|
| `min-width: 601px and max-width: 1024px` | Tablet portrait (iPad) |
| `min-width: 901px and max-height: 700px` | Tablet landscape |
| `max-width: 600px` | Mobile portrait |
| `max-height: 500px` | Mobile landscape / very short screens |
| `max-width: 375px` | Very small phones (iPhone SE) |

### CSS Media Queries (Menu)
| Breakpoint | Target |
|-----------|--------|
| `max-width: 768px` | Tablet |
| `max-width: 480px` | Mobile portrait |
| `max-height: 500px` | Landscape |
| `max-width: 600px` | Admin panel mobile |

### CSS Media Queries (Game HUD)
| Breakpoint | Target |
|-----------|--------|
| `max-width: 1199px` | Tablet |
| `max-width: 767px` | Mobile |
| `max-width: 768px` | Spawn overlay mobile |
| `max-height: 500px` | Mobile landscape |

### Phaser Responsive (JavaScript `pick()` helper)
```javascript
// pick(screenWidth, mobileValue, tabletValue, desktopValue)
// Mobile: width < 768px
// Tablet: 768px <= width < 1200px
// Desktop: width >= 1200px
```

### Safe Area Handling
```css
padding-top: max(16px, env(safe-area-inset-top));
padding-bottom: max(16px, env(safe-area-inset-bottom));
padding-left: max(10px, env(safe-area-inset-left));
padding-right: max(20px, env(safe-area-inset-right));
```

---

## 20. Z-Index Layering

### CSS Z-Index Stack
| Layer | Z-Index | Element |
|-------|---------|---------|
| Auth container | 9999 | `.auth-container` |
| Auth overlay | 1 | `.auth-overlay` |
| Building tooltip | 9999 | `.building-tooltip` (inline portal) |
| Lobby overlay | 500 | `.lobby-overlay` |
| Daily popup | 200 | `.daily-popup-overlay` |
| Menu container | 100 | `.menu-container` |
| Quit/dialog overlay | 100 | `.ghud-overlay` |
| Region tooltip | 60 | `.ghud-region-tooltip` |
| Spawn confirm | 55 | `.ghud-spawn-confirm-overlay` |
| Spawn phase / preview | 50 | `.ghud-spawn-phase`, `.ghud-preview` |
| Settings panel | 40 | `.ghud-settings-panel` |
| Building bar | 20 | `.building-bar` |
| Mobile toggle | 20 | `.ghud-mobile-toggle` |
| Mobile left panel | 15 | `.ghud-left.mobile-open` |
| Menu header | 10 | `.menu-header` |
| Game HUD root | 10 | `.ghud` |

### Phaser Depth Stack
| Layer | Depth | Element |
|-------|-------|---------|
| Confetti | 900 | Victory confetti particles |
| Ability bar hit zones | 501 | Interactive areas |
| Ability bar UI | 500 | Ability panel |
| Camera region name | 500+ | Region name tooltip |
| Player list UI | 200-201 | UI overlay panel |
| Capture effects | 100 | Sparkle/shockwave/flames/lightning |
| Army count text | 51 | Army labels |
| Army graphics | 50 | Army shapes |
| Gate portals | 50 | Gate containers |
| Type decorations | 22 | Tower/mountain/spawn containers |
| Region text | 20 | HP, badge, resource text |
| Fog overlay | 18 | Fog polygon fill |
| Highlight layer | 15 | Selection highlights |
| Snow decoration | 12 | Snow dot patterns |
| Region graphics | 10 | Region fill/border |
| Landmass glow | 5 | Outer glow ring |
| Ocean background | 1 | Ocean + grid |

---

## 21. Animation Catalog

### CSS Animations
| Name | Duration | Easing | Description |
|------|----------|--------|-------------|
| `authFadeIn` | 0.8s | ease-out | Auth panel entrance (opacity + translateY) |
| `authFadeOut` | 0.6s | ease-in | Auth panel exit (opacity to 0) |
| `logoGlow` | 3s | ease-in-out infinite alternate | Logo drop-shadow pulse |
| `titleGlow` | 3s | ease-in-out infinite alternate | Title text-shadow pulse |
| `msgSlide` | 0.3s | ease-out | Error/success message slide |
| `menuFadeIn` | 0.5s | ease-out | Menu container fade |
| `menuSlide` | 0.3s | ease-out | Menu messages slide |
| `lobbyIn` | 0.3s | ease-out | Lobby overlay fade |
| `lobbySpin` | 1s | linear infinite | Spinner ring rotation |
| `countPulse` | 0.5s | ease-out | Countdown number pulse (scale 1.5 -> 1) |
| `dotPulse` | 1.5s | ease-in-out infinite | Waiting dot opacity |
| `ghud-fadeIn` | 0.2-0.4s | ease-out | HUD elements fade (opacity + translateY) |
| `ghud-toastIn` | 0.3s | ease-out | Toast slide up |
| `ghud-countPulse` | 0.5s | ease-out | Countdown pulse (scale 1.3 -> 1) |
| `dailyPulse` | 2s | ease-in-out infinite | Available reward cell shadow pulse |
| `dailyPopupIn` | 0.4s | cubic-bezier(0.34, 1.56, 0.64, 1) | Popup bounce entrance |
| `dailyDiamondSpin` | 3s | ease-in-out infinite | Diamond Y-axis rotation |
| `dailyCollectedIn` | 0.4s | ease-out | Collected checkmark scale |
| `gear-spin` | 8s | linear infinite | Settings gear rotation |

### CSS Transitions (Global Patterns)
| Property | Duration | Easing |
|----------|----------|--------|
| `all` (buttons) | 0.15-0.3s | ease (default) |
| `border-color` (inputs) | 0.3s | ease |
| `box-shadow` (inputs) | 0.3s | ease |
| `color` (links/tabs) | 0.3s | ease |
| `background` (buttons) | 0.2s | ease |
| `width` (progress bars) | 0.5s | ease |
| `transform` (cards) | 0.25s | ease |

### Phaser Tween Animations
| Target | Property | Duration | Easing |
|--------|----------|----------|--------|
| Tower glow | alpha 0.8->1, scale 0.9->1.1 | 2000ms | Sine.easeInOut, yoyo infinite |
| Mountain glow | alpha 0.7->1, scale 0.9->1.1 | 2500ms | Sine.easeInOut, yoyo infinite |
| Background particles | alpha doubles | 1500-3000ms | Sine.easeInOut, yoyo infinite |
| Victory title | scale 0->1 | 500ms | Back.easeOut |
| ELO text | scale 0->1 | 400ms delay 400ms | Back.easeOut |
| Diamond reward | scale 0->1 | 400ms delay 300ms | Back.easeOut |
| Capture sparkle | x/y outward, alpha->0, scale->0.2 | 500-800ms | Quad.easeOut |
| Capture shockwave | ring scale 0->3, alpha->0 | 600ms | Quad.easeOut |
| Confetti | y fall, x scatter, angle | 1500-2500ms | Quad.easeIn |

---

## 22. Asset Inventory

### Fonts (Google Fonts CDN)
- **Cinzel**: weights 400, 700, 900
- **Inter**: weights 300, 400, 500, 600

### Images
| Path | Format | Usage |
|------|--------|-------|
| `client/public/logo-full.svg` | SVG | Auth screen logo |
| `client/public/logo-full.png` | PNG | Auth screen fallback |
| `client/public/logo-icon.svg` | SVG | Menu header logo |
| `client/public/logo-icon.png` | PNG | Menu header fallback |
| `client/public/favicon.svg` | SVG | Browser tab icon |
| `client/public/favicon.png` | PNG | Browser tab fallback |
| `client/public/icons/resource-iron.svg` | SVG | Iron resource icon |
| `client/public/icons/resource-crystal.svg` | SVG | Crystal resource icon |
| `client/public/icons/resource-uranium.svg` | SVG | Uranium resource icon |
| `client/public/assets/fog/fog1.png` | PNG | Fog texture 1 |
| `client/public/assets/fog/fog2.png` | PNG | Fog texture 2 |

### Audio
| Path | Format | Usage |
|------|--------|-------|
| `client/public/audio/menu-music.mp3` | MP3 | Menu background music |

### Map Data
| Path | Format | Usage |
|------|--------|-------|
| `client/public/maps/turkey.json` | JSON | Turkey map (91 regions) |
| `client/public/maps/poland.json` | JSON | Poland map (73 regions) |
| `client/public/maps/china.json` | JSON | China map (34 regions) |

### Key Constants
```javascript
GAME_WIDTH = 1600
GAME_HEIGHT = 900
VERSION = '0.14.0'
MAPS_PER_ROW = 3
```

---

## Summary of Design Tokens

### The "KUST Gold" System
The entire UI is built around a single primary accent color with variations:

| Token | Value | Usage |
|-------|-------|-------|
| `gold-100` | `rgba(200, 168, 78, 0.04-0.08)` | Background tints, hover states |
| `gold-200` | `rgba(200, 168, 78, 0.1-0.15)` | Panel backgrounds, button fills |
| `gold-300` | `rgba(200, 168, 78, 0.2-0.3)` | Borders, stronger backgrounds |
| `gold-400` | `rgba(200, 168, 78, 0.35-0.5)` | Active borders, focus states |
| `gold-500` | `#c8a84e` | Text, active tabs, primary accent |
| `gold-600` | `#a8882e` | Dark gradient end |
| `gold-700` | `#B8860B` / `0x8B6914` | Dark gold outlines |
| `gold-glow` | `rgba(200, 168, 78, 0.2-0.4)` | Text shadows, box shadows |

### The Dark Background System
| Token | Value | Usage |
|-------|-------|-------|
| `dark-900` | `#06060e` / `rgba(6, 6, 14, ...)` | Deepest backgrounds |
| `dark-800` | `#080814` / `rgba(8, 8, 20, ...)` | Panel backgrounds |
| `dark-700` | `rgba(10, 10, 25, ...)` | Card backgrounds |
| `dark-600` | `rgba(12, 12, 30, ...)` | Input backgrounds |
| `dark-500` | `rgba(15, 15, 30, ...)` | Lighter card variants |
| `dark-400` | `rgba(20, 20, 40, ...)` | Store tabs inactive |

### The Semantic Color System
| Token | Color | Usage |
|-------|-------|-------|
| `error` | `#d94a4a` / `rgba(217, 74, 74, ...)` | Errors, destructive actions, eliminated |
| `success` | `#4ad94a` / `rgba(74, 217, 74, ...)` | Success, equip, spawn overlay |
| `warning` | `#f59e0b` / `rgba(245, 158, 11, ...)` | Ranked mode, waiting state |
| `info` | `#4A90D9` / `rgba(74, 144, 217, ...)` | Map badge, countdown, neutral info |
| `muted` | `rgba(200, 200, 220, 0.3-0.5)` | Disabled, placeholder, secondary text |
