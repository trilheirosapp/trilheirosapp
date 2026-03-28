import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Ticket, LogOut } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDateLong } from '@/lib/format'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

interface Reserva {
  id: string
  reserva_numero: string | null
  status: string | null
  payment_status: string | null
  numero_participantes: number | null
  valor_pago: number | null
  valor_total_com_opcionais: number | null
  tickets_generated: boolean | null
  tours: { id: string; name: string; start_date: string | null; city: string | null; state: string | null; image_url: string | null } | null
}

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente', confirmada: 'Confirmada', cancelada: 'Cancelada',
}
const STATUS_VARIANTS: Record<string, 'warning' | 'success' | 'destructive'> = {
  pendente: 'warning', confirmada: 'success', cancelada: 'destructive',
}

// ── Main component ─────────────────────────────────────────────────────────

export default function MinhasReservas() {
  const navigate = useNavigate()
  const { organization } = useOrganization()
  const [user, setUser] = useState<{ id: string; email: string | undefined } | null>(null)
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/cliente/entrar')
      return
    }
    setUser({ id: session.user.id, email: session.user.email })
    fetchReservas(session.user.email!)
  }

  const fetchReservas = async (email: string) => {
    if (!organization) return
    setLoading(true)
    try {
      // Find client by email
      const { data: cliente } = await supabase
        .from('clientes')
        .select('id')
        .eq('email', email)
        .eq('organization_id', organization.id)
        .maybeSingle()

      if (!cliente) { setLoading(false); return }

      const { data } = await supabase
        .from('reservas')
        .select('id, reserva_numero, status, payment_status, numero_participantes, valor_pago, valor_total_com_opcionais, tickets_generated, tours(id, name, start_date, city, state, image_url)')
        .eq('cliente_id', cliente.id)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })

      setReservas((data as Reserva[]) ?? [])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            {organization?.logo_url && (
              <img src={organization.logo_url} alt="" className="h-7 w-7 rounded-lg object-cover" />
            )}
            <span className="text-sm font-semibold text-foreground">{organization?.name}</span>
          </Link>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={handleLogout}>
            <LogOut className="w-3.5 h-3.5" /> Sair
          </Button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        <div>
          <h1 className="text-xl font-bold text-foreground">Minhas reservas</h1>
          {user?.email && (
            <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : reservas.length === 0 ? (
          <div className="text-center py-16">
            <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="font-medium text-foreground">Nenhuma reserva encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              Suas reservas aparecerão aqui
            </p>
            <Link to="/">
              <Button size="sm" className="mt-4">Ver passeios disponíveis</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reservas.map(reserva => (
              <div key={reserva.id} className="border rounded-2xl overflow-hidden bg-card">
                <div className="flex gap-3 p-4">
                  {/* Tour image */}
                  {reserva.tours?.image_url && (
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={reserva.tours.image_url}
                        alt={reserva.tours.name ?? ''}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground line-clamp-1">
                        {reserva.tours?.name}
                      </p>
                      <Badge
                        variant={STATUS_VARIANTS[reserva.status ?? ''] ?? 'default'}
                        className="text-xs flex-shrink-0"
                      >
                        {STATUS_LABELS[reserva.status ?? ''] ?? reserva.status}
                      </Badge>
                    </div>

                    <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      {reserva.tours?.start_date && (
                        <p className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDateLong(reserva.tours.start_date)}
                        </p>
                      )}
                      {reserva.tours?.city && (
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {[reserva.tours.city, reserva.tours.state].filter(Boolean).join('/')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground font-mono">
                        {reserva.reserva_numero}
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {formatCurrency(reserva.valor_pago ?? reserva.valor_total_com_opcionais ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className={cn(
                  'px-4 py-2.5 border-t bg-muted/30 flex items-center gap-2 justify-end'
                )}>
                  {reserva.reserva_numero && (
                    <Link to={`/reserva/${reserva.reserva_numero}`}>
                      <Button variant="ghost" size="sm" className="text-xs h-7">
                        Ver status
                      </Button>
                    </Link>
                  )}
                  {reserva.tickets_generated && (
                    <Link to={`/reserva/${reserva.reserva_numero}`}>
                      <Button size="sm" className="text-xs h-7 gap-1.5">
                        <Ticket className="w-3.5 h-3.5" /> Ver ingressos
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
