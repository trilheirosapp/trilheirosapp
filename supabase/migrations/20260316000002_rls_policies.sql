-- ============================================================
-- Migration 002: Row Level Security policies
-- Trilheiros.app
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.organizations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_pricing_options       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_boarding_points       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_optional_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_participants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trail_guides               ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER: get current user's organization_id
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS UUID STABLE LANGUAGE sql SECURITY DEFINER AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================
-- HELPER: check if current user is super-admin
-- Super-admin is identified by a special role in auth.users app_metadata
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN STABLE LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin',
    false
  );
$$;

-- ============================================================
-- ORGANIZATIONS
-- ============================================================

-- Public: anyone can read active organizations (for portal + subdomain lookup)
CREATE POLICY "orgs_public_read" ON public.organizations
  FOR SELECT USING (status = 'active');

-- Members can update their own organization
CREATE POLICY "orgs_member_update" ON public.organizations
  FOR UPDATE USING (id = public.get_current_org_id());

-- Super-admin can do everything
CREATE POLICY "orgs_super_admin" ON public.organizations
  USING (public.is_super_admin());

-- ============================================================
-- ORGANIZATION MEMBERS
-- ============================================================

-- Members can see their own memberships
CREATE POLICY "members_own_read" ON public.organization_members
  FOR SELECT USING (user_id = auth.uid() OR organization_id = public.get_current_org_id());

-- Owners can manage members of their org
CREATE POLICY "members_owner_manage" ON public.organization_members
  FOR ALL USING (
    organization_id = public.get_current_org_id()
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = organization_id
        AND om.role = 'owner'
    )
  );

-- Allow insert during signup (user inserts their own membership)
CREATE POLICY "members_self_insert" ON public.organization_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================
-- TOURS
-- ============================================================

-- Public: anyone can read published + active tours (portal discovery)
CREATE POLICY "tours_public_read" ON public.tours
  FOR SELECT USING (is_active = true AND is_published_to_portal = true);

-- Members read all their org's tours (including unpublished)
CREATE POLICY "tours_member_read" ON public.tours
  FOR SELECT USING (organization_id = public.get_current_org_id());

-- Members can create/update/delete their org's tours
CREATE POLICY "tours_member_write" ON public.tours
  FOR ALL USING (organization_id = public.get_current_org_id());

-- ============================================================
-- TOUR SUPPORTING TABLES (pricing, boarding, optionals)
-- ============================================================

-- Public read for active tour details
CREATE POLICY "tour_pricing_public_read" ON public.tour_pricing_options
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_id AND t.is_active = true)
  );

CREATE POLICY "tour_pricing_member_all" ON public.tour_pricing_options
  FOR ALL USING (organization_id = public.get_current_org_id());

CREATE POLICY "tour_boarding_public_read" ON public.tour_boarding_points
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_id AND t.is_active = true)
  );

CREATE POLICY "tour_boarding_member_all" ON public.tour_boarding_points
  FOR ALL USING (organization_id = public.get_current_org_id());

CREATE POLICY "tour_optionals_public_read" ON public.tour_optional_items
  FOR SELECT USING (
    is_active = true AND
    EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_id AND t.is_active = true)
  );

CREATE POLICY "tour_optionals_member_all" ON public.tour_optional_items
  FOR ALL USING (organization_id = public.get_current_org_id());

-- ============================================================
-- CLIENTES
-- ============================================================

-- Public can insert (needed for booking flow without auth)
CREATE POLICY "clientes_public_insert" ON public.clientes
  FOR INSERT WITH CHECK (true);

-- Members read/update their org's clients
CREATE POLICY "clientes_member_all" ON public.clientes
  FOR ALL USING (organization_id = public.get_current_org_id());

-- ============================================================
-- RESERVAS
-- ============================================================

-- Public can insert (booking flow — unauthenticated users book)
CREATE POLICY "reservas_public_insert" ON public.reservas
  FOR INSERT WITH CHECK (true);

-- Public can read by slug (for status pages after booking)
CREATE POLICY "reservas_public_read_by_slug" ON public.reservas
  FOR SELECT USING (slug IS NOT NULL);

-- Members read/update their org's reservations
CREATE POLICY "reservas_member_all" ON public.reservas
  FOR ALL USING (organization_id = public.get_current_org_id());

-- ============================================================
-- RESERVATION PARTICIPANTS
-- ============================================================

CREATE POLICY "participants_public_insert" ON public.reservation_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "participants_member_all" ON public.reservation_participants
  FOR ALL USING (organization_id = public.get_current_org_id());

-- ============================================================
-- TICKETS
-- ============================================================

-- Public can read by qr_token (for ticket view + checkin)
CREATE POLICY "tickets_public_read_by_token" ON public.tickets
  FOR SELECT USING (qr_token IS NOT NULL);

-- Members manage their tickets
CREATE POLICY "tickets_member_all" ON public.tickets
  FOR ALL USING (organization_id = public.get_current_org_id());

-- ============================================================
-- REVIEWS
-- ============================================================

-- Public can read published reviews
CREATE POLICY "reviews_public_read" ON public.reviews
  FOR SELECT USING (is_published = true);

-- Public can insert reviews (linked to reservation)
CREATE POLICY "reviews_public_insert" ON public.reviews
  FOR INSERT WITH CHECK (true);

-- Members manage their reviews
CREATE POLICY "reviews_member_all" ON public.reviews
  FOR ALL USING (organization_id = public.get_current_org_id());

-- ============================================================
-- DESTINATIONS & TRAIL GUIDES (editorial, public content)
-- ============================================================

-- Public can read all destinations and trail guides
CREATE POLICY "destinations_public_read" ON public.destinations
  FOR SELECT USING (true);

CREATE POLICY "trail_guides_public_read" ON public.trail_guides
  FOR SELECT USING (true);

-- Super-admin can manage editorial content
CREATE POLICY "destinations_super_admin" ON public.destinations
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "trail_guides_super_admin" ON public.trail_guides
  FOR ALL USING (public.is_super_admin());

-- ============================================================
-- SUBSCRIPTION PLANS (public read)
-- ============================================================

CREATE POLICY "plans_public_read" ON public.subscription_plans
  FOR SELECT USING (true);

CREATE POLICY "subs_member_read" ON public.organization_subscriptions
  FOR SELECT USING (organization_id = public.get_current_org_id());
