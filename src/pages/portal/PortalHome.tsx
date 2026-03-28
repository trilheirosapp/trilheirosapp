import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, MapPin, Calendar, ChevronRight,
  Mountain, Zap, Users, Star,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import PortalNav from '@/components/portal/PortalNav'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDateLong } from '@/lib/format'

// ── Types ──────────────────────────────────────────────────────────────────

interface Destination {
  id: string
  name: string
  slug: string
  state: string | null
  cover_image_url: string | null
  description: string | null
}

interface FeaturedTour {
  id: string
  name: string
  city: string | null
  state: string | null
  start_date: string | null
  valor_padrao: number | null
  difficulty: string | null
  image_url: string | null
  organizations: { name: string; slug: string; logo_url: string | null } | null
}

const DIFF_LABELS: Record<string, string> = {
  facil: 'Fácil', moderado: 'Moderado', dificil: 'Difícil', muito_dificil: 'Muito difícil',
}
const DIFF_VARIANTS: Record<string, 'success' | 'warning' | 'destructive'> = {
  facil: 'success', moderado: 'warning', dificil: 'destructive', muito_dificil: 'destructive',
}

// ── Main component ─────────────────────────────────────────────────────────

export default function PortalHome() {
  const navigate = useNavigate()
  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [featuredTours, setFeaturedTours] = useState<FeaturedTour[]>([])
  const [loadingDest, setLoadingDest] = useState(true)
  const [loadingTours, setLoadingTours] = useState(true)

  useEffect(() => {
    fetchDestinations()
    fetchFeaturedTours()
  }, [])

  const fetchDestinations = async () => {
    const { data } = await supabase
      .from('destinations')
      .select('id, name, slug, state, cover_image_url, description')
      .eq('is_featured', true)
      .order('name')
      .limit(6)
    setDestinations(data ?? [])
    setLoadingDest(false)
  }

  const fetchFeaturedTours = async () => {
    const { data } = await supabase
      .from('tours')
      .select('id, name, city, state, start_date, valor_padrao, difficulty, image_url, organizations(name, slug, logo_url)')
      .eq('is_published_to_portal', true)
      .eq('is_active', true)
      .eq('is_featured', true)
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: true })
      .limit(6)
    setFeaturedTours((data as FeaturedTour[]) ?? [])
    setLoadingTours(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/buscar${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <PortalNav />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium">
            <Mountain className="w-4 h-4" />
            Aventuras pelo Brasil
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground leading-tight">
            Todas as trilhas do Brasil
            <br />
            <span className="text-primary">em um só lugar</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubra passeios de aventura, trilhas, cachoeiras, rapel e ecoturismo
            de agências especializadas de todo o país.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Destino, trilha, atividade..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button type="submit" className="h-11 px-6">
              Buscar
            </Button>
          </form>

          {/* Quick filters */}
          <div className="flex flex-wrap gap-2 justify-center text-sm">
            {['Trilha', 'Cachoeira', 'Camping', 'Rapel', 'Escalada'].map(t => (
              <button
                key={t}
                onClick={() => navigate(`/buscar?tipo=${t.toLowerCase()}`)}
                className="px-3 py-1 rounded-full border border-border hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors text-muted-foreground"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────── */}
      <div className="border-y bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 py-4 grid grid-cols-3 divide-x divide-border">
          {[
            { icon: Mountain, label: 'Passeios disponíveis', value: '100+' },
            { icon: Users, label: 'Agências parceiras', value: '20+' },
            { icon: Star, label: 'Avaliação média', value: '4.8★' },
          ].map(stat => (
            <div key={stat.label} className="flex items-center justify-center gap-2.5 px-4">
              <stat.icon className="w-5 h-5 text-primary hidden sm:block" />
              <div className="text-center sm:text-left">
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground hidden sm:block">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-14">

        {/* ── Destinos em destaque ─────────────────────────────── */}
        {(loadingDest || destinations.length > 0) && (
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Destinos populares</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Explore os melhores destinos de aventura</p>
              </div>
              <Link to="/buscar">
                <Button variant="ghost" size="sm" className="gap-1 text-sm">
                  Ver todos <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            {loadingDest ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {destinations.map(dest => (
                  <Link
                    key={dest.id}
                    to={`/destinos/${dest.slug}`}
                    className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-muted hover:shadow-lg transition-all"
                  >
                    {dest.cover_image_url ? (
                      <img
                        src={dest.cover_image_url}
                        alt={dest.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <MapPin className="w-10 h-10 text-primary/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white font-semibold text-sm leading-snug">{dest.name}</p>
                      {dest.state && (
                        <p className="text-white/70 text-xs mt-0.5">{dest.state}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Passeios em destaque ─────────────────────────────── */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Próximas aventuras</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Passeios com vagas disponíveis</p>
            </div>
            <Link to="/buscar">
              <Button variant="ghost" size="sm" className="gap-1 text-sm">
                Ver todos <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {loadingTours ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-72 rounded-2xl" />)}
            </div>
          ) : featuredTours.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-2xl">
              <Mountain className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">
                Nenhum passeio em destaque no momento
              </p>
              <Link to="/buscar" className="mt-3 inline-block">
                <Button variant="outline" size="sm">Explorar todos os passeios</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredTours.map(tour => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}
        </section>

        {/* ── Agency CTA ──────────────────────────────────────── */}
        <section className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center mx-auto">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Você é guia ou tem uma agência de aventura?</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
              Cadastre seus passeios no trilheiros.app e comece a receber reservas online hoje mesmo.
              Site próprio, gestão de reservas e pagamentos integrados.
            </p>
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/cadastro">
              <Button>Cadastrar minha agência — é grátis</Button>
            </Link>
            <Link to="/entrar">
              <Button variant="outline">Já tenho conta</Button>
            </Link>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t mt-8">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1 font-bold">
            <span className="text-primary">trilheiros</span>
            <span className="text-foreground">.app</span>
          </div>
          <p>© {new Date().getFullYear()} trilheiros.app — Todos os direitos reservados</p>
          <div className="flex gap-4">
            <Link to="/entrar" className="hover:text-foreground transition-colors">Para agências</Link>
            <Link to="/buscar" className="hover:text-foreground transition-colors">Buscar passeios</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── Tour card (shared) ─────────────────────────────────────────────────────

function getAgencyBaseUrl(slug?: string) {
  if (!slug) return '/'
  const host = typeof window !== 'undefined' ? window.location.hostname : 'trilheiros.app'
  if (host === 'localhost' || host === '127.0.0.1') {
    return `http://${slug}.localhost:${window.location.port}`
  }
  return `https://${slug}.trilheiros.app`
}

export function TourCard({ tour }: { tour: FeaturedTour }) {
  return (
    <Link
      to={`${getAgencyBaseUrl(tour.organizations?.slug)}/passeios/${tour.id}`}
      target="_blank"
      rel="noreferrer"
      className="group rounded-2xl border bg-card hover:border-primary/40 hover:shadow-lg transition-all overflow-hidden"
    >
      <div className="aspect-video bg-muted overflow-hidden">
        {tour.image_url ? (
          <img
            src={tour.image_url}
            alt={tour.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <MapPin className="w-8 h-8 text-primary/20" />
          </div>
        )}
      </div>
      <div className="p-4 space-y-2.5">
        {/* Agency */}
        {tour.organizations && (
          <div className="flex items-center gap-1.5">
            {tour.organizations.logo_url && (
              <img
                src={tour.organizations.logo_url}
                alt={tour.organizations.name}
                className="w-4 h-4 rounded object-cover"
              />
            )}
            <span className="text-xs text-muted-foreground">{tour.organizations.name}</span>
          </div>
        )}

        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
            {tour.name}
          </h3>
          {tour.difficulty && (
            <Badge variant={DIFF_VARIANTS[tour.difficulty] ?? 'default'} className="text-xs flex-shrink-0">
              {DIFF_LABELS[tour.difficulty] ?? tour.difficulty}
            </Badge>
          )}
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          {tour.start_date && (
            <p className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDateLong(tour.start_date)}
            </p>
          )}
          {tour.city && (
            <p className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {[tour.city, tour.state].filter(Boolean).join('/')}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          {tour.valor_padrao ? (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">a partir de</p>
              <p className="text-sm font-bold text-foreground">{formatCurrency(tour.valor_padrao)}</p>
            </div>
          ) : <span />}
          <span className="text-xs text-primary font-medium flex items-center gap-0.5">
            Ver passeio <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
