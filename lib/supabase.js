import { createClient } from '@supabase/supabase-js'

// A single shared Supabase client for use in Client Components.
// The URL and publishable/anon key are safe to expose to the browser by
// design — actual data access is enforced server-side by Row Level
// Security policies on each table, not by keeping this key secret.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
