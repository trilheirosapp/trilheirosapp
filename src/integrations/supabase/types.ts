export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          contato_emergencia_nome: string | null
          contato_emergencia_telefone: string | null
          cpf: string
          created_at: string | null
          data_nascimento: string | null
          descricao_problema_saude: string | null
          email: string | null
          id: string
          nome_completo: string
          organization_id: string
          problema_saude: boolean | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          contato_emergencia_nome?: string | null
          contato_emergencia_telefone?: string | null
          cpf: string
          created_at?: string | null
          data_nascimento?: string | null
          descricao_problema_saude?: string | null
          email?: string | null
          id?: string
          nome_completo: string
          organization_id: string
          problema_saude?: boolean | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          contato_emergencia_nome?: string | null
          contato_emergencia_telefone?: string | null
          cpf?: string
          created_at?: string | null
          data_nascimento?: string | null
          descricao_problema_saude?: string | null
          email?: string | null
          id?: string
          nome_completo?: string
          organization_id?: string
          problema_saude?: boolean | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_featured: boolean | null
          name: string
          region: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          state: string | null
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          name: string
          region?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          name?: string
          region?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_subscriptions: {
        Row: {
          billing_period: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          organization_id: string
          plan_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          billing_period?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          organization_id: string
          plan_id: string
          started_at?: string | null
          status?: string
        }
        Update: {
          billing_period?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          organization_id?: string
          plan_id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          bio: string | null
          city: string | null
          cover_image_url: string | null
          created_at: string | null
          custom_domain: string | null
          email: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          marketplace_commission_pct: number | null
          mp_collector_id: string | null
          mp_public_key: string | null
          mp_vault_secret_id: string | null
          name: string
          plan: string
          primary_color: string | null
          secondary_color: string | null
          slug: string
          state: string | null
          status: string
          updated_at: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          bio?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          custom_domain?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          marketplace_commission_pct?: number | null
          mp_collector_id?: string | null
          mp_public_key?: string | null
          mp_vault_secret_id?: string | null
          name: string
          plan?: string
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          state?: string | null
          status?: string
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          bio?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          custom_domain?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          marketplace_commission_pct?: number | null
          mp_collector_id?: string | null
          mp_public_key?: string | null
          mp_vault_secret_id?: string | null
          name?: string
          plan?: string
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          state?: string | null
          status?: string
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      reservas: {
        Row: {
          booking_source: string | null
          card_fee_amount: number | null
          cliente_id: string | null
          contato_emergencia_nome: string | null
          contato_emergencia_telefone: string | null
          coupon_code: string | null
          coupon_discount: number | null
          created_at: string | null
          data_cancelamento: string | null
          data_confirmacao: string | null
          data_pagamento: string | null
          data_reserva: string | null
          descricao_problema_saude: string | null
          id: string
          installments: number | null
          mp_payment_id: string | null
          mp_preference_id: string | null
          mp_status: string | null
          numero_participantes: number | null
          observacoes: string | null
          opcionais: Json | null
          organization_id: string
          payment_method: string | null
          payment_status: string | null
          plano_saude: string | null
          ponto_embarque_id: string | null
          problema_saude: boolean | null
          refund_amount: number | null
          refund_date: string | null
          refund_reason: string | null
          reserva_numero: string | null
          seen_by_admin: boolean | null
          selected_optional_items: Json | null
          slug: string | null
          status: string | null
          tickets_generated: boolean | null
          tour_id: string
          updated_at: string | null
          valor_pago: number | null
          valor_passeio: number | null
          valor_total_com_opcionais: number | null
        }
        Insert: {
          booking_source?: string | null
          card_fee_amount?: number | null
          cliente_id?: string | null
          contato_emergencia_nome?: string | null
          contato_emergencia_telefone?: string | null
          coupon_code?: string | null
          coupon_discount?: number | null
          created_at?: string | null
          data_cancelamento?: string | null
          data_confirmacao?: string | null
          data_pagamento?: string | null
          data_reserva?: string | null
          descricao_problema_saude?: string | null
          id?: string
          installments?: number | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          mp_status?: string | null
          numero_participantes?: number | null
          observacoes?: string | null
          opcionais?: Json | null
          organization_id: string
          payment_method?: string | null
          payment_status?: string | null
          plano_saude?: string | null
          ponto_embarque_id?: string | null
          problema_saude?: boolean | null
          refund_amount?: number | null
          refund_date?: string | null
          refund_reason?: string | null
          reserva_numero?: string | null
          seen_by_admin?: boolean | null
          selected_optional_items?: Json | null
          slug?: string | null
          status?: string | null
          tickets_generated?: boolean | null
          tour_id: string
          updated_at?: string | null
          valor_pago?: number | null
          valor_passeio?: number | null
          valor_total_com_opcionais?: number | null
        }
        Update: {
          booking_source?: string | null
          card_fee_amount?: number | null
          cliente_id?: string | null
          contato_emergencia_nome?: string | null
          contato_emergencia_telefone?: string | null
          coupon_code?: string | null
          coupon_discount?: number | null
          created_at?: string | null
          data_cancelamento?: string | null
          data_confirmacao?: string | null
          data_pagamento?: string | null
          data_reserva?: string | null
          descricao_problema_saude?: string | null
          id?: string
          installments?: number | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          mp_status?: string | null
          numero_participantes?: number | null
          observacoes?: string | null
          opcionais?: Json | null
          organization_id?: string
          payment_method?: string | null
          payment_status?: string | null
          plano_saude?: string | null
          ponto_embarque_id?: string | null
          problema_saude?: boolean | null
          refund_amount?: number | null
          refund_date?: string | null
          refund_reason?: string | null
          reserva_numero?: string | null
          seen_by_admin?: boolean | null
          selected_optional_items?: Json | null
          slug?: string | null
          status?: string | null
          tickets_generated?: boolean | null
          tour_id?: string
          updated_at?: string | null
          valor_pago?: number | null
          valor_passeio?: number | null
          valor_total_com_opcionais?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reservas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_ponto_embarque_id_fkey"
            columns: ["ponto_embarque_id"]
            isOneToOne: false
            referencedRelation: "tour_boarding_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_participants: {
        Row: {
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          descricao_problema_saude: string | null
          email: string | null
          id: string
          is_staff: boolean | null
          nome_completo: string
          organization_id: string
          participant_index: number
          ponto_embarque_id: string | null
          pricing_option_id: string | null
          pricing_option_name: string | null
          problema_saude: boolean | null
          reserva_id: string
          selected_optionals: Json | null
          whatsapp: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          descricao_problema_saude?: string | null
          email?: string | null
          id?: string
          is_staff?: boolean | null
          nome_completo: string
          organization_id: string
          participant_index: number
          ponto_embarque_id?: string | null
          pricing_option_id?: string | null
          pricing_option_name?: string | null
          problema_saude?: boolean | null
          reserva_id: string
          selected_optionals?: Json | null
          whatsapp?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          descricao_problema_saude?: string | null
          email?: string | null
          id?: string
          is_staff?: boolean | null
          nome_completo?: string
          organization_id?: string
          participant_index?: number
          ponto_embarque_id?: string | null
          pricing_option_id?: string | null
          pricing_option_name?: string | null
          problema_saude?: boolean | null
          reserva_id?: string
          selected_optionals?: Json | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservation_participants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_participants_ponto_embarque_id_fkey"
            columns: ["ponto_embarque_id"]
            isOneToOne: false
            referencedRelation: "tour_boarding_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_participants_pricing_option_id_fkey"
            columns: ["pricing_option_id"]
            isOneToOne: false
            referencedRelation: "tour_pricing_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_participants_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          is_published: boolean | null
          is_verified: boolean | null
          organization_id: string
          rating: number
          reserva_id: string | null
          reviewer_email: string | null
          reviewer_name: string
          tour_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          is_verified?: boolean | null
          organization_id: string
          rating: number
          reserva_id?: string | null
          reviewer_email?: string | null
          reviewer_name: string
          tour_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          is_verified?: boolean | null
          organization_id?: string
          rating?: number
          reserva_id?: string | null
          reviewer_email?: string | null
          reviewer_name?: string
          tour_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          display_name: string
          features: Json | null
          id: string
          max_active_tours: number | null
          name: string
          price_monthly: number | null
          price_yearly: number | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          features?: Json | null
          id?: string
          max_active_tours?: number | null
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          features?: Json | null
          id?: string
          max_active_tours?: number | null
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
        }
        Relationships: []
      }
      tickets: {
        Row: {
          amount_paid: number | null
          boarding_point_address: string | null
          boarding_point_name: string | null
          boarding_time: string | null
          checkin_at: string | null
          checkin_by: string | null
          created_at: string | null
          id: string
          organization_id: string
          participant_id: string | null
          qr_token: string
          reserva_id: string
          reservation_number: string | null
          status: string | null
          ticket_number: string
          tour_id: string
          trip_date: string | null
        }
        Insert: {
          amount_paid?: number | null
          boarding_point_address?: string | null
          boarding_point_name?: string | null
          boarding_time?: string | null
          checkin_at?: string | null
          checkin_by?: string | null
          created_at?: string | null
          id?: string
          organization_id: string
          participant_id?: string | null
          qr_token: string
          reserva_id: string
          reservation_number?: string | null
          status?: string | null
          ticket_number: string
          tour_id: string
          trip_date?: string | null
        }
        Update: {
          amount_paid?: number | null
          boarding_point_address?: string | null
          boarding_point_name?: string | null
          boarding_time?: string | null
          checkin_at?: string | null
          checkin_by?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string
          participant_id?: string | null
          qr_token?: string
          reserva_id?: string
          reservation_number?: string | null
          status?: string | null
          ticket_number?: string
          tour_id?: string
          trip_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "reservation_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_boarding_points: {
        Row: {
          address: string | null
          created_at: string | null
          departure_time: string | null
          display_order: number | null
          id: string
          name: string
          organization_id: string
          tour_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          departure_time?: string | null
          display_order?: number | null
          id?: string
          name: string
          organization_id: string
          tour_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          departure_time?: string | null
          display_order?: number | null
          id?: string
          name?: string
          organization_id?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_boarding_points_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_boarding_points_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_optional_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          organization_id: string
          price: number
          tour_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          organization_id: string
          price: number
          tour_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          organization_id?: string
          price?: number
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_optional_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_optional_items_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_pricing_options: {
        Row: {
          card_price: number | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          option_name: string
          organization_id: string
          pix_price: number | null
          tour_id: string
        }
        Insert: {
          card_price?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          option_name: string
          organization_id: string
          pix_price?: number | null
          tour_id: string
        }
        Update: {
          card_price?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          option_name?: string
          organization_id?: string
          pix_price?: number | null
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_pricing_options_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_pricing_options_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          about: string | null
          city: string | null
          created_at: string | null
          departures: string | null
          destination_id: string | null
          difficulty: string | null
          distance_km: number | null
          duration_hours: number | null
          elevation_gain_m: number | null
          end_date: string | null
          gastos_manutencao: number | null
          gastos_viagem: number | null
          id: string
          image_url: string | null
          imposto_renda: number | null
          includes: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_published_to_portal: boolean | null
          itinerary: string | null
          month: string | null
          mp_card_fee_percent: number | null
          mp_installments_max: number | null
          name: string
          not_includes: string | null
          organization_id: string
          payment_mode: string | null
          pdf_file_path: string | null
          pix_discount_percent: number | null
          policy: string | null
          pro_labore: number | null
          start_date: string | null
          state: string | null
          tags: string[] | null
          trail_guide_id: string | null
          trail_type: string[] | null
          updated_at: string | null
          vagas: number | null
          vagas_fechadas: number | null
          valor_padrao: number | null
          what_to_bring: string | null
        }
        Insert: {
          about?: string | null
          city?: string | null
          created_at?: string | null
          departures?: string | null
          destination_id?: string | null
          difficulty?: string | null
          distance_km?: number | null
          duration_hours?: number | null
          elevation_gain_m?: number | null
          end_date?: string | null
          gastos_manutencao?: number | null
          gastos_viagem?: number | null
          id?: string
          image_url?: string | null
          imposto_renda?: number | null
          includes?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_published_to_portal?: boolean | null
          itinerary?: string | null
          month?: string | null
          mp_card_fee_percent?: number | null
          mp_installments_max?: number | null
          name: string
          not_includes?: string | null
          organization_id: string
          payment_mode?: string | null
          pdf_file_path?: string | null
          pix_discount_percent?: number | null
          policy?: string | null
          pro_labore?: number | null
          start_date?: string | null
          state?: string | null
          tags?: string[] | null
          trail_guide_id?: string | null
          trail_type?: string[] | null
          updated_at?: string | null
          vagas?: number | null
          vagas_fechadas?: number | null
          valor_padrao?: number | null
          what_to_bring?: string | null
        }
        Update: {
          about?: string | null
          city?: string | null
          created_at?: string | null
          departures?: string | null
          destination_id?: string | null
          difficulty?: string | null
          distance_km?: number | null
          duration_hours?: number | null
          elevation_gain_m?: number | null
          end_date?: string | null
          gastos_manutencao?: number | null
          gastos_viagem?: number | null
          id?: string
          image_url?: string | null
          imposto_renda?: number | null
          includes?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_published_to_portal?: boolean | null
          itinerary?: string | null
          month?: string | null
          mp_card_fee_percent?: number | null
          mp_installments_max?: number | null
          name?: string
          not_includes?: string | null
          organization_id?: string
          payment_mode?: string | null
          pdf_file_path?: string | null
          pix_discount_percent?: number | null
          policy?: string | null
          pro_labore?: number | null
          start_date?: string | null
          state?: string | null
          tags?: string[] | null
          trail_guide_id?: string | null
          trail_type?: string[] | null
          updated_at?: string | null
          vagas?: number | null
          vagas_fechadas?: number | null
          valor_padrao?: number | null
          what_to_bring?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tours_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_trail_guide_id_fkey"
            columns: ["trail_guide_id"]
            isOneToOne: false
            referencedRelation: "trail_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      trail_guides: {
        Row: {
          best_season: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          destination_id: string | null
          difficulty: string | null
          distance_km: number | null
          duration_hours: number | null
          elevation_gain_m: number | null
          id: string
          images: Json | null
          name: string
          slug: string
          trail_type: string[] | null
          updated_at: string | null
        }
        Insert: {
          best_season?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          destination_id?: string | null
          difficulty?: string | null
          distance_km?: number | null
          duration_hours?: number | null
          elevation_gain_m?: number | null
          id?: string
          images?: Json | null
          name: string
          slug: string
          trail_type?: string[] | null
          updated_at?: string | null
        }
        Update: {
          best_season?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          destination_id?: string | null
          difficulty?: string | null
          distance_km?: number | null
          duration_hours?: number | null
          elevation_gain_m?: number | null
          id?: string
          images?: Json | null
          name?: string
          slug?: string
          trail_type?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trail_guides_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_org_id: { Args: never; Returns: string }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
