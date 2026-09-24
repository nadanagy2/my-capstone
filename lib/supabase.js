import { createBrowserClient } from '@supabase/ssr'

// A shared Supabase client for use in Client Components. Uses the SSR-aware
// browser client so the session is stored in cookies (not just local
// storage), letting Server Components and route handlers also see who's
// logged in via lib/supabase-server.js.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)