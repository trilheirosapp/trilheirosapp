import * as React from 'react'
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { createSupabasePublicClient } from '~/utils/supabase.server'
import { OrganizationProvider } from '@/contexts/OrganizationContext'
import type { Organization } from '@/types/organization'
import '../src/index.css'

// ── Tenant detection ───────────────────────────────────────────────────────

const MAIN_DOMAINS = ['trilheiros.app', 'localhost', '127.0.0.1']

function detectTenant(hostname: string): { isMainPortal: boolean; slug: string | null } {
  if (MAIN_DOMAINS.includes(hostname) || hostname.endsWith('.vercel.app')) {
    return { isMainPortal: true, slug: null }
  }
  if (hostname.endsWith('.trilheiros.app')) {
    return { isMainPortal: false, slug: hostname.replace('.trilheiros.app', '') }
  }
  if (hostname.endsWith('.localhost')) {
    return { isMainPortal: false, slug: hostname.replace('.localhost', '') }
  }
  // Custom domain
  return { isMainPortal: false, slug: null }
}

// ── Root loader ────────────────────────────────────────────────────────────

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const { isMainPortal, slug } = detectTenant(url.hostname)

  let organization: Organization | null = null

  if (!isMainPortal) {
    const supabase = createSupabasePublicClient()
    const query = supabase
      .from('organizations')
      .select('*')
      .eq('status', 'active')

    if (slug) {
      query.eq('slug', slug)
    } else {
      query.eq('custom_domain', url.hostname)
    }

    const { data } = await query.maybeSingle()
    organization = data as Organization | null
  }

  return { isMainPortal, organization, slug }
}

export type RootLoaderData = Awaited<ReturnType<typeof loader>>

// ── Query client (singleton per request) ──────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
  },
})

// ── HTML document layout ───────────────────────────────────────────────────

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {/* Prevent theme flash before hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('trilheiros-theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.toggle('dark',t==='dark')})()`,
          }}
        />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

// ── App root ───────────────────────────────────────────────────────────────

export default function App() {
  const { isMainPortal, organization } = useLoaderData<typeof loader>()

  return (
    <QueryClientProvider client={queryClient}>
      <OrganizationProvider isMainPortal={isMainPortal} organization={organization}>
        <Outlet />
        <Toaster richColors position="top-right" />
      </OrganizationProvider>
    </QueryClientProvider>
  )
}
