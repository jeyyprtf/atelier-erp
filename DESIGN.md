# Atelier — Design System

A calm, gallery-quiet design language. Bone canvas, hairline borders, a single warm clay accent, serif display + clean sans body, and smooth restrained motion. This document is self-contained — copy it into any new project to reproduce the exact look.

**Stack it was built on:** React 19 + Tailwind CSS v4 (CSS-first `@theme`) + Framer Motion. But the tokens are framework-agnostic — the hex values and scales work anywhere.

---

## 1. Design Philosophy

> "An art gallery, not a dashboard."

| Principle | In practice |
|---|---|
| **Quiet canvas** | Off-white "bone" background, never pure white. Content floats like framed art. |
| **Hairline over heavy** | 1px borders in a soft warm gray. No drop shadows except on lifted/floating elements. |
| **One accent, held back** | A single terracotta "clay" used sparingly — active states, progress, focus. Never two accents. |
| **Serif display, sans body** | Fraunces (serif, optical-size aware) for headings; Inter for everything else. |
| **Motion that breathes** | Short eased transitions (0.15–0.25s). Fades and small lifts, never bounce or spin (except spinners). |
| **Generous whitespace** | Let things sit. Padding is large; density is low. |

---

## 2. Color Tokens

The system uses **semantic token names** (not literal colors). The same names flip between light and dark, so every component adapts automatically.

### Light (default)

| Token | Hex | Role |
|---|---|---|
| `bone` | `#fafaf7` | Primary background (the canvas) |
| `canvas` | `#f3f1ea` | Secondary surface (inset panels, hover fills, badges) |
| `ink` | `#1a1a1a` | Primary text & solid buttons |
| `muted` | `#6b6862` | Secondary text, labels, captions |
| `hairline` | `#e6e3dc` | All borders & dividers (1px) |
| `clay` | `#b6452c` | The single accent — terracotta |
| `clay-soft` | `#f0e2db` | Accent tint (active badge backgrounds) |

### Dark (warm charcoal — NOT cold black)

| Token | Hex | Role |
|---|---|---|
| `bone` | `#15140f` | Primary background |
| `canvas` | `#1e1c16` | Secondary surface |
| `ink` | `#ecebe3` | Primary text |
| `muted` | `#9c978c` | Secondary text |
| `hairline` | `#2c2922` | Borders & dividers |
| `clay` | `#cf6244` | Accent (brightened for dark) |
| `clay-soft` | `#3a261f` | Accent tint |

### Status colors (semantic, for badges/states)

| State | Light | Dark |
|---|---|---|
| Neutral / To Do | `canvas` bg + `muted` text | same |
| In progress | `clay-soft` bg + `clay` text | same |
| Pending / warning | `amber-100` bg + `amber-700` text | `amber-500/15` bg + `amber-300` text |
| Done / success | `emerald-100` bg + `emerald-700` text | `emerald-500/15` bg + `emerald-300` text |

> **Key idea:** dark mode reuses the *same token names* by overriding the CSS variables under `html.dark`. You never write `dark:bg-...` for core surfaces — `bg-bone` just becomes dark automatically.

---

## 3. Typography

| Role | Font | Weights | Usage |
|---|---|---|---|
| **Display** | Fraunces (serif) | 400, 500, 600, 700 | Page titles, card headings, numbers in stats. Always `tracking-tight`. |
| **Body** | Inter (sans) | 400, 500, 600 | Everything else. |

**Google Fonts link:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
```

### Type scale (Tailwind classes)

| Element | Classes |
|---|---|
| Page title | `font-display text-3xl tracking-tight sm:text-4xl` |
| Card / modal heading | `font-display text-2xl tracking-tight` (or `text-xl`) |
| Section label | `text-sm font-medium uppercase tracking-wider text-muted` |
| Field label | `text-xs font-medium uppercase tracking-wider text-muted` |
| Body | `text-sm` (default), `leading-relaxed` for prose |
| Caption / hint | `text-xs text-muted` |
| Big stat number | `font-display text-2xl tracking-tight` |

---

## 4. Setup (Tailwind v4, CSS-first)

This is the entire theme. No `tailwind.config.js` — tokens live in CSS.

```css
/* src/index.css */
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-bone: #fafaf7;
  --color-canvas: #f3f1ea;
  --color-ink: #1a1a1a;
  --color-muted: #6b6862;
  --color-hairline: #e6e3dc;
  --color-clay: #b6452c;
  --color-clay-soft: #f0e2db;

  --font-display: "Fraunces", Georgia, serif;
  --font-sans: "Inter", system-ui, sans-serif;
}

/* dark palette — same token names, so every bg-bone/text-ink flips automatically */
html.dark {
  --color-bone: #15140f;
  --color-canvas: #1e1c16;
  --color-ink: #ecebe3;
  --color-muted: #9c978c;
  --color-hairline: #2c2922;
  --color-clay: #cf6244;
  --color-clay-soft: #3a261f;
}

html, body, #root { height: 100%; }

body {
  background: var(--color-bone);
  color: var(--color-ink);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  transition: background-color 0.25s ease, color 0.25s ease;
}

/* thin, gallery-style scrollbar */
* { scrollbar-width: thin; scrollbar-color: var(--color-hairline) transparent; }
```

This generates utilities like `bg-bone`, `text-ink`, `border-hairline`, `text-clay`, `font-display`, etc.

### Dark-mode toggle (FOUC-free)

Put this in `<head>` **before** any CSS, so theme is set before first paint:

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem('theme') || 'system'
      var dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.classList.toggle('dark', dark)
    } catch (e) {}
  })()
</script>
```

Then a tiny provider sets `localStorage.theme` to `light` / `dark` / `system` and toggles `html.dark`.

---

## 5. Shape, Spacing & Borders

| Property | Value | Token |
|---|---|---|
| Card radius | `rounded-2xl` (1rem) | large surfaces |
| Input / small radius | `rounded-xl` (0.75rem) | inputs, nav items |
| Pill / button radius | `rounded-full` | buttons, badges, chips |
| Border | `border border-hairline` | 1px, always hairline color |
| Card padding | `p-5` to `p-6` | generous |
| Section gap | `space-y-5` / `gap-6` | breathing room |
| Page padding | `px-4 py-9 lg:px-10` | |
| Shadow (only when lifted) | `shadow-sm` resting, `shadow-md` on hover, `shadow-xl` for modals | never on flat cards |

**Rule:** flat cards get a hairline border, NOT a shadow. Shadows are reserved for things that float (modals, dropdowns) or lift on hover.

---

## 6. Motion (Framer Motion)

Restrained and quick. The vocabulary is small on purpose.

| Pattern | Spec |
|---|---|
| **Page transition** | `initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}` · `duration: 0.15, ease: 'easeOut'` · wrap routes in `<AnimatePresence mode="wait">` keyed by pathname. **Opacity only** — no y-translate (avoids layout jank). |
| **Modal** | backdrop fades; panel `initial={{opacity:0, y:16, scale:0.98}} → animate={{opacity:1, y:0, scale:1}}` · `duration: 0.2, ease: 'easeOut'` |
| **Dropdown / popover** | `initial={{opacity:0, y:-8, scale:0.97}} → animate={{...0,1}}` · `duration: 0.15` |
| **Mobile drawer** | `initial={{x:'-100%'}} → animate={{x:0}}` · `type:'tween', duration:0.25, ease:'easeOut'` |
| **Button press** | `whileTap={{ scale: 0.97 }}` |
| **Card hover** | CSS only: `transition-shadow hover:shadow-md` |
| **Progress bar fill** | `initial={{width:0}} animate={{width:'X%'}}` · `duration: 0.5, ease: 'easeOut'` |
| **Hero / entrance** | `initial={{opacity:0, scale:0.97}} animate={{opacity:1, scale:1}}` · `duration: 0.9–1, ease: 'easeOut'` |

**Never:** spring bounce, rotation (except the loading spinner), or durations over ~1s. Motion should feel like a calm exhale.

---

## 7. Component Recipes

Exact Tailwind class strings, copy-paste ready.

### Button
```jsx
const base = 'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50'
const variants = {
  primary: 'bg-ink text-bone hover:bg-clay',          // dark fill, clay on hover
  clay:    'bg-clay text-bone hover:opacity-90',       // accent fill
  ghost:   'border border-hairline bg-transparent text-ink hover:border-ink',
  subtle:  'bg-canvas text-ink hover:bg-hairline',
}
// wrap in <motion.button whileTap={{ scale: 0.97 }}>
```

### Input / Textarea / Select
```
w-full rounded-xl border border-hairline bg-bone px-4 py-2.5 text-sm text-ink
outline-none transition-colors placeholder:text-muted/60 focus:border-ink
disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted
```
Focus = border darkens to `ink` (no glow ring). Textarea adds `resize-none`.

### Field wrapper
```jsx
<label className="block">
  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">{label}</span>
  {children}
  {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
</label>
```

### Card
```
rounded-2xl border border-hairline bg-bone
```
Clickable card adds: `cursor-pointer transition-shadow hover:shadow-md`

### Badge / Pill
```
whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium
```
+ status color pair from §2.

### Chip (toggle, e.g. multi-select)
```
// off:
rounded-full border border-hairline px-3 py-1.5 text-xs text-muted hover:border-ink hover:text-ink
// on:
rounded-full border border-ink bg-ink text-bone px-3 py-1.5 text-xs
```

### Segmented control (theme/language switch)
```jsx
<div className="inline-flex rounded-full border border-hairline p-1">
  {options.map(o => (
    <button className={`rounded-full px-4 py-1.5 text-sm transition-colors
      ${active ? 'bg-ink text-bone' : 'text-muted hover:text-ink'}`}>{o.label}</button>
  ))}
</div>
```

### Progress bar
```jsx
<div className="h-1.5 w-full overflow-hidden rounded-full bg-hairline">
  <motion.div className="h-full rounded-full bg-clay"
    initial={{width:0}} animate={{width:`${value}%`}} transition={{duration:0.5, ease:'easeOut'}} />
</div>
```

### Avatar (image, else initials)
```jsx
// with url: <img className="shrink-0 rounded-full object-cover" />
// fallback: initials on a solid ink circle, bone text
<span className="inline-grid shrink-0 place-items-center rounded-full bg-ink font-medium text-bone"
  style={{ width: size, height: size, fontSize: size * 0.36 }}>{initials}</span>
```

### Spinner
```jsx
<span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-hairline border-t-clay" />
```

### Empty state
```jsx
<div className="grid place-items-center rounded-2xl border border-dashed border-hairline py-16 text-center">
  <p className="font-display text-xl text-ink">{title}</p>
  <p className="mt-1 text-sm text-muted">{hint}</p>
</div>
```

### Modal shell
```jsx
// overlay: fixed inset-0 z-50 grid place-items-center p-4
// backdrop: absolute inset-0 bg-black/40 backdrop-blur-sm
// panel:   relative max-h-[88vh] w-full max-w-lg overflow-y-auto
//          rounded-2xl border border-hairline bg-bone p-6 shadow-xl
// + Escape-to-close + body scroll lock
```

---

## 8. Layout Pattern

| Region | Spec |
|---|---|
| **Desktop sidebar** | Fixed left, `w-60`, `border-r border-hairline`, `bg-bone`. Brand wordmark top (Fraunces), nav middle, user block bottom. |
| **Nav item** | `rounded-xl px-3 py-2.5 text-sm`. Active: `bg-canvas text-ink` + a `1.5px` clay dot. Inactive: `text-muted hover:text-ink`. |
| **Mobile** | Sidebar → slide-in drawer (hamburger in a fixed top bar). Backdrop `bg-black/40`. |
| **Content** | `lg:ml-60`, padded `px-4 py-9 lg:px-10`. Max readable width for forms: `max-w-2xl`. |
| **Kanban/grid** | `grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4` — stacks on mobile, 4-up on wide. |

**Responsive rule:** one column on mobile, expand at `sm:` and `xl:`. Sidebar hidden under `lg:`, replaced by drawer.

---

## 9. Iconography

Inline SVG, `stroke="currentColor"`, `strokeWidth="1.6–1.8"`, `strokeLinecap="round"`. No icon library — hand-drawn paths keep weight consistent with the hairline aesthetic. Sizes 14–18px inline.

---

## 10. Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| Off-white `bone` background | Pure `#fff` |
| One clay accent | A second accent color |
| Hairline borders | Heavy shadows on flat cards |
| Fraunces for headings, tracking-tight | Serif for body text |
| Opacity fades, small lifts | Bounce, spin, long animations |
| `uppercase tracking-wider` micro-labels | All-caps body copy |
| Semantic tokens (`bg-bone`) | Hardcoded hex in components |
| Warm charcoal dark mode | Cold pure-black dark mode |

---

## 11. One-paragraph brief (paste to an AI)

> Build with an "art gallery" aesthetic: an off-white bone canvas (`#fafaf7`), 1px hairline borders (`#e6e3dc`), near-black ink text (`#1a1a1a`), warm gray muted text (`#6b6862`), and a single terracotta clay accent (`#b6452c`) used sparingly for active states and progress. Headings use Fraunces (serif, tracking-tight); body uses Inter. Cards are `rounded-2xl` with a hairline border and no shadow unless lifted; buttons and badges are `rounded-full`; inputs are `rounded-xl` and focus by darkening their border (no glow). Motion is Framer Motion, restrained: 0.15–0.25s opacity fades for pages, small scale/translate for modals, `whileTap scale 0.97` on buttons — never bounce or spin. Dark mode is warm charcoal (`#15140f`), achieved by overriding the same CSS color variables under `html.dark` so semantic classes flip automatically. Generous whitespace, low density, quiet confidence.

---

*Extracted from [Atelier — Team ERP](https://github.com/jeyyprtf/atelier-erp). MIT — reuse freely.*
