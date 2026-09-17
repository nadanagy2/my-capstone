# Deployment Checklist — Ask Your Data

Filled out and signed off before final capstone submission.

## Pre-deployment

- [x] All environment variables (`GOOGLE_GENERATIVE_AI_API_KEY`) are set in
      Vercel's dashboard (Production, Preview, Development), never
      committed to the repo
- [x] `.env.local` is confirmed gitignored (`git log --all --full-history --
      "*.env*"` returns nothing)
- [x] `npm run build` completes with no errors
- [x] `npm run test` passes (7/7 tests)
- [x] `npm run lint` runs with no blocking errors

## Accessibility & performance

- [x] Lighthouse (Mobile) run on the live deployment: Performance 80,
      Accessibility 100, Best Practices 100, SEO 100
- [x] WAVE run on all 6 pages: 0 Errors site-wide, 1 justified false-
      positive alert (documented in `AUDIT.md`)
- [x] Full keyboard-only pass completed on the primary flow (Nav → Ask
      chat → Stop button)

## Functional verification (manual, on the live URL)

- [x] Dashboard loads with real computed stats and chart
- [x] Ask chat sends a message, streams a response, and can call the
      `querySales` tool successfully
- [x] Ask chat's Stop button works mid-stream without breaking state
- [x] Data page shows real sales records
- [x] Visualize page's 3D scene loads and responds to interaction
- [x] Health page returns a fresh timestamp on each load (confirms
      server-side data fetching works in production)
- [x] Settings page saves and persists a value across a page reload

## Failure handling verification (deliberately triggered)

- [x] Sent an invalid tool argument (bad `groupBy` value) — confirmed a
      designed error card renders, not a crash
- [x] Triggered a real Gemini API rate-limit error during development —
      confirmed the chat shows a designed error message, not a crash
- [x] Confirmed `error.tsx`-equivalent handling exists for the primary
      chat flow (the `useChat` error state)

## Rollback plan

If a deployment introduces a regression:
1. Go to the Vercel dashboard → Deployments tab
2. Find the last known-good deployment
3. Click the "..." menu → **Instant Rollback**
4. Separately, fix the issue on a branch, verify locally, then merge to
   `main` to redeploy correctly

No database migrations exist in this project (mock data only), so rollback
carries no data-loss risk.

## Monitoring

No dedicated monitoring/alerting service is set up for this project (out of
scope for this capstone's size). Vercel's own deployment dashboard shows
build failures and function errors, which is checked manually after each
deploy for now.

## Sign-off

Reviewed and confirmed working end-to-end on the live production URL
(`https://my-capstone-bay.vercel.app`) on the date of this submission.
