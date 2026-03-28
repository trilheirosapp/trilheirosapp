import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, MessageCircle, Instagram, ChevronRight, Globe } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { formatCurrency, formatDateLong, whatsappLink } from '@/lib/format'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

interface Tour {
  id: string
  name: string
  start_date: string | null
  city: string | null
  state: string | null
  vagas: number | null
  valor_padrao: number | null
  difficulty: string | null
  image_url: string | null
  trail_type: string[] | null
}

const DIFF_LABELS: Record<string, string> = {
  facil: 'Fácil', moderado: 'Moderado', dificil: 'Difícil', muito_dificil: 'Muito difícil',
}
const DIFF_VARIANTS: Record<string, 'success' | 'warning' | 'destructive'> = {
  facil: 'success', moderado: 'warning', dificil: 'destructive', muito_dificil: 'destructive',
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AgencyHome() {
  const { organization } = useOrganization()
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (organization) fetchTours()
  }, [organization?.id])

  const fetchTours = async () => {
    if (!organization) return
    const { data } = await supabase
      .from('tours')
      .select('id, name, start_date, city, state, vagas, valor_padrao, difficulty, image_url, trail_type')
      .eq('organization_id', organization.id)
      .eq('is_active', true)
      .order('start_date', { ascending: true })
    setTours(data ?? [])
    setLoading(false)
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h1 className="text-xl font-bold text-foreground">Agência não encontrada</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verifique o endereço ou{' '}
            <a href="https://trilheiros.app" className="text-primary underline">
              volte ao portal
            </a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            {organization.logo_url ? (
              <img
                src={organization.logo_url}
                alt={organization.name}
                className="h-8 w-8 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                {organization.name.charAt(0)}
              </div>
            )}
            <span className="font-semibold text-foreground truncate">{organization.name}</span>
          </Link>

          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle />
            <Link to="/cliente/minhas-reservas">
              <Button variant="ghost" size="sm" className="hidden sm:flex text-xs">
                Minhas reservas
              </Button>
            </Link>
            {organization.whatsapp && (
              <a
                href={whatsappLink(organization.whatsapp, `Olá, ${organization.name}! Tenho interesse nos passeios.`)}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="sm" className="text-xs gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative">
        {organization.cover_image_url ? (
          <div className="relative h-52 sm:h-72 overflow-hidden">
            <img
              src={organization.cover_image_url}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          </div>
        ) : (
          <div className="h-20 bg-gradient-to-br from-primary/15 to-primary/5" />
        )}

        <div className="max-w-5xl mx-auto px-4 pb-8 pt-4">
          <div className="flex items-start gap-4">
            {organization.logo_url && (
              <img
                src={organization.logo_url}
                alt={organization.name}
                className={cn(
                  'w-16 h-16 rounded-xl object-cover border-4 border-background shadow-lg flex-shrink-0',
                  organization.cover_image_url && '-mt-8'
                )}
              />
            )}
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-2xl font-bold text-foreground leading-tight">{organization.name}</h1>
              {(organization.city || organization.state) && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {[organization.city, organization.state].filter(Boolean).join('/')}
                </p>
              )}
              {organization.bio && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-2xl">
                  {organization.bio}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {organization.whatsapp && (
                  <a
                    href={whatsappLink(
                      organization.whatsapp,
                      `Olá, ${organization.name}! Tenho interesse nos seus passeios.`
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="sm" className="gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5" /> Falar no WhatsApp
                    </Button>
                  </a>
                )}
                {organization.instagram && (
                  <a
                    href={`https://instagram.com/${organization.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Instagram className="w-3.5 h-3.5" /> Instagram
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tours grid */}
      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="flex items-baseline gap-2 mb-5">
          <h2 className="text-lg font-bold text-foreground">Próximos passeios</h2>
          {!loading && (
            <span className="text-sm text-muted-foreground">({tours.length})</span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-2xl" />)}
          </div>
        ) : tours.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-2xl">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium text-muted-foreground">
              Nenhum passeio disponível no momento
            </p>
            {organization.whatsapp && (
              <a
                href={whatsappLink(organization.whatsapp, 'Olá! Gostaria de saber sobre os próximos passeios.')}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block"
              >
                <Button variant="outline" size="sm" className="gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" /> Consultar no WhatsApp
                </Button>
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tours.map(tour => (
              <Link
                key={tour.id}
                to={`/passeios/${tour.id}`}
                className="group rounded-2xl border bg-card hover:border-primary/40 hover:shadow-lg transition-all overflow-hidden"
              >
                {/* Image */}
                <div className="aspect-video bg-muted overflow-hidden">
                  {tour.image_url ? (
                    <img
                      src={tour.image_url}
                      alt={tour.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <MapPin className="w-10 h-10 text-primary/20" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                      {tour.name}
                    </h3>
                    {tour.difficulty && (
                      <Badge
                        variant={DIFF_VARIANTS[tour.difficulty] ?? 'default'}
                        className="text-xs flex-shrink-0"
                      >
                        {DIFF_LABELS[tour.difficulty] ?? tour.difficulty}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    {tour.start_date && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDateLong(tour.start_date)}
                      </p>
                    )}
                    {tour.city && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        {[tour.city, tour.state].filter(Boolean).join('/')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    {tour.valor_padrao ? (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">a partir de</p>
                        <p className="text-sm font-bold text-foreground">
                          {formatCurrency(tour.valor_padrao)}
                        </p>
                      </div>
                    ) : <span />}
                    <span className="flex items-center gap-0.5 text-xs text-primary font-medium">
                      Ver detalhes <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <a
            href="https://trilheiros.app"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Powered by <span className="font-semibold">trilheiros.app</span>
          </a>
        </div>
      </footer>
    </div>
  )
}
