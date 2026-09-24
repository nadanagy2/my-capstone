import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * A Supabase client for use in Server Components, route handlers, and
 * server actions. Reads the logged-in user's session from cookies, so
 * server-side code can know who's asking without the browser client.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll can be called from a Server Component where cookies
            // can't be set directly; this is safe to ignore as long as
            // middleware also refreshes the session (see middleware.js).
          }
        },
      },
    }
  )
}