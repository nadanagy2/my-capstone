# SPEC.md — Ask-Your-Data Dashboard

## What it is

A manager-facing analytics dashboard that lets users ask questions about their
data in plain language and get answers grounded in the actual dataset —
"chat with your data" instead of digging through charts and filters manually.

## Who it's for

Managers/team leads who need quick answers from operational data (sales,
support tickets, or similar) without needing to know how to build a query or
read a complex dashboard themselves.

## Core features

- **Ask** — a natural-language query box; AI answers using the real dataset
  (e.g. "What were our worst 3 days last month and why?")
- **Dashboard overview** — key metrics and charts at a glance
- **Data view** — the underlying dataset in table form, for transparency
- **Settings** — basic app preferences (placeholder for now)

## Tech stack

- Next.js (App Router) — Server Components by default, Client Components for
  interactive pieces (the query box, charts)
- Tailwind CSS
- Deployed on Vercel with preview deployments on every push
- Data: mock/seeded JSON dataset for now (e.g. sales or support tickets);
  real AI querying wired in during later assignments

## Scope for this stage (FE-04 skeleton)

- Routed placeholder pages for all four core screens above
- A health-check page that fetches and renders sample data
- Responsive at 375px and 1280px
- No AI integration yet — that's a later assignment
