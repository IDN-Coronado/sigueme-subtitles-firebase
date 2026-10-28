# Design

Apostello's operator console: a dark, dense, keyboard-driven surface a
volunteer runs from the back of a room, usually in low light, often while
something else is happening. Legibility at small sizes and calm under
pressure matter more than decoration.

This document is **derived from the code**, not from intentions. Where the
app is inconsistent, it says so rather than describing an ideal that does not
exist. Counts below are occurrences in `src/` at the time of writing.

## Typography

Two faces, both loaded in [index.html](index.html) from Google Fonts in a
single request.

| Role | Face | Where |
| --- | --- | --- |
| UI text | **Instrument Sans** (400–700) | `body`, everything by default |
| Labels, badges, metadata | **JetBrains Mono** (400, 500) | the `MONO` inline style |

**Instrument Sans** was chosen over Inter for its tall x-height and slightly
narrow forms, which hold their shape at the 10–12px this interface leans on.
Its squarish terminals also sit comfortably beside the mono face.

**JetBrains Mono** carries every eyebrow label, badge, timestamp, shortcut
hint and count. This is the interface's main typographic gesture: sans for
prose, mono for anything the operator scans rather than reads.

It is applied through a `MONO` constant exported by
[`src/fonts.js`](src/fonts.js), imported by all 28 consumers:

```js
import { MONO } from "../fonts";
```

Import it rather than re-declaring the object. `font-mono` is also available
as a class now and is preferable in new markup; the inline style remains
because that is what the existing components use.

Families are declared once, in
[`tailwind.config.js`](tailwind.config.js). Preflight sets `html` from
`theme.fontFamily.sans`, so there is no `font-family` on `body`.

Both faces load over the network. `display=swap` means text still appears if
that fails, in the fallback face — acceptable, but self-hosting the two woff2
files would remove the dependency for a console that may run offline.

### Scale

Driven by density, not by a modular ratio:

| Token | Uses | Role |
| --- | --- | --- |
| `text-sm` | 96 | body and primary labels |
| `text-xs` | 54 | secondary and descriptions |
| `text-[10px]` | 36 | mono eyebrows and badges |
| `text-lg` / `text-2xl` | 18 / 13 | section and modal headings |
| `text-3xl` / `text-4xl` | 2 / 2 | the Home title only |

Mono labels are nearly always uppercase with wide tracking
(`tracking-[0.1em]` to `tracking-[0.16em]`).

## Colour

Canonical tokens live in `:root` in [src/index.css](src/index.css) and are
mirrored as Tailwind theme colours in
[tailwind.config.js](tailwind.config.js), so a class can name one
(`bg-surface`, `text-fg-muted`, `border-hairline`) instead of repeating a
hex. The two lists are duplicated rather than wired through `var()`, because
Tailwind needs literals to generate opacity modifiers like `bg-surface/60`;
change both or neither.

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#090B12` | app background |
| `--surface` | `#111521` | panels |
| `--card` | `#171C2B` | raised cards, icon wells |
| `--hover` | `#1E2540` | hover fill |
| `--primary` | `#6366F1` | primary action, active state (fills, borders) |
| `--primary-hover` | `#7C83FF` | hover and focus |
| `primary-fg` | `#818CF8` | accent text and icons (contrast) |
| `--accent` | `#00D4FF` | reserved accent |
| `--text` | `#F8FAFC` | primary text |
| `--text-2` | `#9AA3B2` | secondary text |
| `--border` | `rgba(255,255,255,0.08)` | hairlines |

Accent hues used for menu icon wells, each as a 20% fill behind a solid
glyph: indigo `#6366F1`, violet `#A78BFA`, teal `#2DD4BF`, rose `#F472B6`,
green `#4ADE80`, amber `#FCD34D`, sky `#38BDF8`.

Semantic: `#4ADE80` live/active, `#EF4444` destructive action, `#FFB4AB`
error text.

### Accent on text vs accent on shapes

`primary-fg` `#818CF8` is the accent for **text and icons**; `primary`
`#6366F1` is for **fills and borders**. This is not decoration. On `--bg`,
`primary` reaches only 4.40:1, below AA for normal text, and much of this
accent is set at 10px for an operator reading in a dark room. `primary-fg`
reaches 6.59:1. Borders and fills are held to 3:1, which `primary` clears.

Reach for `primary-fg` whenever the accent carries a word.

### No legacy palette

The console previously ran two palettes at once — the redesign's slate/indigo
and an older cyan/warm-grey — in roughly equal volume. They have been
unified; no solid legacy hex remains. The mapping used, should you meet one
in an old branch:

| Legacy | Now | Contrast on `--bg` |
| --- | --- | --- |
| `#7BD0FF` cyan accent | `primary-fg` (text) / `primary` (shapes) | 11.52 → 6.59 |
| `#C6C6CD` body grey | `fg-muted` | 11.57 → 7.73 |
| `#6B7280` muted grey | `fg-muted` | 4.07 → 7.73 |
| `#E0E3E5` bright text | `fg` | 15.25 → 18.79 |
| `#0B0F10` / `#101415` | `base` | — |
| `#1D2022` | `card` | — |
| `#45464D` | `hairline` (edges) / `fg-muted` (text) | — |

Colours still written as arbitrary values are neutral overlays — white and
grey at low alpha, such as `rgba(255,255,255,0.06)`. Those are scrim rather
than palette, and are deliberately not tokens.

**New work uses the named classes**, not hexes.

## Shape and spacing

| Radius | Uses | Role |
| --- | --- | --- |
| `rounded-lg` | 69 | cards, buttons, icon wells |
| `rounded-sm` | 58 | legacy equivalents |
| `rounded-xl` | 13 | the largest redesigned cards |
| `rounded-full` | 11 | status dots, pills |

Same split as the colour: `rounded-sm` is the old surface, `rounded-lg` the
new one. Borders are a single hairline at `rgba(255,255,255,0.08)`; elevation
comes from background steps (`--bg` → `--surface` → `--card`), not shadow.

Gaps and padding sit on Tailwind's default 4px scale. Modal and page bodies
use `p-5` rising to `sm:p-8`.

## Motion

Deliberately minimal — this runs behind a live service.

- `transition-colors` on anything interactive; no transform or layout animation.
- `animate-pulse` on the live/active status dot, the one piece of continuous motion.
- `schedule-item-active`, a 0.35s indigo ring that fires once when a schedule
  item is selected, defined in `src/index.css`.

There is no animation library. `framer-motion` was removed as unused; if
motion ever needs more than the above, reach for CSS first.

## Layout notes

Centred content uses `my-auto` on the child rather than `items-center` on the
flex parent. A centred flex child taller than the viewport overflows past the
top edge where the scrollbar cannot reach it; auto margins centre when there
is room and collapse when there is not. This matters on Home, whose menu
grows as features are added.

Scrollbars are hidden until scrolling, via an `is-scrolling` class toggled by
a global listener in [src/index.jsx](src/index.jsx).
