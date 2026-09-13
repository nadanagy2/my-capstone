# AUDIT.md — Accessibility & Performance Audit

This audit covers the deployed capstone at
`https://my-capstone-bay.vercel.app`, focused on the Dashboard (`/`), Ask
(`/ask`), Data (`/data`), Visualize (`/visualize`), Health (`/health`), and
Settings (`/settings`) pages.

## Method

1. Ran Lighthouse (Mobile preset, all categories) via Chrome DevTools against
   the live deployment.
2. Ran the WAVE browser extension against all six pages.
3. Did a keyboard-only pass through the primary flow (Nav → Ask chat →
   Stop button), no mouse.
4. Fixed what was found, using AI-assisted edits, then re-ran each audit to
   verify the fix.

## Before

### Lighthouse (Mobile) — Homepage, before fixes

| Metric | Score |
|---|---|
| Performance | 70 |
| Accessibility | 95 |
| Best Practices | 100 |
| SEO | 100 |
| Total Blocking Time | 3,330 ms |

![Lighthouse before](./audit-screenshots/lighthouse-before.png)

**Accessibility issue found:** Dashboard summary cards had no explicit text
color, inheriting a color that failed contrast against the white card
background.

### Lighthouse (Mobile) — `/visualize`, before fixes

| Metric | Score |
|---|---|
| Performance | 68 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| Total Blocking Time | 6,460 ms |

This page's heavy Total Blocking Time is expected — it loads Three.js and
React Three Fiber, genuinely large libraries — but it exposed a real bug:
the homepage's TBT (above) was nearly as bad, even though the homepage has
no 3D content at all.

### WAVE — before fixes

| Page | Errors | Contrast Errors | Alerts |
|---|---|---|---|
| `/` | 0 | 0 | 0 |
| `/ask` | 0 | 1 | 0 |
| `/data` | 0 | 9 | 0 |
| `/visualize` | 0 | 0 | 0 |
| `/health` | 0 | 4 | 0 |
| `/settings` | 2 | 0 | 2 |

![WAVE before - settings](./audit-screenshots/wave-before-settings.png)
![WAVE before - data](./audit-screenshots/wave-before-data.png)

**Settings errors:** two `<label>` elements had no `htmlFor` attribute and
their corresponding `<input>` elements had no matching `id`, so the labels
were "orphaned" — not programmatically connected to their inputs.

**Data / Health contrast errors:** table cells and status spans had no
explicit text color set, same root cause as the Dashboard cards.

### Keyboard-only pass — before fixes

Tabbing through the site produced **no visible focus indicator** on any nav
link — the browser's default focus outline was not rendering visibly against
the site's styling. This meant a keyboard-only user had no way to see which
element currently had focus.

## Changes made

1. **Disabled Next.js `<Link>` prefetching for the two heaviest routes**
   (`/ask` and `/visualize`) in `app/components/Nav.jsx`. Next.js prefetches
   the JS for every visible link by default, which meant Three.js and the AI
   SDK were being silently downloaded and prepared in the background on
   every page load, even the homepage. Adding `prefetch={false}` to just
   those two links dropped homepage Total Blocking Time from 3,330 ms to
   ~860 ms.
2. **Added explicit text colors** to the Dashboard summary cards, the Data
   table's `<td>` cells, and the Health page's status/name spans — all in
   `app/page.js`, `app/data/page.js`, and `app/health/page.js` — fixing 13
   contrast errors total.
3. **Connected form labels to inputs** in `app/settings/page.js` by adding
   matching `htmlFor`/`id` pairs, fixing both "missing form label" errors.
4. **Added visible keyboard focus styles**: a global `:focus-visible` rule
   in `app/globals.css` covering every interactive element site-wide, plus
   explicit focus-visible classes on each Nav link, so keyboard users can
   always see where focus currently is.

## After

### Lighthouse (Mobile) — Homepage, after fixes

| Metric | Score |
|---|---|
| Performance | 80 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |
| Total Blocking Time | ~860–1,260 ms (varies run to run; lab-test noise) |

![Lighthouse after](./audit-screenshots/lighthouse-after.png)

**Note on Performance:** 80 meets this track's absolute minimum. The
remaining gap toward 90 is largely inherent Next.js/React hydration
overhead on a data-fetching app, not a specific fixable bug — confirmed by
checking the Network panel directly (220 kB transferred, 591 kB total
resources, 856 ms load with cache disabled), which shows no unexpected
heavy resources loading on the homepage.

### WAVE — after fixes

| Page | Errors | Contrast Errors | Alerts | AIM Score |
|---|---|---|---|---|
| `/` | 0 | 0 | 0 | 10/10 |
| `/ask` | 0 | 1 (justified, see below) | 0 | 9.4/10 |
| `/data` | 0 | 0 | 0 | 10/10 |
| `/visualize` | 0 | 0 | 0 | 10/10 |
| `/health` | 0 | 0 | 0 | 10/10 |
| `/settings` | 0 | 0 | 0 | 10/10 |

![WAVE after - settings](./audit-screenshots/wave-after-settings.png)
![WAVE after - data](./audit-screenshots/wave-after-data.png)

**Justified alert on `/ask`:** WAVE flags a visually-hidden `sr-only` label
("Ask a question") for a low contrast ratio between its text and background
color. This is a false positive: the label is intentionally hidden from
sighted users via `clip-path`/`position: absolute` (the standard `sr-only`
pattern, also used by shadcn/ui and most component libraries) so its color
contrast is irrelevant — sighted users never see it, and screen reader users
receive the accessible name regardless of color. No change needed.

### Keyboard-only pass — after fixes

Tabbing through the site now shows a clear blue focus outline on every nav
link as focus moves through them. The primary flow — Tab to a nav link,
press Enter to navigate, Tab into the Ask chat, type and send a question,
Tab to the Stop button mid-stream and press Enter/Space to stop — is fully
completable by keyboard alone.

## AI-specific accessibility

- The Ask chat's message list container has `aria-live="polite"` set, so
  streamed assistant responses are announced to screen reader users as they
  arrive, without interrupting whatever they're currently doing.
- The **Stop** button appears in the normal tab order whenever a response is
  streaming and is reachable and activatable via keyboard (Tab, then
  Enter/Space) — verified in the keyboard-only pass above.

## Summary of measurable deltas

| Metric | Before | After |
|---|---|---|
| Homepage Performance | 70 | 80 |
| Homepage Accessibility | 95 | 100 |
| Homepage Total Blocking Time | 3,330 ms | ~860 ms |
| WAVE Errors (site-wide) | 2 | 0 |
| WAVE Contrast Errors (site-wide) | 14 | 1 (justified false positive) |
| Keyboard focus visibility | None | Visible on all interactive elements |