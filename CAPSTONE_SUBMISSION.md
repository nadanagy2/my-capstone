# Ask Your Data — Capstone Submission

## Project Brief

Ask Your Data is a manager-facing analytics dashboard that lets non-technical
users ask questions about their business data in plain English instead of
learning a query language or hunting through spreadsheets. It's built for
small-team managers who need quick answers ("what was our best day last
month?") without waiting on a data analyst. I chose this idea because it
combines a genuinely useful AI use case — grounding an LLM's answers in real
tool-called data instead of letting it guess — with enough structural depth
(streaming chat, tool calling, data visualization, a 3D view) to demonstrate
a full range of frontend skills in one coherent product rather than several
disconnected demos.

## Live Application

**URL:** https://my-capstone-bay.vercel.app

## Repository

**URL:** https://github.com/nadanagy2/my-capstone

### Setup & run

```bash
git clone https://github.com/nadanagy2/my-capstone.git
cd my-capstone
npm install
npm run dev
```

Requires a `.env.local` file with `GOOGLE_GENERATIVE_AI_API_KEY` (free key at
[aistudio.google.com/apikey](https://aistudio.google.com/apikey)) for the Ask
chat to function; every other page works without it.

## Architecture overview

| Part | What it does |
|---|---|
| `app/page.js` | Dashboard — real computed stats (revenue, orders, top category) and a revenue trend chart, all derived from `lib/sales-data.js` |
| `app/ask/page.js` | Streaming AI chat client using `useChat` from `@ai-sdk/react`, rendering four distinct tool-call lifecycle states |
| `app/api/chat/route.js` | Server route calling Gemini via `streamText`, with the `querySales` tool attached |
| `lib/ai-config.ts` | Single source of truth for the model, system prompt, and generation settings |
| `lib/sales-data.js` | The mock dataset and the `querySales` query/filter/aggregate function — the one data source powering the Dashboard chart, the Data table, the AI tool, and the 3D visualization |
| `lib/tools.ts` | The `querySales` tool definition (Zod schema + execute function) the AI can call |
| `app/visualize/page.js` | An interactive 3D "revenue skyline" (React Three Fiber) built from the same sales data |
| `app/components/AuroraHero.jsx` | Custom GLSL shader hero on the Dashboard |
| `app/data/page.js` | Raw sales records in table form |
| `app/health/page.js` | Health-check endpoint proving server-side data fetching works |
| `app/settings/page.js` | User settings, persisted to localStorage |
| `lib/sales-data.test.js` | Unit tests for the core `querySales` function |

## AI integration explained

The Ask page's assistant is built on Google Gemini (`gemini-3.6-flash`, via
the Vercel AI SDK) rather than Claude, since Anthropic's API requires paid
credits that weren't available for this project — the AI SDK's provider
abstraction made this a one-line swap.

The assistant isn't a plain chatbot: it has access to a `querySales` tool
(Zod-typed input schema, `lib/tools.ts`) that queries the real mock dataset
by date range, category, and grouping. The system prompt (`lib/ai-config.ts`)
explicitly instructs it to call this tool for any sales-related question
rather than inventing numbers — this is the "meaningful" part of the
integration: the AI's answers are grounded in actual data it retrieved, not
hallucinated, and the retrieval step is visible to the user as a distinct UI
state (a small "Querying sales data" indicator that becomes a real rendered
table, not a JSON dump).

## Known limitations & future improvements

- **Gemini's free tier has a daily request quota (20/day for this model).**
  If the live chat stops responding with "the conversation could not be
  completed," this is very likely the quota, not a bug — it's handled
  gracefully (no crash) but is a real constraint of the free tier.
- The Dashboard's revenue trend chart plots one data point per date; the
  mock dataset happens to have exactly one category per day, so this
  currently reads as "revenue per day" without summing multiple categories
  on the same date. If the dataset grows to include multiple categories per
  day, the chart's aggregation logic would need a small update to sum
  correctly.
- Settings currently persist to localStorage only (not synced across
  devices or accounts) — appropriate for this project's scope, but would
  need a real backend for multi-user use.
- With more time, I'd add: real user accounts and a real database instead of
  the mock dataset, more tool definitions (e.g., a comparison/forecast
  tool), and a fuller Vitest test suite covering the Ask chat's client-side
  rendering logic, not just the data layer.

## Testing evidence

7 unit tests for the `querySales` function (`lib/sales-data.test.js`),
covering: unfiltered queries, correct aggregation math, case-insensitive
category filtering, an empty-result edge case, date-range filtering, and
both grouping modes (category, region) including sort-order correctness.

```
Test Files  1 passed (1)
     Tests  7 passed (7)
```

Run locally with `npm run test`.

## Performance & accessibility audit

See [AUDIT.md](./AUDIT.md) for the full before/after Lighthouse and WAVE
audit. Summary:

- Homepage Lighthouse (Mobile): Performance 70 → 80, Accessibility 95 → 100
- WAVE: 2 Errors + 14 Contrast Errors found site-wide → 0 Errors, 1 justified
  false-positive alert remaining
- **One concrete improvement:** disabling Next.js `<Link>` prefetching on
  the two JS-heavy routes (`/ask`, `/visualize`) dropped the homepage's
  Total Blocking Time from 3,330 ms to ~860 ms — the homepage was silently
  downloading Three.js and the AI SDK in the background before this fix,
  despite having no 3D or chat content itself.

## Deployment & operation

**Deployment:** Vercel, connected to the `main` branch of the GitHub repo —
every push to `main` triggers an automatic production deployment.

**Environment variables:** `GOOGLE_GENERATIVE_AI_API_KEY` is set in Vercel's
Environment Variables settings (Production, Preview, Development), never
committed to the repo (`.env.local` is gitignored).

**Failure handling:**
- If the Gemini API fails or rate-limits, the Ask chat shows a designed
  error message ("The conversation could not be completed. Please try
  again.") instead of crashing — verified against a real quota-exceeded
  error during development.
- If a tool call receives invalid input (e.g., an unsupported `groupBy`
  value), it's rejected by Zod validation and rendered as a distinct,
  designed error card in the chat, not a crash.
- Every page has been tested keyboard-only and with WAVE; no known
  accessibility blockers remain unaddressed or undocumented.

**Rollback plan:** Vercel keeps every previous deployment. If a bad deploy
ships, the plan is to use Vercel's "Instant Rollback" on the previous known-
good deployment from the Deployments tab, then fix forward on `main` before
redeploying.

## Reflection

The hardest part of this whole capstone wasn't any single feature — it was
the AI SDK's version churn. Across FE-06 and FE-07 I hit repeated,
confusing failures (`messages.some is not a function`, missing exports)
that turned out to be caused by `ai`, `@ai-sdk/react`, and `@ai-sdk/google`
being on incompatible major versions, even though npm happily installed
them together without warning. The fix each time required actually reading
the installed packages' own type definitions rather than trusting
documentation or my own assumptions about the API shape — a genuinely
useful debugging skill that I don't think I'd have built if everything had
just worked on the first try.

If I did this again, I'd pin exact dependency versions from the start
instead of letting npm resolve "latest" for fast-moving packages like the
AI SDK, and I'd write the `querySales` unit tests before building the
dashboard and chat features on top of it, not after — testing the data
layer first would have caught a couple of small edge cases earlier.

The thing that surprised me most: how much of "making it feel like a real
product" had nothing to do with the AI features at all. The single biggest
visual jump in this whole project was replacing three placeholder "Summary
Card" divs with real computed numbers and a chart — a five-minute change
that did more for how legitimate the app looks than any of the harder
technical work around it.
