-- ============================================================
-- Migration 001: Core multi-tenant tables
-- Trilheiros.app — Marketplace + SaaS para trilhas e aventura
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ORGANIZATIONS (tenants / agencies)
-- ============================================================
CREATE TABLE public.organizations (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        TEXT NOT NULL,
  slug                        TEXT UNIQUE NOT NULL,          -- camaleao → camaleao.trilheiros.app
  custom_domain               TEXT UNIQUE,                   -- agenda.camaleao.com.br (Pro plan)
  plan                        TEXT NOT NULL DEFAULT 'free'
                              CHECK (plan IN ('free', 'basico', 'pro')),
  status                      TEXT NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'suspended', 'cancelled')),

  -- Branding
  primary_color               TEXT DEFAULT '#2D6A4F',
  secondary_color             TEXT DEFAULT '#F5A623',
  logo_url                    TEXT,
  cover_image_url             TEXT,
  bio                         TEXT,

  -- Contact
  whatsapp                    TEXT,
  email                       TEXT,
  instagram                   TEXT,
  website                     TEXT,

  -- Location
  city                        TEXT,
  state                       TEXT,

  -- Mercado Pago Marketplace
  -- mp_access_token stored via Supabase Vault (encrypted), referenced by vault secret id
  mp_vault_secret_id          TEXT,                          -- ID in vault.secrets
  mp_collector_id             TEXT,                          -- Seller ID in MP
  mp_public_key               TEXT,                          -- Public key (safe to expose)
  marketplace_commission_pct  NUMERIC(5,2) DEFAULT 5.00,    -- % taken on portal bookings

  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ORGANIZATION MEMBERS (staff per agency)
-- ============================================================
CREATE TABLE public.organization_members (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role             TEXT NOT NULL DEFAULT 'admin'
                   CHECK (role IN ('owner', 'admin', 'staff')),
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

-- ============================================================
-- SUBSCRIPTION PLANS
-- ============================================================
CREATE TABLE public.subscription_plans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT UNIQUE NOT NULL,          -- free | basico | pro
  display_name      TEXT NOT NULL,
  price_monthly     NUMERIC(10,2),
  price_yearly      NUMERIC(10,2),
  max_active_tours  INTEGER,                       -- NULL = unlimited
  features          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Seed default plans
INSERT INTO public.subscription_plans (name, display_name, price_monthly, price_yearly, max_active_tours, features) VALUES
  ('free',   'Gratuito',  0,     0,     NULL, '{"own_site":false,"admin_panel":false,"analytics":false,"shop":false,"cms":false,"loyalty":false,"coupons":false,"exports":false,"custom_domain":false}'),
  ('basico', 'Básico',    NULL,  NULL,  15,   '{"own_site":true,"admin_panel":true,"analytics":false,"shop":false,"cms":false,"loyalty":false,"coupons":false,"exports":false,"custom_domain":false}'),
  ('pro',    'Pro',       NULL,  NULL,  NULL, '{"own_site":true,"admin_panel":true,"analytics":true,"shop":true,"cms":true,"loyalty":true,"coupons":true,"exports":true,"custom_domain":true}');

-- ============================================================
-- ORGANIZATION SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.organization_subscriptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id          UUID NOT NULL REFERENCES public.subscription_plans(id),
  status           TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  billing_period   TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
  started_at       TIMESTAMPTZ DEFAULT now(),
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DESTINATIONS (SEO pages: /destinos/chapada-diamantina)
-- ============================================================
CREATE TABLE public.destinations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  region           TEXT,                           -- nordeste | sul | sudeste | centro-oeste | norte
  state            TEXT,
  description      TEXT,
  cover_image_url  TEXT,
  is_featured      BOOLEAN DEFAULT false,
  seo_title        TEXT,
  seo_description  TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TRAIL GUIDES (editorial content, independent of agency)
-- /trilhas/trilha-dos-tuneis
-- ============================================================
CREATE TABLE public.trail_guides (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  slug              TEXT UNIQUE NOT NULL,
  destination_id    UUID REFERENCES public.destinations(id),
  description       TEXT,
  difficulty        TEXT CHECK (difficulty IN ('facil', 'moderado', 'dificil', 'muito_dificil')),
  distance_km       NUMERIC(6,2),
  elevation_gain_m  INTEGER,
  duration_hours    NUMERIC(4,1),
  trail_type        TEXT[],                        -- ['trilha', 'rapel', 'banho', 'rafting']
  best_season       TEXT,
  cover_image_url   TEXT,
  images            JSONB DEFAULT '[]',
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TOURS (with organization_id for multi-tenancy)
-- ============================================================
CREATE TABLE public.tours (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  destination_id          UUID REFERENCES public.destinations(id),
  trail_guide_id          UUID REFERENCES public.trail_guides(id),

  -- Basic info
  name                    TEXT NOT NULL,
  city                    TEXT,
  state                   TEXT,
  about                   TEXT,
  itinerary               TEXT,
  includes                TEXT,
  not_includes            TEXT,
  what_to_bring           TEXT,
  policy                  TEXT,
  departures              TEXT,

  -- Trail-specific fields
  difficulty              TEXT CHECK (difficulty IN ('facil', 'moderado', 'dificil', 'muito_dificil')),
  trail_type              TEXT[],                  -- ['trilha', 'rapel', 'banho', 'rafting']
  distance_km             NUMERIC(6,2),
  elevation_gain_m        INTEGER,
  duration_hours          NUMERIC(4,1),
  tags                    TEXT[],                  -- ['familia', 'piscinas', 'cachoeira']

  -- Dates & availability
  start_date              DATE,
  end_date                DATE,
  month                   TEXT,
  vagas                   INTEGER,
  vagas_fechadas          INTEGER DEFAULT 0,
  is_active               BOOLEAN DEFAULT true,
  is_featured             BOOLEAN DEFAULT false,

  -- Pricing
  valor_padrao            NUMERIC(10,2),
  pix_discount_percent    NUMERIC(5,2) DEFAULT 0,
  mp_card_fee_percent     NUMERIC(5,2) DEFAULT 4.99,
  mp_installments_max     INTEGER DEFAULT 12,
  payment_mode            TEXT DEFAULT 'both'
                          CHECK (payment_mode IN ('pix', 'card', 'both', 'whatsapp')),

  -- Portal
  is_published_to_portal  BOOLEAN DEFAULT true,

  -- Media
  image_url               TEXT,
  pdf_file_path           TEXT,

  -- Financial (internal)
  gastos_viagem           NUMERIC(10,2),
  gastos_manutencao       NUMERIC(10,2),
  pro_labore              NUMERIC(10,2),
  imposto_renda           NUMERIC(10,2),

  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TOUR PRICING OPTIONS (Duplo, Triplo, Camping, etc.)
-- ============================================================
CREATE TABLE public.tour_pricing_options (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id         UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  option_name     TEXT NOT NULL,
  description     TEXT,
  pix_price       NUMERIC(10,2),
  card_price      NUMERIC(10,2),
  display_order   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TOUR BOARDING POINTS (departure locations per tour)
-- ============================================================
CREATE TABLE public.tour_boarding_points (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id         UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  address         TEXT,
  departure_time  TIME,
  display_order   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TOUR OPTIONAL ITEMS (add-ons: rapel, foto aérea, etc.)
-- ============================================================
CREATE TABLE public.tour_optional_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id         UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(10,2) NOT NULL,
  image_url       TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CLIENTS (end customers, scoped per organization)
-- ============================================================
CREATE TABLE public.clientes (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id               UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cpf                           TEXT NOT NULL,
  nome_completo                 TEXT NOT NULL,
  email                         TEXT,
  whatsapp                      TEXT,
  data_nascimento               DATE,
  contato_emergencia_nome       TEXT,
  contato_emergencia_telefone   TEXT,
  problema_saude                BOOLEAN DEFAULT false,
  descricao_problema_saude      TEXT,
  created_at                    TIMESTAMPTZ DEFAULT now(),
  updated_at                    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, cpf)                              -- CPF unique per agency
);

-- ============================================================
-- RESERVATIONS
-- ============================================================
CREATE TABLE public.reservas (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id             UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tour_id                     UUID NOT NULL REFERENCES public.tours(id),
  cliente_id                  UUID REFERENCES public.clientes(id),
  ponto_embarque_id           UUID REFERENCES public.tour_boarding_points(id),

  -- Reservation details
  reserva_numero              TEXT UNIQUE,
  slug                        TEXT UNIQUE,
  numero_participantes        INTEGER DEFAULT 1,
  status                      TEXT DEFAULT 'pendente'
                              CHECK (status IN ('pendente', 'confirmada', 'cancelada')),

  -- Payment
  payment_status              TEXT DEFAULT 'pendente'
                              CHECK (payment_status IN ('pendente', 'pago', 'cancelado', 'reembolsado')),
  payment_method              TEXT,                          -- pix | credit_card | whatsapp
  valor_passeio               NUMERIC(10,2),
  valor_total_com_opcionais   NUMERIC(10,2),
  valor_pago                  NUMERIC(10,2),

  -- Booking source (determines if marketplace commission applies)
  booking_source              TEXT DEFAULT 'agency_link'
                              CHECK (booking_source IN ('portal', 'agency_link')),

  -- Mercado Pago
  mp_preference_id            TEXT,
  mp_payment_id               TEXT,
  mp_status                   TEXT,
  card_fee_amount             NUMERIC(10,2),
  installments                INTEGER DEFAULT 1,

  -- Optionals & add-ons
  selected_optional_items     JSONB DEFAULT '[]',
  opcionais                   JSONB DEFAULT '[]',
  coupon_code                 TEXT,
  coupon_discount             NUMERIC(10,2),

  -- Health & safety
  problema_saude              BOOLEAN DEFAULT false,
  descricao_problema_saude    TEXT,
  plano_saude                 TEXT,
  contato_emergencia_nome     TEXT,
  contato_emergencia_telefone TEXT,

  -- Refunds
  refund_amount               NUMERIC(10,2),
  refund_date                 TIMESTAMPTZ,
  refund_reason               TEXT,

  -- Metadata
  data_reserva                TIMESTAMPTZ DEFAULT now(),
  data_confirmacao            TIMESTAMPTZ,
  data_cancelamento           TIMESTAMPTZ,
  data_pagamento              TIMESTAMPTZ,
  observacoes                 TEXT,
  seen_by_admin               BOOLEAN DEFAULT false,
  tickets_generated           BOOLEAN DEFAULT false,

  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RESERVATION PARTICIPANTS
-- ============================================================
CREATE TABLE public.reservation_participants (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reserva_id                UUID NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
  organization_id           UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  participant_index         INTEGER NOT NULL,
  nome_completo             TEXT NOT NULL,
  cpf                       TEXT,
  email                     TEXT,
  whatsapp                  TEXT,
  data_nascimento           DATE,
  pricing_option_id         UUID REFERENCES public.tour_pricing_options(id),
  pricing_option_name       TEXT,
  ponto_embarque_id         UUID REFERENCES public.tour_boarding_points(id),
  selected_optionals        JSONB DEFAULT '[]',
  problema_saude            BOOLEAN DEFAULT false,
  descricao_problema_saude  TEXT,
  is_staff                  BOOLEAN DEFAULT false,
  created_at                TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TICKETS
-- ============================================================
CREATE TABLE public.tickets (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reserva_id              UUID NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
  participant_id          UUID REFERENCES public.reservation_participants(id),
  tour_id                 UUID NOT NULL REFERENCES public.tours(id),
  ticket_number           TEXT UNIQUE NOT NULL,
  qr_token               TEXT UNIQUE NOT NULL,
  boarding_point_name     TEXT,
  boarding_point_address  TEXT,
  boarding_time           TIME,
  trip_date               DATE,
  reservation_number      TEXT,
  amount_paid             NUMERIC(10,2),
  status                  TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'cancelled')),
  checkin_at              TIMESTAMPTZ,
  checkin_by              UUID REFERENCES auth.users(id),
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE public.reviews (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tour_id          UUID REFERENCES public.tours(id),
  reserva_id       UUID REFERENCES public.reservas(id),
  reviewer_name    TEXT NOT NULL,
  reviewer_email   TEXT,
  rating           INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment          TEXT,
  is_verified      BOOLEAN DEFAULT false,                    -- true if linked to confirmed reservation
  is_published     BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TIMESTAMPS: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_tours_updated_at
  BEFORE UPDATE ON public.tours
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_reservas_updated_at
  BEFORE UPDATE ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
