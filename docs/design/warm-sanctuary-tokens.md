# Warm Sanctuary — Design Tokens (LetMeDesign)

Sumber: LetMeDesign design system (Replit), di-capture 2026-08-07.
Visual language untuk **Let Me Hear You** — platform kesehatan mental yang hangat dan ramah untuk semua usia.

**Tema:** Warm Sanctuary
**Fonts:** Poppins (sans/body), Heebo (heading/serif), JetBrains Mono (mono)

---

## Warna / Color tokens (HSL triplet, dipakai via `hsl(var(--x))`)

### Light `:root`

| Token | HSL triplet | Peran |
|---|---|---|
| `--background` | `42 70.1% 86.9%` | warm cream/oat base |
| `--foreground` | `37 16.9% 15.1%` | warm near-black brown |
| `--card` | `44 86.7% 94.1%` | lighter cream |
| `--card-foreground` | `37 16.9% 15.1%` | |
| `--popover` | `44 86.7% 94.1%` | |
| `--popover-foreground` | `37 16.9% 15.1%` | |
| `--border` | `45 43.8% 76.3%` | warm taupe |
| `--input` | `45 43.8% 76.3%` | = border |
| `--primary` | `257 68.1% 72.9%` | **brand — soft periwinkle lavender** |
| `--primary-foreground` | `0 0% 100%` | white |
| `--secondary` | `344 81.5% 87.3%` | soft blush pink |
| `--secondary-foreground` | `336 35.1% 22.4%` | deep wine/burgundy |
| `--muted` | `42 59.6% 80.6%` | warm sand |
| `--muted-foreground` | `39 16.2% 41.2%` | warm gray-brown |
| `--accent` | `337 53.1% 80.8%` | rosy pink |
| `--accent-foreground` | `333 34.1% 17.8%` | deep burgundy |
| `--destructive` | `0 60.5% 53.3%` | red |
| `--destructive-foreground` | `0 0% 100%` | white |
| `--ring` | `257 68.1% 72.9%` | = primary lavender |
| `--chart-1` | `257 68.1% 72.9%` | lavender |
| `--chart-2` | `344 81.5% 87.3%` | blush pink |
| `--chart-3` | `264 29.3% 51.2%` | muted purple |
| `--chart-4` | `30 84.2% 62.7%` | warm orange/coral |
| `--chart-5` | `169 39.6% 58.4%` | teal/eucalyptus green |
| `--radius` | `0.75rem` | corner radius |

### Sidebar (Light)

`--sidebar: 44 67.3% 78.4%` · `--sidebar-foreground: 37 16.9% 15.1%` ·
`--sidebar-border: 45 43.8% 76.3%` · `--sidebar-primary: 257 68.1% 72.9%` ·
`--sidebar-primary-foreground: 0 0% 100%` · `--sidebar-accent: 344 81.5% 87.3%` ·
`--sidebar-accent-foreground: 336 35.1% 22.4%` · `--sidebar-ring: 257 68.1% 72.9%`

### Dark `.dark`

| Token | HSL triplet | Peran |
|---|---|---|
| `--background` | `253 29% 12.2%` | deep plum/charcoal |
| `--foreground` | `42 70.1% 86.9%` | cream |
| `--card` | `250 28.7% 17.1%` | dark plum |
| `--card-foreground` | `42 70.1% 86.9%` | |
| `--popover` | `250 28.7% 17.1%` | |
| `--popover-foreground` | `42 70.1% 86.9%` | |
| `--border` | `254 27.9% 23.9%` | |
| `--input` | `254 27.9% 23.9%` | |
| `--primary` | `263 70.6% 80%` | lighter lavender brand |
| `--primary-foreground` | `253 29% 12.2%` | dark plum |
| `--secondary` | `264 28.8% 25.9%` | dark purple-gray |
| `--secondary-foreground` | `42 70.1% 86.9%` | |
| `--muted` | `252 26.6% 21.4%` | |
| `--muted-foreground` | `0 7.8% 59.6%` | gray |
| `--accent` | `339 41.5% 63.1%` | muted mauve/rose |
| `--accent-foreground` | `42 70.1% 86.9%` | |
| `--destructive` | `0 54.1% 47.8%` | red |
| `--destructive-foreground` | `42 70.1% 86.9%` | |
| `--ring` | `263 70.6% 80%` | |
| `--chart-1` | `263 70.6% 80%` | lavender |
| `--chart-2` | `338 44.9% 69.4%` | blush pink |
| `--chart-3` | `260 49.7% 66.5%` | purple |
| `--chart-4` | `30 84.2% 62.7%` | orange/coral |
| `--chart-5` | `169 39.6% 58.4%` | teal |
| `--radius` | `0.75rem` | |

### Sidebar (Dark)

— `--sidebar-background: 251 27.5% 15.7%` · `--sidebar-foreground: 40 54.9% 80%` ·
`--sidebar-border: 254 27.9% 23.9%` · `--sidebar-primary: 263 70.6% 80%` ·
`--sidebar-primary-foreground: 253 29% 12.2%` · `--sidebar-accent: 252 26.6% 21.4%` ·
`--sidebar-accent-foreground: 40 54.9% 80%` · `--sidebar-ring: 263 70.6% 80%`

---

## 2. Typography

- `--app-font-sans: Poppins, sans-serif` — body/UI
- `--app-font-serif: Heebo, sans-serif` — heading/serif role
- `--app-font-mono: JetBrains Mono, monospace` — code/kbd/samp/pre

### Weights dimuat (Google Fonts)
- Poppins: 300, 400, 500, 600, 700 (+ italic 400, 600)
- Heebo: 300, 400, 500, 600, 700, 800, 900
- JetBrains Mono: 400, 500 (+ italic 400)

### Ukuran teks
xs `.75rem` · sm `.875rem` · base `1rem` · lg `1.125rem` · 2xl `1.5rem` · 3xl `1.875rem` · 4xl `2.25rem` · 5xl `3rem` · 6xl `3.75rem` · 7xl `4.5rem` · 8xl `6rem` · 9xl `8rem`

Line heights: `--leading-snug: 1.375`, `--leading-normal: 1.5`, `--leading-relaxed: 1.625`.
Tracking: `--tracking-tight: -0.025em`, `--tracking-wide: 0.025em`, `--tracking-widest: 0.1em`.

---

## 3. Radius & Spacing

- `--radius: 0.75rem`
- Radius scale: `sm = calc(var(--radius) - 4px)`, `md = -2px`, `lg = var(--radius)`, `xl = +4px`
- Nganti Tailwind default radius utilities di `@theme inline` dipetakan dari `--radius`.

---

## 4. Shadows / outline theming (light → dark)

- `--button-outline: rgba(0,0,0,.10)` → `rgba(255,255,255,.10)`
- `--badge-outline: rgba(0,0,0,.05)` → `rgba(255,255,255,.05)`
- `--elevate-1: rgba(0,0,0,.03)` → `rgba(255,255,255,.04)`
- `--elevate-2: rgba(0,0,0,.08)` → `rgba(255,255,255,.09)`
- `--opaque-button-border-intensity: -8` → `9` (via `hsl(from ... calc(l + var(...)) / alpha)`)

---

## 5. Struktur Design System (komponen yang ditampilkan browser)

Brand: **Logo** (wordmark LMHAY).
Foundations: **Color roles**, **Type scale**, **Spacing & radius**.
Actions: Buttons, Button group, Toggle, Toggle group.
Forms & inputs: Input, Input group, Input OTP, Textarea, Checkbox, Radio group, Select, Slider, Switch, Calendar, Field, Form.
Overlays: Dialog, Alert dialog, Sheet, Drawer, Popover, Hover card, Tooltip, Command.
Menus & navigation: Dropdown menu, Context menu, Menubar, Navigation menu, Breadcrumb, Pagination, Tabs, Sidebar.
Data display: Avatar, Badge, Card, Table, Accordion, Collapsible, Carousel, Item, Empty state, Keyboard key, Aspect ratio.
Feedback: Alert, Progress, Skeleton, Spinner, Toast, Sonner.
Structure: Separator, Scroll area, Resizable.
Content: **Voice and tone** (warm, clear, stigma-free language).
Charts: Chart.

**Nuansa:** brand = soft periwinkle lavender (`257 68.1% 72.9%` light / `263 70.6% 80%` dark), supportive = warm cream + blush/wine. Dark mode = cocktail of deep plum + lavender primary.