# my-capstone — Ask Your Data

A manager-facing analytics dashboard where users ask questions about their
data in plain language and get answers grounded in real (mock) data, via a
streaming AI chat with server-side tool calling.

Built for the FlyRank Frontend AI Engineering internship track.

## Getting started

**Requirements:** [Node.js](https://nodejs.org/) (LTS recommended) and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Go to the **Ask** page to try the streaming
chat with tool calling.

### Environment variables

Create a `.env.local` file (never committed) with:

```
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
```

Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

## Screens

| Route | Purpose |
| --- | --- |
| `/` | Dashboard overview |
| `/ask` | Streaming AI chat with tool calling (core feature) |
| `/data` | Dataset view |
| `/health` | Health-check page (fetches and renders mock status data) |
| `/settings` | App settings (placeholder) |

## Tool contract: `querySales`

The `/ask` chat can call a server-side tool to answer questions using a mock
sales dataset, defined in `lib/tools.ts`.

**Name:** `querySales`

**Description sent to the model:** Query the mock sales dataset for revenue
and order data. Supports filtering by date range and category, and optional
grouping by category or region.

**Input schema (Zod):**
```ts
{
  startDate?: string   // inclusive, "YYYY-MM-DD"
  endDate?: string     // inclusive, "YYYY-MM-DD"
  category?: string    // "Electronics" | "Apparel" | "Home"
  groupBy?: "category" | "region" | "none"   // defaults to "none"
}
```
All fields are optional — an empty call returns the full dataset.

**Return shape:**
```ts
{
  rows: Array<{ date, revenue, orders, category, region }>  // when groupBy is "none"
      | Array<{ key, revenue, orders }>                      // when grouped
  totalRevenue: number
  totalOrders: number
  groupedBy: "none" | "category" | "region"
}
```

**Failure behavior:** an invalid `groupBy` value is rejected by the Zod
schema before the tool ever executes, and the UI renders a designed error
card rather than crashing. See `app/ask/page.js`'s `ToolCallPart` component
for the four rendered states: `input-streaming`, `input-available`,
`output-available`, `output-error`.

## Known limitation

This app uses Google Gemini's free tier (Anthropic's API requires paid
credits, which weren't available for this project). The free tier has a
daily request quota; if you see "The conversation could not be completed,"
it's likely the quota was hit rather than a bug — this is handled gracefully
rather than crashing the app.

## Stack

- Next.js (App Router), JavaScript
- Tailwind CSS
- Vercel AI SDK (`ai`, `@ai-sdk/react`, `@ai-sdk/google`)
- Zod for tool input validation
- Deployed on Vercel

## Other scripts

| Command | Purpose |
| --- | --- |
| `npm run build` | Production build |
| `npm run start` | Run the production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest |

See [CLAUDE.md](./CLAUDE.md) for project conventions and [SPEC.md](./SPEC.md)
for the product spec.

## 3D Revenue Skyline (`/visualize`)

An interactive 3D bar chart built with React Three Fiber, visualizing the
same mock sales dataset used by the "Ask" tool-calling feature — each bar
represents one day's revenue, colored by category.

**Interactions:**
- Orbit/zoom the scene (mouse drag + scroll, or touch drag + pinch on mobile)
- Hover a bar for a floating tooltip with date, revenue, and category
- Click a bar to dim all other categories (click again to clear the filter)

**Responsible loading:**
- The 3D canvas is lazy-loaded via `next/dynamic` with `ssr: false`, so
  Three.js only loads on this specific route, not on every page load
- No external 3D models — geometry is generated from data, keeping the
  bundle lean
- Respects `prefers-reduced-motion`: renders a static 2D bar chart instead
  of the 3D scene when the user's system requests reduced motion

**Perf note:** On first load (cache disabled), the page transfers ~554 kB
across 24 requests (~1.8 MB total resources including cached chunks), with
a full load time around 2.7s on a throttled connection profile. Interaction
(orbit/hover/click) felt smooth in manual testing on both desktop and a
simulated mobile viewport; a full frame-rate profile with DevTools'
Performance panel would be the next step to get exact numbers.

**With more time, I'd add:** a proper FPS/performance profile with DevTools,
level-of-detail reduction for larger datasets, and wiring the click-filter
to actually filter the `/data` table view too, so the 3D chart and the rest
of the dashboard stay in sync.