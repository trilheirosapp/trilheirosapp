import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Organization } from '@/types/organization'

// ── Context types ──────────────────────────────────────────────────────────

interface OrganizationContextValue {
  organization: Organization | null
  setOrganization: (org: Organization | null) => void
  isLoading: boolean
  isMainPortal: boolean
  slug: string | null
  refetch: () => void
}

const OrganizationContext = createContext<OrganizationContextValue>({
  organization: null,
  setOrganization: () => {},
  isLoading: false,
  isMainPortal: true,
  slug: null,
  refetch: () => {},
})

// ── Provider (receives data from root SSR loader) ──────────────────────────

interface OrganizationProviderProps {
  children: ReactNode
  isMainPortal: boolean
  organization: Organization | null
}

export function OrganizationProvider({
  children,
  isMainPortal,
  organization: initialOrganization,
}: OrganizationProviderProps) {
  const [organization, setOrganization] = useState<Organization | null>(initialOrganization)

  // Sync when SSR-provided value changes (e.g. navigating between routes)
  useEffect(() => {
    setOrganization(initialOrganization)
  }, [initialOrganization?.id])

  // Apply branding whenever org changes
  useEffect(() => {
    if (organization) applyBranding(organization)
  }, [organization?.id])

  const slug = organization?.slug ?? null

  return (
    <OrganizationContext.Provider
      value={{ organization, setOrganization, isLoading: false, isMainPortal, slug, refetch: () => {} }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export const useOrganization = () => useContext(OrganizationContext)

const PLAN_FEATURES: Record<string, Record<string, boolean>> = {
  free:   { own_site: false, admin_panel: false, analytics: false, shop: false, cms: false, loyalty: false, coupons: false, exports: false, custom_domain: false },
  basico: { own_site: true,  admin_panel: true,  analytics: false, shop: false, cms: false, loyalty: false, coupons: false, exports: false, custom_domain: false },
  pro:    { own_site: true,  admin_panel: true,  analytics: true,  shop: true,  cms: true,  loyalty: true,  coupons: true,  exports: true,  custom_domain: true  },
}

export function useFeatureFlag(feature: string): boolean {
  const { organization } = useOrganization()
  if (!organization) return false
  return PLAN_FEATURES[organization.plan]?.[feature] ?? false
}

// ── Branding ───────────────────────────────────────────────────────────────

function applyBranding(org: Organization) {
  const root = document.documentElement
  root.style.setProperty('--brand-primary', org.primary_color || '#2D6A4F')
  root.style.setProperty('--brand-secondary', org.secondary_color || '#F5A623')
  if (org.name) document.title = org.name
}
