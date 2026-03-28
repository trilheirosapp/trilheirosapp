import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, MessageCircle, Instagram, Globe } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import PortalNav from '@/components/portal/PortalNav'
import { TourCard } from '@/pages/portal/PortalHome'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { whatsappLink } from '@/lib/format'

// ── Types ──────────────────────────────────────────────────────────────────

interface Agency {
  id: string
  name: string
  slug: string
  bio: string | null
  logo_url: string | null
  cover_image_url: string | null
  city: string | null
  state: string | null
  whatsapp: string | null
  instagram: string | null
  website: string | null
  plan: string
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

export default function PortalAgencia({
  slug,
  initialAgency,
  initialTours,
}: {
  slug: string
  initialAgency?: Agency | null
  initialTours?: Tour[]
}) {
  const navigate = useNavigate()
  const [agency, setAgency] = useState<Agency | null>(initialAgency ?? null)
  const [tours, setTours] = useState<Tour[]>(initialTours ?? [])
  const [loading, setLoading] = useState(!initialAgency)
  const [notFound, setNotFound] = useState(initialAgency === null && !loading)

  useEffect(() => {
    if (slug) fetchData()
  }, [slug])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, slug, bio, logo_url, cover_image_url, city, state, whatsapp, instagram, website, plan')
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle()

      if (!org) { setNotFound(true); return }
      setAgency(org as Agency)

      const { data: tourData } = await supabase
        .from('tours')
        .select('id, name, city, state, start_date, valor_padrao, difficulty, image_url, trail_type, organizations(name, slug, logo_url)')
        .eq('organization_id', org.id)
        .eq('is_published_to_portal', true)
        .eq('is_active', true)
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true })

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
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !agency) {
    return (
      <div className="min-h-screen bg-background">
        <PortalNav />
        <div className="text-center py-24">
          <p className="text-xl font-bold">Agência não encontrada</p>
          <Link to="/" className="mt-4 inline-block">
            <Button variant="outline">Voltar ao início</Button>
          </Link>
        </div>
      </div>
    )
  }

  const agencySiteUrl = `https://${agency.slug}.trilheiros.app`

  return (
    <div className="min-h-screen bg-background">
      <PortalNav />

      {/* Cover */}
      <div className="relative">
        {agency.cover_image_url ? (
          <div className="h-48 sm:h-60 overflow-hidden">
            <img
              src={agency.cover_image_url}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-br from-primary/10 to-primary/5" />
        )}

        <div className="max-w-6xl mx-auto px-4 pb-6 pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 mb-4 -ml-2"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4" /> Agências
          </Button>

          <div className="flex items-start gap-4">
            {agency.logo_url ? (
              <img
                src={agency.logo_url}
                alt={agency.name}
                className="w-16 h-16 rounded-xl object-cover border-4 border-background shadow-lg flex-shrink-0 -mt-8"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold flex-shrink-0 border-4 border-background shadow-lg -mt-4">
                {agency.name.charAt(0)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{agency.name}</h1>
                {agency.plan === 'pro' && (
                  <Badge variant="pro" className="text-xs">Pro</Badge>
                )}
              </div>

              {(agency.city || agency.state) && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {[agency.city, agency.state].filter(Boolean).join('/')}
                </p>
              )}

              {agency.bio && (
                <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                  {agency.bio}
                </p>
              )}

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <a href={agencySiteUrl} target="_blank" rel="noreferrer">
                  <Button size="sm" className="gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> Ver site da agência
                  </Button>
                </a>
                {agency.whatsapp && (
                  <a
                    href={whatsappLink(agency.whatsapp, `Olá, ${agency.name}! Vi no trilheiros.app e tenho interesse nos passeios.`)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </Button>
                  </a>
                )}
                {agency.instagram && (
                  <a
                    href={`https://instagram.com/${agency.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="sm" variant="ghost" className="gap-1.5">
                      <Instagram className="w-3.5 h-3.5" /> Instagram
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tours */}
      <div className="max-w-6xl mx-auto px-4 pb-16 space-y-5">
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-bold text-foreground">Passeios disponíveis</h2>
          <span className="text-sm text-muted-foreground">({tours.length})</span>
        </div>

        {tours.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-2xl">
            <p className="text-sm text-muted-foreground">
              Nenhum passeio publicado no portal no momento
            </p>
            {agency.whatsapp && (
              <a
                href={whatsappLink(agency.whatsapp, `Olá, ${agency.name}! Quais passeios vocês têm disponíveis?`)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block"
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
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
