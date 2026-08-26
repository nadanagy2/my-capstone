CLAUDE.md

Guidance for Claude Code (or any AI assistant) working in this repository.

Project overview

This is the capstone project for a frontend development internship track: an "Ask-Your-Data Dashboard" — a manager-facing analytics dashboard where users ask questions about their data in plain language and get answers grounded in the actual dataset. See SPEC.md for the full product spec.

Tech stack
Framework: Next.js (App Router), JavaScript (not TypeScript)
Rendering: Server Components by default; Client Components only where interactivity is needed (mark with 'use client' at the top of the file)
Styling: Tailwind CSS
Package manager: npm
Linting: ESLint (Next.js default config)
Testing: Vitest + React Testing Library
Deployment: Vercel, with preview deployments on every push
Commands
npm install — install dependencies
npm run dev — start local dev server (http://localhost:3000)
npm run build — production build
npm run start — run the production build locally
npm run lint — run ESLint
npm run test — run Vitest
Conventions
Commits: follow Conventional Commits format — type(scope): description. Common types: feat, fix, docs, chore, refactor, test, style.
Routing: each screen lives under app/<route>/page.js. Shared UI goes in app/components/.
Components: one component per file, PascalCase filenames (e.g. Navbar.jsx). Default to Server Components; only add 'use client' when a component needs state, effects, or event handlers.
Styling: Tailwind utility classes; avoid custom CSS files unless a utility genuinely can't express it.
Data: for this skeleton stage, use mock/seeded JSON data — no real backend or API keys yet. Real data + AI querying come in later assignments.
Secrets: any future API keys go in .env.local (already gitignored), never committed directly or hardcoded in components.
Code style: prefer functional components and hooks over class components; keep components small and focused; avoid inline styles.
Notes for the AI assistant
Prefer minimal, incremental diffs over large rewrites.
When adding a dependency, explain why it's needed before installing.
When editing README.md or docs, keep language clear and beginner-friendly — this repo is also a learning artifact for the internship track.
Always propose the commit message in Conventional Commits format after completing a task.
Before claiming a bug is fixed, explain the actual root cause found — do not just resend the same fix and claim success without verifying it.
Rules learned from the Round 1 vs Round 2 prompting drill
Every form component must ship with at least one test covering an invalid-input case (empty required field, malformed value). Round 1's form had zero validation and zero tests — it "saved" any input, including a blank form.
Forms use react-hook-form + zod for validation; never rely on a submit handler that saves state unconditionally.
Every invalid form field must have both a visible inline error message and aria-invalid + aria-describedby set — Round 1 had neither.
Rules learned from the Vite → Next.js migration
Layout containers nested inside a flex parent need explicit width: 100%, or they shrink-to-fit and break multi-column grid layouts — verify any grid/layout change in a full-width browser window, not a narrow panel.
When scaffolding tooling (create-next-app, etc.), confirm the actual generated stack (JS vs TS, file structure) before building on top of it — don't assume flags or prompts were interpreted as expected.