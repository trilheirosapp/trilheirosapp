import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

// ── Public client (no auth, for reading public data in loaders) ────────────
export function createSupabasePublicClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// ── Auth-aware client (reads/writes session cookies) ──────────────────────
export function createSupabaseAuthClient(request: Request) {
  const responseHeaders = new Headers()

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('Cookie') ?? '')
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          responseHeaders.append('Set-Cookie', serializeCookieHeader(name, value, options))
        )
      },
    },
  })

  return { supabase, headers: responseHeaders }
}
