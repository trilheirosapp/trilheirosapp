import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, XCircle, Calendar, MapPin, Users, MessageCircle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDateLong, whatsappLink } from '@/lib/format'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

interface ReservaPublic {
  id: string
  reserva_numero: string | null
  status: string | null
  payment_status: string | null
  numero_participantes: number | null
  valor_pago: number | null
  valor_total_com_opcionais: number | null
  created_at: string | null
  tours: { name: string; start_date: string | null; city: string | null; state: string | null } | null
  tour_boarding_points: { name: string; departure_time: string | null } | null
  clientes: { nome_completo: string } | null
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ReservaStatus({ slug }: { slug: string }) {
  const { organization } = useOrganization()
  const [reserva, setReserva] = useState<ReservaPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (slug) fetchReserva()
  }, [slug])

  const fetchReserva = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('reservas')
        .select('id, reserva_numero, status, payment_status, numero_participantes, valor_pago, valor_total_com_opcionais, created_at, tours(name, start_date, city, state), tour_boarding_points(name, departure_time), clientes(nome_completo)')
        .or(`reserva_numero.eq.${slug},slug.eq.${slug}`)
        .maybeSingle()

      if (!data) { setNotFound(true); return }
      setReserva(data as ReservaPublic)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (notFound || !reserva) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <p className="text-lg font-bold">Reserva não encontrada</p>
          <p className="text-sm text-muted-foreground mt-1">
            Verifique o número da reserva
          </p>
          <Link to="/" className="mt-4 inline-block">
            <Button variant="outline" size="sm">Voltar ao início</Button>
          </Link>
        </div>
      </div>
    )
  }

  const statusConfig = {
    pendente: {
      icon: Clock,
      label: 'Aguardando confirmação',
      description: 'Sua reserva foi recebida. Aguardando confirmação do pagamento.',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    confirmada: {
      icon: CheckCircle2,
      label: 'Reserva confirmada!',
      description: 'Sua reserva está confirmada. Nos vemos no passeio!',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    cancelada: {
      icon: XCircle,
      label: 'Reserva cancelada',
      description: 'Esta reserva foi cancelada.',
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
  }

  const config = statusConfig[reserva.status as keyof typeof statusConfig] ?? statusConfig.pendente
  const Icon = config.icon

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-5">

        {/* Org branding */}
        {organization && (
          <div className="text-center">
            {organization.logo_url && (
              <img
                src={organization.logo_url}
                alt={organization.name}
                className="h-10 mx-auto mb-2 object-contain"
              />
            )}
            <p className="text-sm font-semibold text-foreground">{organization.name}</p>
          </div>
        )}

        {/* Status */}
        <div className={cn('rounded-2xl p-5 text-center space-y-2', config.bg)}>
          <Icon className={cn('w-10 h-10 mx-auto', config.color)} />
          <p className={cn('font-bold text-lg', config.color)}>{config.label}</p>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>

        {/* Reservation details */}
        <div className="border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Número da reserva</p>
            <p className="font-mono font-bold text-foreground">{reserva.reserva_numero}</p>
          </div>

          {reserva.clientes && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Responsável</p>
              <p className="text-sm font-medium">{reserva.clientes.nome_completo}</p>
            </div>
          )}

          {reserva.tours && (
            <div className="space-y-1.5 pt-2 border-t">
              <p className="text-sm font-semibold">{reserva.tours.name}</p>
              <div className="text-xs text-muted-foreground space-y-1">
                {reserva.tours.start_date && (
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDateLong(reserva.tours.start_date)}
                  </p>
                )}
                {reserva.tours.city && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {[reserva.tours.city, reserva.tours.state].filter(Boolean).join('/')}
                  </p>
                )}
                {reserva.tour_boarding_points && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {reserva.tour_boarding_points.name}
                    {reserva.tour_boarding_points.departure_time && ` · ${reserva.tour_boarding_points.departure_time}`}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {reserva.numero_participantes} participante{(reserva.numero_participantes ?? 0) > 1 ? 's' : ''}
            </p>
            <p className="text-sm font-bold">
              {formatCurrency(reserva.valor_pago ?? reserva.valor_total_com_opcionais ?? 0)}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Pagamento</p>
            <Badge
              variant={
                reserva.payment_status === 'pago' ? 'success' :
                reserva.payment_status === 'pendente' ? 'warning' :
                'destructive'
              }
              className="text-xs"
            >
              {reserva.payment_status === 'pago' ? 'Pago' :
               reserva.payment_status === 'pendente' ? 'Pendente' :
               'Cancelado'}
            </Badge>
          </div>
        </div>

        {/* WhatsApp CTA for pending */}
        {reserva.status === 'pendente' && organization?.whatsapp && (
          <a
            href={whatsappLink(
              organization.whatsapp,
              `Olá! Quero confirmar o pagamento da reserva ${reserva.reserva_numero}.`
            )}
            target="_blank"
            rel="noreferrer"
          >
            <Button className="w-full gap-2">
              <MessageCircle className="w-4 h-4" />
              Confirmar pagamento via WhatsApp
            </Button>
          </a>
        )}

        <Link to="/">
          <Button variant="ghost" className="w-full">Voltar ao início</Button>
        </Link>
      </div>
    </div>
  )
}
