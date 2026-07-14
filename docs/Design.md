---
name: Obsidian Slate
colors:
  surface: '#101415'
  surface-dim: '#101415'
  surface-bright: '#363a3b'
  surface-container-lowest: '#0b0f10'
  surface-container-low: '#191c1e'
  surface-container: '#1d2022'
  surface-container-high: '#272a2c'
  surface-container-highest: '#323537'
  on-surface: '#e0e3e5'
  on-surface-variant: '#c6c6cd'
  inverse-surface: '#e0e3e5'
  inverse-on-surface: '#2d3133'
  outline: '#909097'
  outline-variant: '#45464d'
  surface-tint: '#bec6e0'
  primary: '#bec6e0'
  on-primary: '#283044'
  primary-container: '#0f172a'
  on-primary-container: '#798098'
  inverse-primary: '#565e74'
  secondary: '#7bd0ff'
  on-secondary: '#00354a'
  secondary-container: '#00a6e0'
  on-secondary-container: '#00374d'
  tertiary: '#b9c8de'
  on-tertiary: '#233143'
  tertiary-container: '#081828'
  on-tertiary-container: '#738296'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#d4e4fa'
  tertiary-fixed-dim: '#b9c8de'
  on-tertiary-fixed: '#0d1c2d'
  on-tertiary-fixed-variant: '#39485a'
  background: '#101415'
  on-background: '#e0e3e5'
  surface-variant: '#323537'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  lyric-display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '500'
    lineHeight: 48px
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1440px
  gutter: 24px
---

## Brand & Style

The design system is built on the philosophy of **Focused Utility**. It prioritizes content clarity and operational efficiency for presenters, ensuring the interface recedes into the background while the content takes center stage.

The style is **Refined Minimalism** with a technical edge. It avoids unnecessary decoration, utilizing generous whitespace, precision alignment, and a sophisticated dark-mode-first approach. The emotional response is one of calm control, reliability, and professional readiness. It feels like a high-end tool—intentional, sturdy, and elegant.

## Colors

The palette is anchored by **Deep Slate (#0F172A)** to minimize eye strain in low-light environments typical for presentations. 

- **Primary Surface:** Deep Slate provides a stable, "infinite" background.
- **Accent:** A vibrant **Sky Blue (#38BDF8)** is used sparingly for primary actions like "Go Live," ensuring high visibility without being distracting.
- **Content:** **Crisp White (#F8FAFC)** and **Cool Gray (#94A3B8)** are used for text and secondary interface elements to maintain a clear hierarchy.
- **Status:** Success (Emerald), Warning (Amber), and Error (Rose) colors are desaturated to fit the professional aesthetic while remaining functional.

## Typography

This design system utilizes **Inter** for its exceptional legibility and systematic feel. For technical metadata and labels, **JetBrains Mono** is introduced to reinforce the "tool-like" utility aesthetic.

- **Scale:** A tight typographic scale ensures that headers don't overpower the screen.
- **Lyrics:** A specific `lyric-display` role is defined for song text, optimized for quick scanning from a distance.
- **Emphasis:** Use medium weight for interactive elements and semi-bold for section headers to maintain a clear functional distinction.

## Layout & Spacing

The layout follows a **4px baseline grid** for rigorous alignment. 

- **Desktop:** A 12-column fluid grid with 24px gutters. The layout typically features a fixed-width left sidebar for navigation and a flexible central workspace.
- **Toolbars:** Secondary controls are housed in persistent horizontal bars with 16px internal padding.
- **Responsive:** On tablet and mobile, the sidebar collapses into a bottom sheet or drawer, prioritizing the "Live View" content area.
- **Safe Areas:** For the presentation stage, a 5% margin "Safe Zone" is maintained to prevent content clipping on external displays.

## Elevation & Depth

Hierarchy is achieved through **Tonal Layers** rather than heavy shadows.

- **Base Level:** The background is the darkest slate.
- **Level 1 (Cards/Lists):** A slightly lighter slate (approx. 5% lighter) with a subtle 1px border (#FFFFFF10).
- **Level 2 (Modals/Popovers):** Higher contrast surfaces with a soft, 20% opacity black shadow (0px 8px 24px) and a backdrop blur of 8px.
- **Active State:** Elements currently "Live" or selected utilize a subtle outer glow of the secondary color (#38BDF8) to denote focus.

## Shapes

The design system uses **Soft (0.25rem)** roundedness to maintain a professional, architectural feel. 

- **Inputs & Buttons:** 4px radius (rounded-sm).
- **Cards & Resource Containers:** 8px radius (rounded-lg).
- **Selection Indicators:** Sharp 2px vertical bars for active list items.
- **Avoidance:** Circles and high-radius pills are avoided except for user avatars to keep the interface looking like a precision instrument.

## Components

### Buttons
- **Primary ("Go Live"):** Solid Sky Blue with white text. High prominence.
- **Secondary:** Transparent with a 1px slate-gray border.
- **Ghost:** No background/border, used for utility actions in toolbars.

### Cards (Programs & Resources)
- Minimal padding (16px).
- Title in `body-lg` (bold), metadata in `label-sm` (mono font).
- Hover state: Border color shifts from translucent to the secondary accent.

### List Items (Song Lyrics)
- Alternating subtle background tints for readability.
- "Active" line highlighted with a left-side 4px Sky Blue accent bar.
- Large click targets for easy navigation during a live session.

### Input Fields
- Darker than the card surface to create a "well" effect.
- 1px border that glows Sky Blue on focus.
- Monospaced font for technical inputs (timing, hex codes).

### Live Indicator
- A pulsing "On Air" component using a desaturated red, placed top-right to provide constant status awareness without causing visual fatigue.