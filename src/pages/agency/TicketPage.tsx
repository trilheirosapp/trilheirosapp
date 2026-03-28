import { useEffect, useState } from 'react'
import { QrCode, MapPin, Calendar, Clock } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '@/integrations/supabase/client'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { formatDateLong } from '@/lib/format'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

interface TicketDetail {
  id: string
  ticket_number: string
  qr_token: string
  status: string | null
  checkin_at: string | null
  boarding_point_name: string | null
  boarding_point_address: string | null
  boarding_time: string | null
  trip_date: string | null
  reservation_participants: {
    nome_completo: string
    pricing_option_name: string | null
  } | null
  tours: {
    name: string
    image_url: string | null
    city: string | null
    state: string | null
  } | null
  organizations: {
    name: string
    logo_url: string | null
  } | null
}

// ── Main component ─────────────────────────────────────────────────────────

export default function TicketPage({ token, initialTicket }: { token: string; initialTicket?: TicketDetail | null }) {
  const [ticket, setTicket] = useState<TicketDetail | null>(initialTicket ?? null)
  const [loading, setLoading] = useState(!initialTicket)
  const [notFound, setNotFound] = useState(initialTicket === null && !loading)

  useEffect(() => {
    if (token) fetchTicket()
  }, [token])

  const fetchTicket = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('tickets')
        .select('*, reservation_participants(nome_completo, pricing_option_name), tours(name, image_url, city, state), organizations(name, logo_url)')
        .eq('qr_token', token)
        .single()

      if (!data) { setNotFound(true); return }
      setTicket(data as TicketDetail)
    } finally {
      setLoading(false)
    }
  }

  const ticketUrl = typeof window !== 'undefined'
    ? window.location.href
    : `https://trilheiros.app/ticket/${token}`

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (notFound || !ticket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-lg font-bold text-foreground">Ingresso não encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Verifique o QR code ou o número do ingresso
          </p>
        </div>
      </div>
    )
  }

  const used = ticket.status === 'used'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">

        {/* Org header */}
        <div className="flex items-center gap-2 justify-center">
          {ticket.organizations?.logo_url ? (
            <img
              src={ticket.organizations.logo_url}
              alt={ticket.organizations.name}
              className="h-8 w-8 rounded-lg object-cover"
            />
          ) : null}
          <span className="font-semibold text-foreground">
            {ticket.organizations?.name}
          </span>
        </div>

        {/* Ticket card */}
        <div className={cn(
          'rounded-2xl border overflow-hidden shadow-lg',
          used && 'opacity-60'
        )}>
          {/* Tour image / header */}
          {ticket.tours?.image_url ? (
            <div className="h-32 overflow-hidden">
              <img
                src={ticket.tours.image_url}
                alt={ticket.tours.name ?? ''}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-16 bg-gradient-to-r from-primary/20 to-primary/10" />
          )}

          <div className="p-5 space-y-4">
            {/* Tour info */}
            <div>
              <p className="font-bold text-foreground text-lg leading-tight">
                {ticket.tours?.name}
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                {ticket.trip_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDateLong(ticket.trip_date)}
                  </span>
                )}
                {(ticket.tours?.city || ticket.tours?.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {[ticket.tours.city, ticket.tours.state].filter(Boolean).join('/')}
                  </span>
                )}
              </div>
            </div>

            <Separator />

            {/* Participant */}
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Participante</p>
                <p className="font-semibold text-foreground mt-0.5">
                  {ticket.reservation_participants?.nome_completo}
                </p>
                {ticket.reservation_participants?.pricing_option_name && (
                  <Badge variant="outline" className="text-xs mt-1">
                    {ticket.reservation_participants.pricing_option_name}
                  </Badge>
                )}
              </div>

              {ticket.boarding_point_name && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Embarque</p>
                  <p className="text-sm font-medium mt-0.5">{ticket.boarding_point_name}</p>
                  {ticket.boarding_point_address && (
                    <p className="text-xs text-muted-foreground">{ticket.boarding_point_address}</p>
                  )}
                  {ticket.boarding_time && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Clock className="w-3.5 h-3.5" /> {ticket.boarding_time}
                    </p>
                  )}
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Ingresso</p>
                <p className="font-mono text-sm font-bold mt-0.5">{ticket.ticket_number}</p>
              </div>
            </div>

            <Separator />

            {/* QR Code */}
            <div className="flex flex-col items-center gap-3 py-2">
              {used ? (
                <div className="w-40 h-40 rounded-xl bg-muted flex flex-col items-center justify-center gap-2">
                  <QrCode className="w-8 h-8 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground text-center">Check-in realizado</p>
                  {ticket.checkin_at && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(ticket.checkin_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-white rounded-xl">
                  <QRCodeSVG value={ticketUrl} size={160} />
                </div>
              )}

              <Badge
                variant={used ? 'secondary' : 'success'}
                className="text-xs"
              >
                {used ? 'Utilizado' : 'Válido'}
              </Badge>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Apresente este QR code na hora do embarque
        </p>
      </div>
    </div>
  )
}
