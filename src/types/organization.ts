export type Plan = 'free' | 'basico' | 'pro'
export type OrgStatus = 'active' | 'suspended' | 'cancelled'
export type MemberRole = 'owner' | 'admin' | 'staff'

export interface Organization {
  id: string
  name: string
  slug: string
  custom_domain: string | null
  plan: Plan
  status: OrgStatus
  primary_color: string
  secondary_color: string
  logo_url: string | null
  cover_image_url: string | null
  bio: string | null
  whatsapp: string | null
  email: string | null
  instagram: string | null
  website: string | null
  city: string | null
  state: string | null
  mp_public_key: string | null
  mp_collector_id: string | null
  marketplace_commission_pct: number
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: MemberRole
}

export const PLAN_FEATURES: Record<Plan, Record<string, boolean>> = {
  free: {
    own_site: false,
    admin_panel: false,
    analytics: false,
    shop: false,
    cms: false,
    loyalty: false,
    coupons: false,
    exports: false,
    custom_domain: false,
    max_tours: false, // limited to 0 (portal only)
  },
  basico: {
    own_site: true,
    admin_panel: true,
    analytics: false,
    shop: false,
    cms: false,
    loyalty: false,
    coupons: false,
    exports: false,
    custom_domain: false,
    max_tours: true, // limited to 15
  },
  pro: {
    own_site: true,
    admin_panel: true,
    analytics: true,
    shop: true,
    cms: true,
    loyalty: true,
    coupons: true,
    exports: true,
    custom_domain: true,
    max_tours: false, // unlimited
  },
}

export const MAX_TOURS_PER_PLAN: Record<Plan, number | null> = {
  free: null,    // can list on portal but no own site
  basico: 15,
  pro: null,     // unlimited
}
