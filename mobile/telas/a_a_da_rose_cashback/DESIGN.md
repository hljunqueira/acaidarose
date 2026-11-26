---
name: Açaí da Rose Cashback
colors:
  surface: '#fff7fb'
  surface-dim: '#efd0f2'
  surface-bright: '#fff7fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ffeffd'
  surface-container: '#ffe6ff'
  surface-container-high: '#fddfff'
  surface-container-highest: '#f8d8fb'
  on-surface: '#28142d'
  on-surface-variant: '#4f4352'
  inverse-surface: '#3e2943'
  inverse-on-surface: '#ffebfe'
  outline: '#817283'
  outline-variant: '#d2c1d4'
  surface-tint: '#9226bf'
  primary: '#6a0092'
  on-primary: '#ffffff'
  primary-container: '#8a1bb8'
  on-primary-container: '#efbcff'
  inverse-primary: '#ebb2ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#6d2e00'
  on-tertiary: '#ffffff'
  tertiary-container: '#914000'
  on-tertiary-container: '#ffc1a0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#f8d8ff'
  primary-fixed-dim: '#ebb2ff'
  on-primary-fixed: '#320047'
  on-primary-fixed-variant: '#74009f'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb68e'
  on-tertiary-fixed: '#331200'
  on-tertiary-fixed-variant: '#763300'
  background: '#fff7fb'
  on-background: '#28142d'
  surface-variant: '#f8d8fb'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Outfit
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.005em
  title-lg:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.5rem
  gutter-lg: 2rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes an ultra-premium, tactile-clean retail rewards atmosphere tailored specifically for high-frequency loyalty engagement and multi-store operations. It balances indulgence with transactional efficiency: vibrant culinary freshness paired with structured, bank-grade fidelity for tracking earnings, tiers, and store-specific incentives.

The visual direction converges Modern Minimalism with Tactile Warmth:
- **Pristine Surfaces**: Expansive crisp whites (#FFFFFF) anchored by calibrated cool-violet neutrals create a canvas of high clarity and premium polish.
- **Deep Botanical Contrast**: Substituting harsh generic blacks with deep blackberry and grape shades grounds the interface, delivering warmth, legibility, and organic harmony.
- **Vibrant Energy Nodes**: Saturated açaí berry purples evoke the signature food experience, fresh mint-emerald accents convey instant liquidity and success, and warm metallic golds signify loyalty dividends and redemption value.
- **Location-Aware Focus**: Multi-store contexts (geolocation alerts, individual store inventories, and local multiplier campaigns) receive dedicated visual treatments via contextual ribbons, subtle badge overlays, and status-driven containers.

## Colors

The palette leverages high-chroma accent colors against deeply refined organic neutral surfaces. Each hue executes a specific communicative function:

- **Primary (`#8A1BB8` / `#9D32DC`)**: The core brand signature. Used for primary interactive triggers, active tab selections, loyalty tier indicators, and store location spotlights.
- **Secondary (`#10B981`)**: The liquidity signal. Used strictly for cashback earnings, positive wallet deltas, active discount statuses, and store open/operational badges.
- **Tertiary (`#B45309` / `#D97706`)**: The currency token. Applied to gold point tallies, VIP milestone status, cashback conversion rings, and limited-time multiplier multipliers (e.g., "2x Points at Downtown Mall").
- **Neutral Foregrounds**:
  - `text-primary` (`#1D0E20`): Deepest grape-blackberry; provides authoritative contrast for headings and critical metrics.
  - `text-secondary` (`#2E1A33` with 72% opacity): Balanced deep violet-slate for standard labels, addresses, and body copy.
  - `text-tertiary` (`#2E1A33` with 45% opacity): Subdued contextual metadata, timestamps, and placeholder states.
- **Neutral Backgrounds & Surfaces**:
  - `surface-canvas` (`#FFFFFF`): Pure white canvas for primary interaction density.
  - `surface-subtle` (`#F8F9FA`): Secondary groupings and page-level contrasting backdrops.
  - `surface-container` (`#F4F5F7`): Segmented controllers, chip bases, and nested data cards.
  - `border-subtle` (`#1D0E20` at 6% opacity): Soft structural boundary definition.
  - `border-prominent` (`#1D0E20` at 12% opacity): Interactive controls, active store boundaries, and form fields.

## Typography

The dual typographic hierarchy marries the contemporary geometry of **Outfit** with the refined legibility of **Plus Jakarta Sans**:

- **Outfit (Display & Titles)**: Provides high-end consumer elegance. Characterized by wide proportions and clean circular geometry, it reinforces the upbeat brand presence in balance totals, rewards milestones, promotional headings, and store titles.
- **Plus Jakarta Sans (Body & Labels)**: Carries operational clarity across high-density layouts—transaction ledgers, store addresses, kilometer markers, and interactive micro-copy. Its open counters and robust x-height maintain crisp readability even at dense 10px and 12px metadata levels.
- **Numerical Formatting**: Financial values (Cashback balance, point tallies, percentages) always employ tabular numeric alignment (`font-variant-numeric: tabular-nums`) within Outfit to ensure steady alignment across dynamic recalculations.

## Layout & Spacing

This system implements an intentional rhythm optimized for rapid thumb navigation on mobile and organized multi-column data on desktop dashboards:

- **Layout Grid**:
  - **Mobile (< 768px)**: 4-column layout with `1rem` margins and `1rem` gutters. Primary interface relies heavily on edge-to-edge content containers within a safe-area cushion.
  - **Tablet (768px - 1024px)**: 8-column layout with `1.5rem` margins and `1.5rem` gutters. Accommodates split views (e.g., interactive store map alongside scrollable location cards).
  - **Desktop (> 1024px)**: 12-column fixed-max layout (max-width `1280px`) with `2.5rem` outer canvas padding and `2rem` gutters.
- **Component Geometry & Distance**:
  - `space-xs` (4px): Nested icon-to-text separation, pill dot offsets.
  - `space-sm` (8px): Spacing inside compact lists, badge paddings, tag groupings.
  - `space-md` (16px): Standard gap between actionable items, internal card padding, input fields.
  - `space-lg` (24px): Structural padding for featured rewards cards, bottom-sheet headers, modal borders.
  - `space-xl` (32px): Vertical separation between categorical functional zones (e.g., wallet summary block to active multi-store selector).

## Elevation & Depth

Visual hierarchy uses a refined ambient-layering approach that keeps light backgrounds feeling clean and airy rather than sterile:

- **Ambient Shadows**: Shadows reject muddy greys; instead, they feature ultra-subtle grape tints (`rgba(29, 14, 32, ...)`) that blend into the visual identity:
  - **Level 0 (Flat)**: Nested elements within parent cards. Distinct boundaries are achieved through the `surface-container` background (`#F4F5F7`) and fine line work.
  - **Level 1 (Subtle Lift - Cards & Pickers)**: `0px 2px 8px -2px rgba(29, 14, 32, 0.04), 0px 4px 16px -4px rgba(29, 14, 32, 0.06)`. Bound by a 1px crisp outline of `#1D0E20` at 6% opacity.
  - **Level 2 (Active & Floating - Selected Store, Persistent Bar)**: `0px 8px 24px -6px rgba(138, 27, 184, 0.08), 0px 4px 12px -2px rgba(29, 14, 32, 0.04)`. Imbues primary accent glow to indicate focus.
  - **Level 3 (Overlays - Sheets, Dialogs, Location Drawers)**: `0px 16px 40px -8px rgba(29, 14, 32, 0.16)`. Combined with a backdrop blur filter (`backdrop-filter: blur(12px)`) on pure white surfaces at 90% alpha.

## Shapes

The design system incorporates modern, friendly rounded contours that match the organic, welcoming quality of the brand:

- **Base Radius (`rounded-md`: 8px)**: Inputs, selection controls, inline tags, and micro-steppers.
- **Large Radius (`rounded-lg`: 16px)**: Standard transactional cards, product cards, individual store list items, and modal actions.
- **Extra-Large Radius (`rounded-xl`: 24px)**: Featured loyalty balance summary cards, main store switcher selector hero, bottom sheets, and promotional hero banners.
- **Full Radius (`rounded-full`)**: Cashback badges, points indicators, avatar enclosures, and floating contextual filters.

## Components

### Store Location Selector & Multi-Store Awareness
- **Primary Selector Bar**: A sticky header component containing:
  - Left: Store pin icon colored with primary `#8A1BB8`, store name (`title-md`), and status indicator dot (`#10B981` = Open, muted = Closed).
  - Center/Right: Distance display (e.g., "1.2 km away") in `body-sm`, and a dropdown arrow.
  - Action: Clicking initiates the Full Location Modal or Drawer.
- **Location Card**:
  - Encased in a `rounded-lg` container (16px) with an ambient Level 1 shadow.
  - Features an active border highlight: `2px solid #8A1BB8` when selected, with a background shifting from `#FFFFFF` to an ultra-soft `#8A1BB8` at 3% opacity.
  - Contains: Store nickname, address, walking/driving distance, specific cashback multiplier badges (e.g., "5% Cashback Today"), and a quick-action "Set as My Store" button.

### Buttons & Interactive Controls
- **Primary Button**: Solid fill with `#8A1BB8` (hover: `#9D32DC`), sharp white text, `rounded-md` (or `rounded-full` for consumer checkout CTAs), font `label-lg`. Height: 48px.
- **Cashback Action Button**: Solid `#10B981` (hover: `#059669`) with white text, utilized strictly for "Redeem Cashback" or "Claim Reward" conversions.
- **Secondary / Ghost Button**: Translucent background (`#8A1BB8` at 8% opacity) with primary text and borderless perimeter.

### Chips & Badges
- **Cashback Gain Badge**: Pill-shaped container (`rounded-full`), `#10B981` background at 12% opacity, deep emerald text (`#065F46`), and a bold Plus Jakarta Sans label (`label-sm`).
- **Points/Loyalty Badge**: Pill-shaped container, `#B45309` at 12% opacity, warm amber text (`#92400E`), accompanied by a metallic coin icon.
- **Store Distance Chip**: Neutral surface (`#F4F5F7`), slate-blackberry text (`#2E1A33`), border outline at 6% opacity.

### Form Inputs & Checkboxes
- **Input Fields**: 48px height, `rounded-md`, background `#FFFFFF`, border `1px solid rgba(29, 14, 32, 0.12)`. When focused: border jumps to `#8A1BB8` with a subtle focus ring (`0 0 0 3px rgba(138, 27, 184, 0.15)`). Text color `#1D0E20`.
- **Checkboxes & Radios**: Custom circular or soft-square components styled in primary purple `#8A1BB8` when checked, with high-contrast white checkmarks and radio dots.

### Cards & Data Containers
- **Cashback Balance Hero**: Built on a `rounded-xl` (24px) surface with crisp white backdrop, reinforced with a subtle linear gradient border (`#8A1BB8` down to `#B45309` at 20% opacity). Large tabular figures for currency balance in `#1D0E20` (`display-lg`), accompanied by a secondary conversion ticker showing accrued gold points.
- **Transaction History List**: Edge-to-edge separation with `1px solid rgba(29, 14, 32, 0.06)`, high-contrast timestamps, designated store location tag, and explicit `+$X.XX` figures in emerald `#10B981`.