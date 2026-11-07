# Ask Your Data

A manager-facing analytics dashboard. Each user signs up, uploads their own
sales data as a CSV, and then explores it through a dashboard, charts, a 3D
view, and a streaming AI assistant that answers questions in plain English
using real queries against their own data.

Built for the FlyRank Frontend AI Engineering internship track and being
extended into a real, multi-user product.

**Live:** https://my-capstone-bay.vercel.app

## What it does

- **Accounts and private data.** Email/password sign-up and login (Supabase
  Auth). Row Level Security in the database means each user can only ever read,
  insert, update or delete their own records.
- **CSV upload.** Users upload their own sales file, match their column names
  to the app's fields, and every row is validated before anything is saved.
- **Dashboard.** Total revenue, total orders, top category, a trend indicator
  and a revenue-over-time chart, all computed from the user's data.
- **AI assistant.** A streaming chat (Google Gemini via the Vercel AI SDK) that
  calls a typed `querySales` tool, so answers come from the user's real rows
  instead of the model guessing.
- **3D Revenue Skyline.** The same data as an interactive 3D bar chart.

## Getting started

**Requirements:** [Node.js](https://nodejs.org/) (LTS recommended), npm, a free
[Supabase](https://supabase.com) project, and a free
[Gemini API key](https://aistudio.google.com/apikey).

```bash
git clone https://github.com/nadanagy2/my-capstone.git
cd my-capstone
npm install
```

### 1. Set up Supabase

1. Create a new Supabase project.
2. In the **SQL Editor**, run this to create the table and its security rules:

```sql
create table sales_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  revenue numeric not null,
  orders integer not null,
  category text not null,
  region text not null,
  created_at timestamptz default now()
);

alter table sales_records enable row level security;

create policy "Users can view their own sales records"
  on sales_records for select using (auth.uid() = user_id);
create policy "Users can insert their own sales records"
  on sales_records for insert with check (auth.uid() = user_id);
create policy "Users can update their own sales records"
  on sales_records for update using (auth.uid() = user_id);
create policy "Users can delete their own sales records"
  on sales_records for delete using (auth.uid() = user_id);
```

3. Under **Authentication → Sign In / Providers**, keep **Confirm email**
   switched on for production. Switch it off only while testing locally.
4. Under **Authentication → URL Configuration**, set the **Site URL** to your
   deployed address so confirmation emails link to the right place.

### 2. Environment variables

Create a `.env.local` file in the project root (never commit it):

```
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-key
```

Notes:
- `NEXT_PUBLIC_SUPABASE_URL` must be the bare project URL, ending at
  `.supabase.co`. Do not add `/rest/v1/` or any other path.
- Supabase now calls the anon key the **publishable key**. It is safe to expose
  to the browser; Row Level Security is what protects the data.
- Never use Supabase's secret key in this project.
- The same three variables must be added in Vercel
  (Settings → Environment Variables) for the deployed site to work. The two
  `NEXT_PUBLIC_` ones are public config values; keep the Gemini key secret.

### 3. Run it

```bash
npm run dev
```

Open `http://localhost:3000`, sign up, then go to **Upload** to add data.

## Screens

| Route | Purpose |
| --- | --- |
| `/login` | Sign up and log in (passwords need 10+ characters) |
| `/` | Dashboard: stats, trend and revenue chart, with an upload prompt when empty |
| `/upload` | CSV upload with column matching and row validation |
| `/data` | The user's raw sales records |
| `/ask` | Streaming AI chat with tool calling (core feature) |
| `/visualize` | Interactive 3D revenue skyline |
| `/health` | Health-check page (fetches and renders mock status data) |
| `/settings` | Workspace preferences, stored in the browser's localStorage |

## Architecture

| Part | What it does |
| --- | --- |
| `lib/supabase.js` | Browser Supabase client (used by login, upload, nav) |
| `lib/supabase-server.js` | Server Supabase client that reads the logged-in user from cookies |
| `middleware.js` | Refreshes the auth session cookie on every request |
| `lib/sales-data.js` | `querySales` fetches the current user's rows and filters; `aggregateSales` is the pure grouping/summing logic |
| `lib/tools.ts` | The `querySales` AI tool (Zod schema plus execute function) |
| `lib/ai-config.ts` | One place for the model, system prompt and generation settings |
| `app/api/chat/route.js` | Server route that streams Gemini responses and runs the tool |
| `app/upload/page.js` | CSV parsing (PapaParse), column mapping, validation, insert |
| `app/ask/page.js` | Chat UI with four distinct tool-call states |
| `app/components/` | Nav, chart, and the shader hero |

Pages that show data (`/`, `/data`, `/visualize`) are Server Components that
check the session and redirect to `/login` when nobody is signed in.

## CSV upload

- The first row must be column names. Up to 5,000 rows and 5 MB.
- The page guesses which column is the date, revenue, orders, category and
  region from common header names, and the user can correct each guess.
- Dates must be `YYYY-MM-DD`. Revenue accepts `4200` or `$4,200`. Orders must be
  whole numbers. Category and region cannot be empty.
- Nothing is saved unless every row is valid; errors are listed by row number.
- The insert is a single database call, so all rows save or none do.
- **Replace my existing data** (off by default) deletes the user's current
  records first and then inserts. If the insert then fails, the old rows are
  already gone, so this is called out in the interface.

## AI tool contract: `querySales`

The `/ask` assistant calls this server-side tool, defined in `lib/tools.ts`.
It only ever sees the logged-in user's rows.

**Input schema (Zod):**
```ts
{
  startDate?: string   // inclusive, "YYYY-MM-DD"
  endDate?: string     // inclusive, "YYYY-MM-DD"
  category?: string    // matched case-insensitively against the user's categories
  groupBy?: "category" | "region" | "none"   // defaults to "none"
}
```
All fields are optional; an empty call returns all of the user's data.

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

**Failure behavior:** an invalid `groupBy` is rejected by the Zod schema before
the tool runs, and the chat renders a designed error card instead of crashing.
See `ToolCallPart` in `app/ask/page.js` for the four rendered states:
`input-streaming`, `input-available`, `output-available`, `output-error`.

## 3D Revenue Skyline (`/visualize`)

An interactive 3D bar chart built with React Three Fiber. Each bar is one
record, colored by category.

- Orbit and zoom with mouse or touch; hover a bar for date, revenue and
  category; click a bar to dim the other categories.
- The canvas is lazy-loaded (`next/dynamic`, `ssr: false`), so Three.js only
  loads on this route. No external 3D models are used.
- With `prefers-reduced-motion`, a static 2D bar chart replaces the 3D scene.

## Signature hero shader (`app/components/AuroraHero.jsx`)

The Dashboard hero is a custom GLSL fragment shader: an aurora-style gradient
built from four overlapping sine waves in a blue/purple palette, with the flow
bending toward the cursor. It uses `u_time`, `u_resolution` and a mouse-position
uniform. devicePixelRatio is capped at 1.5, rendering pauses when the tab is
hidden, and `prefers-reduced-motion` swaps in a static CSS gradient.

## Testing, audits and deployment

- `npm run test` runs Vitest: 6 unit tests for `aggregateSales`, the pure
  aggregation logic. The database and auth layers are not covered by automated
  tests yet.
- [AUDIT.md](./AUDIT.md): Lighthouse and WAVE before/after results.
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md): pre-deploy checks and
  the rollback plan (Vercel Instant Rollback).
- [CAPSTONE_SUBMISSION.md](./CAPSTONE_SUBMISSION.md): the FlyRank capstone write-up.

## Known limitations

- **Gemini free tier.** The chat uses Gemini's free tier, which has a daily
  request quota. If it replies "The conversation could not be completed", the
  quota is the most likely cause. It is handled without crashing.
- **Supabase free tier.** A free project is paused after about a week of low
  activity. While paused, login and every data page fail with "failed to
  fetch". Open the Supabase dashboard and click **Resume project**.
- **Next.js `middleware` naming.** Next.js has deprecated the `middleware`
  file name in favor of `proxy`. It still works; the rename is future work.
- **Dashboard chart.** It plots one point per record. If a user uploads several
  rows for the same date, they appear as separate points instead of being summed.
- **Settings** are stored in the browser's localStorage, not in the database,
  so they do not follow a user between devices.
- **Dates** in uploads must be `YYYY-MM-DD`; other formats are rejected rather
  than guessed.

## Roadmap

1. Proactive alerts: a scheduled job that watches each user's data and flags
   unusual drops or spikes, with an AI-written explanation.
2. Save settings in the database.
3. Integration tests for the upload and query paths.

## Stack

Next.js (App Router, JavaScript), Tailwind CSS, Supabase (Postgres, Auth,
Row Level Security), Vercel AI SDK with Google Gemini, Zod, Recharts, React
Three Fiber, PapaParse, Vitest, deployed on Vercel.

## Other scripts

| Command | Purpose |
| --- | --- |
| `npm run build` | Production build |
| `npm run start` | Run the production build locally |
| `npm run lint` | Run ESLint |

See [CLAUDE.md](./CLAUDE.md) for project conventions and [SPEC.md](./SPEC.md)
for the original product spec.