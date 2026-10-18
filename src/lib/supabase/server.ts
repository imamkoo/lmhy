import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import type { Database } from './types'
import { getSessionCookieOptions } from './cookie'

// Polyfill minimal WebSocket for Node < 22 SSR environments where Realtime is unused
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as unknown as Record<string, unknown>).WebSocket = class {};
}

export async function createClient() {
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null
  let host = ''
  try {
    cookieStore = await cookies()
    const headerList = await headers()
    host = headerList.get('host') || ''
  } catch {
    // Called outside a request context (e.g. static rendering or test script)
  }

  const cookieOptions = getSessionCookieOptions(host)

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookieOptions,
      cookies: {
        getAll() {
          return cookieStore ? cookieStore.getAll() : []
        },
        setAll(cookiesToSet) {
          try {
            if (cookieStore) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, {
                  ...options,
                  ...(cookieOptions.domain ? { domain: cookieOptions.domain } : {}),
                })
              )
            }
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
