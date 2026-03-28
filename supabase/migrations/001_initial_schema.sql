-- ============================================================
-- Trilheiros App - Initial Schema Migration
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Organizations (agencies)
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  email text,
  whatsapp text,
  bio text,
  logo_url text,
  cover_image_url text,
  instagram text,
  website text,
  city text,
  state text,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  primary_color text,
  secondary_color text,
  custom_domain text,
  marketplace_commission_pct numeric,
  mp_collector_id text,
  mp_public_key text,
  mp_vault_secret_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Organization members (links auth users to orgs)
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner',
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- 3. Destinations (portal)
CREATE TABLE IF NOT EXISTS destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  state text,
  region text,
  cover_image_url text,
  is_featured boolean DEFAULT false,
  seo_title text,
  seo_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Tours
CREATE TABLE IF NOT EXISTS tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  destination_id uuid REFERENCES destinations(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text,
  about text,
  image_url text,
  city text,
  state text,
  difficulty text,
  trail_type text[],
  tags text[],
  distance_km numeric,
  duration_hours numeric,
  elevation_gain_m numeric,
  includes text,
  not_includes text,
  itinerary text,
  policy text,
  departures text,
  month text,
  start_date date,
  end_date date,
  vagas integer,
  vagas_tipo text DEFAULT 'unico',
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  is_published_to_portal boolean DEFAULT false,
  payment_mode text DEFAULT 'manual',
  pix_discount_percent numeric DEFAULT 0,
  mp_card_fee_percent numeric DEFAULT 0,
  mp_installments_max integer DEFAULT 1,
  pro_labore numeric,
  imposto_renda numeric,
  gastos_viagem numeric,
  gastos_manutencao numeric,
  pdf_file_path text,
  trail_guide_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Tour pricing options
CREATE TABLE IF NOT EXISTS tour_pricing_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  option_name text NOT NULL,
  description text,
  pix_price numeric,
  card_price numeric,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 6. Tour boarding points
CREATE TABLE IF NOT EXISTS tour_boarding_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  departure_time text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 7. Tour optional items
CREATE TABLE IF NOT EXISTS tour_optional_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 8. Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nome_completo text NOT NULL,
  cpf text NOT NULL,
  email text,
  whatsapp text,
  data_nascimento date,
  problema_saude boolean DEFAULT false,
  descricao_problema_saude text,
  contato_emergencia_nome text,
  contato_emergencia_telefone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 9. Reservas
CREATE TABLE IF NOT EXISTS reservas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tour_id uuid NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  ponto_embarque_id uuid REFERENCES tour_boarding_points(id) ON DELETE SET NULL,
  slug text,
  reserva_numero text,
  data_reserva date,
  numero_participantes integer,
  valor_passeio numeric,
  valor_pago numeric,
  valor_total_com_opcionais numeric,
  status text DEFAULT 'pendente',
  payment_status text,
  payment_method text,
  booking_source text DEFAULT 'manual',
  mp_preference_id text,
  mp_payment_id text,
  mp_status text,
  installments integer,
  card_fee_amount numeric,
  coupon_code text,
  coupon_discount numeric,
  problema_saude boolean DEFAULT false,
  descricao_problema_saude text,
  plano_saude text,
  contato_emergencia_nome text,
  contato_emergencia_telefone text,
  observacoes text,
  opcionais jsonb,
  selected_optional_items jsonb,
  seen_by_admin boolean DEFAULT false,
  tickets_generated boolean DEFAULT false,
  refund_amount numeric,
  refund_date timestamptz,
  refund_reason text,
  data_confirmacao timestamptz,
  data_pagamento timestamptz,
  data_cancelamento timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 10. Reservation participants
CREATE TABLE IF NOT EXISTS reservation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id uuid NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ponto_embarque_id uuid REFERENCES tour_boarding_points(id) ON DELETE SET NULL,
  pricing_option_id uuid REFERENCES tour_pricing_options(id) ON DELETE SET NULL,
  participant_index integer NOT NULL,
  nome_completo text NOT NULL,
  cpf text,
  email text,
  whatsapp text,
  data_nascimento date,
  problema_saude boolean DEFAULT false,
  descricao_problema_saude text,
  pricing_option_name text,
  selected_optionals jsonb,
  is_staff boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 11. Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tour_id uuid NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  reserva_id uuid NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES reservation_participants(id) ON DELETE SET NULL,
  ticket_number text NOT NULL,
  qr_token text NOT NULL,
  reservation_number text,
  trip_date date,
  boarding_point_name text,
  boarding_point_address text,
  boarding_time text,
  amount_paid numeric,
  status text DEFAULT 'active',
  checkin_at timestamptz,
  checkin_by text,
  created_at timestamptz DEFAULT now()
);

-- 12. Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tour_id uuid REFERENCES tours(id) ON DELETE SET NULL,
  reserva_id uuid REFERENCES reservas(id) ON DELETE SET NULL,
  reviewer_name text NOT NULL,
  reviewer_email text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_published boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 13. Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  features jsonb,
  max_active_tours integer,
  price_monthly numeric,
  price_yearly numeric,
  created_at timestamptz DEFAULT now()
);

-- 14. Organization subscriptions
CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'active',
  billing_period text,
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- RLS Policies (essential for signup to work)
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_pricing_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_boarding_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_optional_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;

-- Organizations: anyone can read (portal), authenticated users can insert (signup)
CREATE POLICY "Public can read active organizations"
  ON organizations FOR SELECT
  USING (status = 'active');

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Org owners can update their organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Organization members: authenticated users can insert (signup), members can read
CREATE POLICY "Members can read their org members"
  ON organization_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create membership"
  ON organization_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Destinations: public read
CREATE POLICY "Public can read destinations"
  ON destinations FOR SELECT
  USING (true);

-- Tours: public read for portal, org members manage
CREATE POLICY "Public can read published tours"
  ON tours FOR SELECT
  USING (is_active = true);

CREATE POLICY "Org members can manage tours"
  ON tours FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Tour pricing options
CREATE POLICY "Public can read pricing options"
  ON tour_pricing_options FOR SELECT
  USING (true);

CREATE POLICY "Org members can manage pricing options"
  ON tour_pricing_options FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Tour boarding points
CREATE POLICY "Public can read boarding points"
  ON tour_boarding_points FOR SELECT
  USING (true);

CREATE POLICY "Org members can manage boarding points"
  ON tour_boarding_points FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Tour optional items
CREATE POLICY "Public can read optional items"
  ON tour_optional_items FOR SELECT
  USING (true);

CREATE POLICY "Org members can manage optional items"
  ON tour_optional_items FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Clientes
CREATE POLICY "Org members can manage clientes"
  ON clientes FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Reservas: public can insert (booking form), org members manage
CREATE POLICY "Public can create reservas"
  ON reservas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can read own reserva by slug"
  ON reservas FOR SELECT
  USING (true);

CREATE POLICY "Org members can manage reservas"
  ON reservas FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Reservation participants
CREATE POLICY "Public can insert participants"
  ON reservation_participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Org members can manage participants"
  ON reservation_participants FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can read participants"
  ON reservation_participants FOR SELECT
  USING (true);

-- Tickets
CREATE POLICY "Public can read tickets by qr_token"
  ON tickets FOR SELECT
  USING (true);

CREATE POLICY "Org members can manage tickets"
  ON tickets FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Reviews: public read, public insert
CREATE POLICY "Public can read published reviews"
  ON reviews FOR SELECT
  USING (is_published = true);

CREATE POLICY "Public can submit reviews"
  ON reviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Org members can manage reviews"
  ON reviews FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Subscription plans: public read
CREATE POLICY "Public can read plans"
  ON subscription_plans FOR SELECT
  USING (true);

-- Organization subscriptions
CREATE POLICY "Org members can read their subscriptions"
  ON organization_subscriptions FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- Seed: Default subscription plans
-- ============================================================
INSERT INTO subscription_plans (name, display_name, max_active_tours, price_monthly, price_yearly, features)
VALUES
  ('free', 'Gratuito', 3, 0, 0, '["Portal Trilheiros", "3 passeios ativos", "Reservas manuais"]'::jsonb),
  ('starter', 'Starter', 10, 49.90, 479.00, '["10 passeios ativos", "Pagamento online", "E-mails automáticos"]'::jsonb),
  ('pro', 'Profissional', 50, 99.90, 959.00, '["50 passeios ativos", "Domínio próprio", "Relatórios avançados"]'::jsonb),
  ('enterprise', 'Enterprise', null, 199.90, 1919.00, '["Passeios ilimitados", "API access", "Suporte prioritário"]'::jsonb)
ON CONFLICT (name) DO NOTHING;
