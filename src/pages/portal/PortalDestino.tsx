import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import PortalNav from '@/components/portal/PortalNav'
import { TourCard } from '@/pages/portal/PortalHome'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

// ── Types ──────────────────────────────────────────────────────────────────

interface Destination {
  id: string
  name: string
  slug: string
  state: string | null
  region: string | null
  description: string | null
  cover_image_url: string | null
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

// ── Main component ─────────────────────────────────────────────────────────

export default function PortalDestino({ slug }: { slug: string }) {
  const navigate = useNavigate()
  const [destination, setDestination] = useState<Destination | null>(null)
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (slug) fetchData()
  }, [slug])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: dest } = await supabase
        .from('destinations')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (!dest) { setNotFound(true); return }
      setDestination(dest as Destination)

      // Fetch tours for this destination: by destination_id or by state match
      const { data: tourData } = await supabase
        .from('tours')
        .select('id, name, city, state, start_date, valor_padrao, difficulty, image_url, trail_type, organizations(name, slug, logo_url)')
        .eq('is_published_to_portal', true)
        .eq('is_active', true)
        .or(`destination_id.eq.${dest.id}${dest.state ? `,state.eq.${dest.state}` : ''}`)
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true })
        .limit(24)

      setTours((tourData as Tour[]) ?? [])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PortalNav />
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !destination) {
    return (
      <div className="min-h-screen bg-background">
        <PortalNav />
        <div className="text-center py-24">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-xl font-bold">Destino não encontrado</p>
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

      {/* Hero */}
      <div className="relative">
        {destination.cover_image_url ? (
          <div className="h-56 sm:h-72 overflow-hidden">
            <img
              src={destination.cover_image_url}
              alt={destination.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-br from-primary/15 to-primary/5" />
        )}

        <div className="max-w-6xl mx-auto px-4 pb-6 pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 mb-3 -ml-2"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4" /> Destinos
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{destination.name}</h1>
          {(destination.state || destination.region) && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {[destination.state, destination.region].filter(Boolean).join(' · ')}
            </p>
          )}
          {destination.description && (
            <p className="mt-3 text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {destination.description}
            </p>
          )}
        </div>
      </div>

      {/* Tours */}
      <div className="max-w-6xl mx-auto px-4 pb-16 space-y-5">
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-bold text-foreground">
            Passeios em {destination.name}
          </h2>
          <span className="text-sm text-muted-foreground">({tours.length})</span>
        </div>

        {tours.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-2xl">
            <p className="text-sm text-muted-foreground">
              Nenhum passeio disponível para este destino no momento
            </p>
            <Link to="/buscar" className="mt-3 inline-block">
              <Button variant="outline" size="sm">Ver todos os passeios</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tours.map(tour => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
