import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Calendar, Clock, Ruler,
  Users, MessageCircle, Star,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import BookingWizard from '@/components/agency/BookingWizard'
import {
  formatCurrency, formatDateLong, formatDistance,
  formatDuration, whatsappLink,
} from '@/lib/format'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

interface TourDetail {
  id: string
  name: string
  about: string | null
  city: string | null
  state: string | null
  start_date: string | null
  end_date: string | null
  vagas: number | null
  valor_padrao: number | null
  difficulty: string | null
  trail_type: string[] | null
  distance_km: number | null
  duration_hours: number | null
  image_url: string | null
  pix_discount_percent: number | null
  payment_mode: string | null
  includes: string | null
  not_includes: string | null
  what_to_bring: string | null
  itinerary: string | null
  policy: string | null
}

interface PricingOption {
  id: string
  option_name: string
  pix_price: number | null
  card_price: number | null
}

interface BoardingPoint {
  id: string
  name: string
  address: string | null
  departure_time: string | null
}

interface OptionalItem {
  id: string
  name: string
  description: string | null
  price: number
}

interface Review {
  id: string
  rating: number
  comment: string | null
  reviewer_name: string
  created_at: string | null
}

const DIFF_LABELS: Record<string, string> = {
  facil: 'Fácil', moderado: 'Moderado', dificil: 'Difícil', muito_dificil: 'Muito difícil',
}
const DIFF_VARIANTS: Record<string, 'success' | 'warning' | 'destructive'> = {
  facil: 'success', moderado: 'warning', dificil: 'destructive', muito_dificil: 'destructive',
}

// ── Section component ──────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

interface InitialData {
  tour: TourDetail | null
  pricingOptions: PricingOption[]
  boardingPoints: BoardingPoint[]
  optionalItems: OptionalItem[]
  reviews: Review[]
  reservasCount: number
}

export default function TourPage({ tourId, initialData }: { tourId: string; initialData?: InitialData }) {
  const { organization } = useOrganization()
  const navigate = useNavigate()

  const [tour, setTour] = useState<TourDetail | null>(initialData?.tour ?? null)
  const [pricingOptions, setPricingOptions] = useState<PricingOption[]>(initialData?.pricingOptions ?? [])
  const [boardingPoints, setBoardingPoints] = useState<BoardingPoint[]>(initialData?.boardingPoints ?? [])
  const [optionals, setOptionals] = useState<OptionalItem[]>(initialData?.optionalItems ?? [])
  const [reviews, setReviews] = useState<Review[]>(initialData?.reviews ?? [])
  const [reservasCount, setReservasCount] = useState(initialData?.reservasCount ?? 0)
  const [loading, setLoading] = useState(!initialData?.tour)
  const [bookingOpen, setBookingOpen] = useState(false)

  useEffect(() => {
    if (tourId && organization) fetchTour()
  }, [tourId, organization?.id])

  const fetchTour = async () => {
    setLoading(true)
    try {
      const [
        { data: t },
        { data: pricing },
        { data: boarding },
        { data: opts },
        { data: rev },
        { count },
      ] = await Promise.all([
        supabase.from('tours').select('*').eq('id', tourId).single(),
        supabase.from('tour_pricing_options').select('*').eq('tour_id', tourId).order('display_order'),
        supabase.from('tour_boarding_points').select('*').eq('tour_id', tourId).order('display_order'),
        supabase.from('tour_optional_items').select('*').eq('tour_id', tourId).eq('is_active', true),
        supabase.from('reviews').select('*').eq('tour_id', tourId).eq('is_published', true).order('created_at', { ascending: false }),
        supabase.from('reservas').select('*', { count: 'exact', head: true }).eq('tour_id', tourId).in('status', ['confirmada', 'pendente']),
      ])

      if (!t) { navigate('/'); return }
      setTour(t as TourDetail)
      setPricingOptions(pricing as PricingOption[] ?? [])
      setBoardingPoints(boarding as BoardingPoint[] ?? [])
      setOptionals(opts as OptionalItem[] ?? [])
      setReviews(rev as Review[] ?? [])
      setReservasCount(count ?? 0)
    } finally {
      setLoading(false)
    }
  }

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null

  const vagasRestantes = (tour?.vagas ?? 0) - reservasCount

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (!tour) return null

  return (
    <div className="min-h-screen bg-background">

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{organization?.name ?? 'Voltar'}</span>
          </Button>
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero image */}
      {tour.image_url && (
        <div className="aspect-video max-h-72 overflow-hidden">
          <img
            src={tour.image_url}
            alt={tour.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">

        {/* Title + meta */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-foreground leading-tight">{tour.name}</h1>
            {tour.difficulty && (
              <Badge variant={DIFF_VARIANTS[tour.difficulty] ?? 'default'} className="flex-shrink-0">
                {DIFF_LABELS[tour.difficulty] ?? tour.difficulty}
              </Badge>
            )}
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {tour.start_date && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDateLong(tour.start_date)}
                {tour.end_date && tour.end_date !== tour.start_date && ` → ${formatDateLong(tour.end_date)}`}
              </span>
            )}
            {tour.city && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {[tour.city, tour.state].filter(Boolean).join('/')}
              </span>
            )}
            {tour.distance_km && (
              <span className="flex items-center gap-1.5">
                <Ruler className="w-4 h-4" />
                {formatDistance(tour.distance_km)}
              </span>
            )}
            {tour.duration_hours && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {formatDuration(tour.duration_hours)}
              </span>
            )}
            {avgRating && (
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {avgRating.toFixed(1)} ({reviews.length})
              </span>
            )}
          </div>

          {/* Trail types */}
          {tour.trail_type?.length && (
            <div className="flex flex-wrap gap-1.5">
              {tour.trail_type.map(t => (
                <Badge key={t} variant="outline" className="text-xs capitalize">{t}</Badge>
              ))}
            </div>
          )}

          {/* Vagas indicator */}
          {tour.vagas && (
            <div className={cn(
              'inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium',
              vagasRestantes <= 3
                ? 'bg-destructive/10 text-destructive'
                : vagasRestantes <= 8
                ? 'bg-amber-500/10 text-amber-600'
                : 'bg-primary/10 text-primary'
            )}>
              <Users className="w-3.5 h-3.5" />
              {vagasRestantes <= 0
                ? 'Esgotado'
                : vagasRestantes <= 3
                ? `Apenas ${vagasRestantes} vaga${vagasRestantes > 1 ? 's' : ''} restante!`
                : `${vagasRestantes} vagas disponíveis`}
            </div>
          )}
        </div>

        {/* Sticky booking bar */}
        <div className="sticky top-14 z-30 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-md border-b">
          <div className="flex items-center justify-between gap-4">
            <div>
              {pricingOptions.length > 0 ? (
                <>
                  <p className="text-xs text-muted-foreground">a partir de</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(
                      Math.min(...pricingOptions.map(p => p.pix_price ?? p.card_price ?? 0))
                    )}
                  </p>
                </>
              ) : tour.valor_padrao ? (
                <>
                  <p className="text-xs text-muted-foreground">a partir de</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(tour.valor_padrao)}
                  </p>
                </>
              ) : null}
            </div>
            <Button
              size="lg"
              className="flex-shrink-0"
              disabled={vagasRestantes <= 0}
              onClick={() => setBookingOpen(true)}
            >
              {vagasRestantes <= 0 ? 'Esgotado' : 'Reservar agora'}
            </Button>
          </div>
        </div>

        {/* About */}
        {tour.about && (
          <Section title="Sobre o passeio">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {tour.about}
            </p>
          </Section>
        )}

        {/* Pricing options */}
        {pricingOptions.length > 0 && (
          <Section title="Opções de preço">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pricingOptions.map(opt => (
                <div key={opt.id} className="p-4 border rounded-xl space-y-1">
                  <p className="text-sm font-semibold">{opt.option_name}</p>
                  {opt.pix_price && (
                    <p className="text-sm text-foreground">
                      PIX: <span className="font-bold text-primary">{formatCurrency(opt.pix_price)}</span>
                    </p>
                  )}
                  {opt.card_price && (
                    <p className="text-sm text-muted-foreground">
                      Cartão: {formatCurrency(opt.card_price)}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {tour.pix_discount_percent && (
              <p className="text-xs text-muted-foreground">
                * Desconto de {tour.pix_discount_percent}% para pagamentos via PIX
              </p>
            )}
          </Section>
        )}

        {/* Boarding points */}
        {boardingPoints.length > 0 && (
          <Section title="Pontos de embarque">
            <div className="space-y-2">
              {boardingPoints.map(bp => (
                <div key={bp.id} className="flex items-start gap-3 p-3 border rounded-xl">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{bp.name}</p>
                    {bp.address && <p className="text-xs text-muted-foreground">{bp.address}</p>}
                    {bp.departure_time && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Saída: <span className="font-medium">{bp.departure_time}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Optional items */}
        {optionals.length > 0 && (
          <Section title="Itens opcionais">
            <div className="space-y-2">
              {optionals.map(opt => (
                <div key={opt.id} className="flex items-center justify-between p-3 border rounded-xl gap-3">
                  <div>
                    <p className="text-sm font-medium">{opt.name}</p>
                    {opt.description && <p className="text-xs text-muted-foreground">{opt.description}</p>}
                  </div>
                  <span className="text-sm font-semibold flex-shrink-0">
                    {formatCurrency(opt.price)}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Includes / Not includes / What to bring */}
        {(tour.includes || tour.not_includes || tour.what_to_bring) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tour.includes && (
              <Section title="O que está incluído">
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {tour.includes}
                </p>
              </Section>
            )}
            {tour.not_includes && (
              <Section title="Não incluído">
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {tour.not_includes}
                </p>
              </Section>
            )}
            {tour.what_to_bring && (
              <Section title="O que levar">
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {tour.what_to_bring}
                </p>
              </Section>
            )}
          </div>
        )}

        {/* Policy */}
        {tour.policy && (
          <Section title="Política de cancelamento">
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {tour.policy}
            </p>
          </Section>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <Section title={`Avaliações (${reviews.length})`}>
            {avgRating && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      className={cn(
                        'w-5 h-5',
                        s <= Math.round(avgRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground'
                      )}
                    />
                  ))}
                </div>
                <span className="text-lg font-bold">{avgRating.toFixed(1)}</span>
              </div>
            )}
            <div className="space-y-3">
              {reviews.slice(0, 5).map(r => (
                <div key={r.id} className="p-3 border rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{r.reviewer_name}</p>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star
                          key={s}
                          className={cn(
                            'w-3.5 h-3.5',
                            s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Bottom CTA */}
        {organization?.whatsapp && (
          <div className="p-4 bg-card border rounded-xl flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Dúvidas? Fale diretamente com a agência
            </p>
            <a
              href={whatsappLink(
                organization.whatsapp,
                `Olá! Tenho interesse no passeio "${tour.name}".`
              )}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-1.5 flex-shrink-0">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </Button>
            </a>
          </div>
        )}

        <Separator />
        <footer className="text-center py-2">
          <a
            href="https://trilheiros.app"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Powered by <span className="font-semibold">trilheiros.app</span>
          </a>
        </footer>
      </div>

      {/* Booking wizard */}
      {bookingOpen && (
        <BookingWizard
          open={bookingOpen}
          onClose={() => setBookingOpen(false)}
          tour={tour}
          pricingOptions={pricingOptions}
          boardingPoints={boardingPoints}
          optionalItems={optionals}
        />
      )}
    </div>
  )
}
