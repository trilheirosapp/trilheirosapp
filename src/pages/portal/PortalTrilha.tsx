import { Link } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Ruler, Clock, Mountain,
  TrendingUp, Calendar, Sun,
} from 'lucide-react'
import PortalNav from '@/components/portal/PortalNav'
import { TourCard } from '@/pages/portal/PortalHome'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDistance, formatDuration } from '@/lib/format'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

interface TrailGuide {
  id: string
  name: string
  slug: string
  description: string | null
  difficulty: string | null
  distance_km: number | null
  elevation_gain_m: number | null
  duration_hours: number | null
  trail_type: string[] | null
  best_season: string | null
  cover_image_url: string | null
  images: any[] | null
  destinations: {
    name: string
    slug: string
    region: string | null
    state: string | null
  } | null
}

interface Tour {
  id: string
  name: string
  city: string | null
  state: string | null
  start_date: string | null
  valor_padrao: number | null
  difficulty: string | null
  image_url: string | null
  trail_type: string[] | null
  organizations: { name: string; slug: string; logo_url: string | null } | null
}

const DIFF_LABELS: Record<string, string> = {
  facil: 'Fácil', moderado: 'Moderado', dificil: 'Difícil', muito_dificil: 'Muito difícil',
}
const DIFF_COLORS: Record<string, string> = {
  facil: 'bg-emerald-500/10 text-emerald-600',
  moderado: 'bg-amber-500/10 text-amber-600',
  dificil: 'bg-red-500/10 text-red-600',
  muito_dificil: 'bg-red-500/10 text-red-600',
}

// ── Main component ─────────────────────────────────────────────────────────

export default function PortalTrilha({
  trail,
  relatedTours,
}: {
  trail: TrailGuide | null
  relatedTours: Tour[]
}) {
  if (!trail) {
    return (
      <div className="min-h-screen bg-background">
        <PortalNav />
        <div className="text-center py-24">
          <Mountain className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
          <p className="text-xl font-bold">Trilha não encontrada</p>
          <Link to="/" className="mt-4 inline-block">
            <Button variant="outline">Voltar ao início</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PortalNav />

      {/* Cover image */}
      {trail.cover_image_url && (
        <div className="relative h-56 sm:h-72 overflow-hidden">
          <img
            src={trail.cover_image_url}
            alt={trail.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* Back link */}
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
            <ArrowLeft className="w-4 h-4" /> Trilhas
          </Button>
        </Link>

        {/* Title + meta */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-foreground leading-tight">{trail.name}</h1>
            {trail.difficulty && (
              <span className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0',
                DIFF_COLORS[trail.difficulty] ?? 'bg-muted text-muted-foreground',
              )}>
                {DIFF_LABELS[trail.difficulty] ?? trail.difficulty}
              </span>
            )}
          </div>

          {/* Destination */}
          {trail.destinations && (
            <Link
              to={`/destinos/${trail.destinations.slug}`}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <MapPin className="w-4 h-4" />
              {trail.destinations.name}
              {trail.destinations.state && ` · ${trail.destinations.state}`}
            </Link>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {trail.distance_km && (
              <span className="flex items-center gap-1.5">
                <Ruler className="w-4 h-4" />
                {formatDistance(trail.distance_km)}
              </span>
            )}
            {trail.duration_hours && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {formatDuration(trail.duration_hours)}
              </span>
            )}
            {trail.elevation_gain_m && (
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                {trail.elevation_gain_m}m de desnível
              </span>
            )}
            {trail.best_season && (
              <span className="flex items-center gap-1.5">
                <Sun className="w-4 h-4" />
                {trail.best_season}
              </span>
            )}
          </div>

          {/* Trail types */}
          {trail.trail_type?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {trail.trail_type.map(t => (
                <Badge key={t} variant="outline" className="text-xs capitalize">{t}</Badge>
              ))}
            </div>
          ) : null}
        </div>

        {/* Description */}
        {trail.description && (
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">Sobre a trilha</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {trail.description}
            </p>
          </div>
        )}

        {/* Image gallery */}
        {trail.images && trail.images.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Fotos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {trail.images.map((img: any, i: number) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden">
                  <img
                    src={typeof img === 'string' ? img : img.url}
                    alt={`${trail.name} - foto ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related tours */}
        {relatedTours.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  <Calendar className="w-4 h-4 inline mr-1.5" />
                  Passeios nesta trilha
                </h2>
                <span className="text-sm text-muted-foreground">({relatedTours.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedTours.map(tour => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            </div>
          </>
        )}

        <Separator />
        <footer className="text-center py-2">
          <a
            href="https://trilheiros.app"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Powered by <span className="font-semibold">trilheiros.app</span>
          </a>
        </footer>
      </div>
    </div>
  )
}
