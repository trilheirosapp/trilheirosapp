import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Circle, Search, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

interface TourInfo {
  id: string
  name: string
  start_date: string | null
  city: string | null
}

interface Ticket {
  id: string
  ticket_number: string
  qr_token: string
  status: string | null
  checkin_at: string | null
  boarding_point_name: string | null
  boarding_time: string | null
  reservation_participants: {
    nome_completo: string
    cpf: string | null
    pricing_option_name: string | null
  } | null
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AdminCheckin({ tourId }: { tourId: string }) {
  const { organization } = useOrganization()
  const [tour, setTour] = useState<TourInfo | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [qrInput, setQrInput] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (organization && tourId) fetchData()
  }, [organization?.id, tourId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [{ data: t }, { data: tk }] = await Promise.all([
        supabase.from('tours').select('id, name, start_date, city').eq('id', tourId).single(),
        supabase
          .from('tickets')
          .select('id, ticket_number, qr_token, status, checkin_at, boarding_point_name, boarding_time, reservation_participants(nome_completo, cpf, pricing_option_name)')
          .eq('tour_id', tourId)
          .order('ticket_number'),
      ])
      if (t) setTour(t as TourInfo)
      setTickets((tk as Ticket[]) ?? [])
    } finally {
      setLoading(false)
    }
  }

  const doCheckin = async (ticketId: string) => {
    setProcessing(ticketId)
    const { error } = await supabase
      .from('tickets')
      .update({
        status: 'used',
        checkin_at: new Date().toISOString(),
        checkin_by: (await supabase.auth.getUser()).data.user?.email ?? 'admin',
      })
      .eq('id', ticketId)
    setProcessing(null)

    if (error) { toast.error('Erro ao registrar check-in'); return }
    toast.success('Check-in realizado!')
    setTickets(prev =>
      prev.map(t => t.id === ticketId ? { ...t, status: 'used', checkin_at: new Date().toISOString() } : t)
    )
  }

  const handleQrSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = qrInput.trim()
    if (!token) return

    const ticket = tickets.find(t => t.qr_token === token || t.ticket_number === token)
    if (!ticket) {
      toast.error('Ingresso não encontrado neste passeio')
      return
    }
    if (ticket.status === 'used') {
      toast.error(`Check-in já realizado para ${ticket.reservation_participants?.nome_completo}`)
      return
    }
    await doCheckin(ticket.id)
    setQrInput('')
  }

  const filtered = tickets.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.ticket_number.toLowerCase().includes(q) ||
      t.reservation_participants?.nome_completo.toLowerCase().includes(q) ||
      (t.reservation_participants?.cpf ?? '').includes(q)
    )
  })

  const checkedIn = tickets.filter(t => t.status === 'used').length
  const total = tickets.length

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin/passeios">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex-1">
          {loading ? (
            <Skeleton className="h-6 w-48" />
          ) : (
            <>
              <h1 className="text-lg font-bold text-foreground">{tour?.name ?? 'Check-in'}</h1>
              <p className="text-sm text-muted-foreground">
                {tour?.start_date ? formatDate(tour.start_date) : ''}
                {tour?.city ? ` · ${tour.city}` : ''}
              </p>
            </>
          )}
        </div>
        {!loading && (
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{checkedIn}/{total}</p>
            <p className="text-xs text-muted-foreground">check-ins</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {!loading && total > 0 && (
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${Math.min((checkedIn / total) * 100, 100)}%` }}
          />
        </div>
      )}

      {/* QR / manual input */}
      <form onSubmit={handleQrSubmit} className="flex gap-2">
        <Input
          value={qrInput}
          onChange={e => setQrInput(e.target.value)}
          placeholder="Escaneie o QR code ou digite o número do ingresso..."
          prefix={<QrCode className="w-4 h-4" />}
          className="flex-1"
        />
        <Button type="submit" disabled={!qrInput.trim()}>OK</Button>
      </form>

      {/* Search */}
      <Input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar participante..."
        prefix={<Search className="w-4 h-4" />}
      />

      {/* Tickets list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : total === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            Nenhum ingresso gerado para este passeio ainda
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border">
          {filtered.map(ticket => {
            const done = ticket.status === 'used'
            return (
              <div
                key={ticket.id}
                className={cn(
                  'flex items-center gap-4 px-4 py-3 transition-colors',
                  done ? 'bg-primary/5' : 'hover:bg-accent/30'
                )}
              >
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', done && 'text-muted-foreground line-through')}>
                    {ticket.reservation_participants?.nome_completo ?? '—'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="font-mono">{ticket.ticket_number}</span>
                    {ticket.reservation_participants?.pricing_option_name && (
                      <Badge variant="outline" className="text-xs py-0">
                        {ticket.reservation_participants.pricing_option_name}
                      </Badge>
                    )}
                    {ticket.boarding_point_name && <span>· {ticket.boarding_point_name}</span>}
                  </div>
                </div>

                {done ? (
                  <p className="text-xs text-muted-foreground flex-shrink-0">
                    {ticket.checkin_at
                      ? new Date(ticket.checkin_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                      : 'Feito'}
                  </p>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => doCheckin(ticket.id)}
                    disabled={processing === ticket.id}
                    className="flex-shrink-0 h-7 text-xs"
                  >
                    {processing === ticket.id ? '...' : 'Check-in'}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
