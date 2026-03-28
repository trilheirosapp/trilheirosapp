import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Users, Search } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

interface Reserva {
  id: string
  reserva_numero: string | null
  status: string | null
  payment_status: string | null
  valor_total_com_opcionais: number | null
  valor_pago: number | null
  numero_participantes: number | null
  created_at: string | null
  clientes: { nome_completo: string } | null
  tours: { name: string; start_date: string | null } | null
}

type FilterTab = 'todos' | 'pendente' | 'confirmada' | 'cancelada'

// ── Status helpers ─────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
}

const STATUS_VARIANTS: Record<string, 'warning' | 'success' | 'destructive' | 'default'> = {
  pendente: 'warning',
  confirmada: 'success',
  cancelada: 'destructive',
}

const PAYMENT_LABELS: Record<string, string> = {
  pendente: 'Aguardando',
  pago: 'Pago',
  cancelado: 'Cancelado',
  reembolsado: 'Reembolsado',
}

const PAYMENT_VARIANTS: Record<string, 'warning' | 'success' | 'destructive' | 'secondary' | 'default'> = {
  pendente: 'warning',
  pago: 'success',
  cancelado: 'destructive',
  reembolsado: 'secondary',
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AdminReservas() {
  const { organization } = useOrganization()
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('todos')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (organization) fetchReservas()
  }, [organization?.id])

  const fetchReservas = async () => {
    if (!organization) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('reservas')
        .select('id, reserva_numero, status, payment_status, valor_total_com_opcionais, valor_pago, numero_participantes, created_at, clientes(nome_completo), tours(name, start_date)')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })

      setReservas((data as Reserva[]) ?? [])
    } finally {
      setLoading(false)
    }
  }

  const filtered = reservas.filter(r => {
    if (filter !== 'todos' && r.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        r.reserva_numero?.toLowerCase().includes(q) ||
        r.clientes?.nome_completo.toLowerCase().includes(q) ||
        r.tours?.name.toLowerCase().includes(q)
      )
    }
    return true
  })

  const counts = {
    todos: reservas.length,
    pendente: reservas.filter(r => r.status === 'pendente').length,
    confirmada: reservas.filter(r => r.status === 'confirmada').length,
    cancelada: reservas.filter(r => r.status === 'cancelada').length,
  }

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'todos',     label: `Todas (${counts.todos})` },
    { key: 'pendente',  label: `Pendentes (${counts.pendente})` },
    { key: 'confirmada', label: `Confirmadas (${counts.confirmada})` },
    { key: 'cancelada', label: `Canceladas (${counts.cancelada})` },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Reservas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie todas as reservas dos seus passeios
          </p>
        </div>
      </div>

      {/* Search */}
      <Input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por cliente, passeio ou número da reserva..."
        prefix={<Search className="w-4 h-4" />}
      />

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              filter === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-foreground">
            {search ? 'Nenhuma reserva encontrada' : 'Nenhuma reserva nesta categoria'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border">
          {filtered.map(reserva => (
            <Link
              key={reserva.id}
              to={`/admin/reservas/${reserva.id}`}
              className="flex items-center gap-4 py-4 px-4 hover:bg-accent/30 rounded-xl transition-colors group"
            >
              {/* Number */}
              <div className="flex-shrink-0 w-24">
                <p className="text-sm font-mono font-medium text-foreground">
                  {reserva.reserva_numero ?? '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {reserva.created_at ? formatDate(reserva.created_at) : '—'}
                </p>
              </div>

              {/* Client + Tour */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {reserva.clientes?.nome_completo ?? 'Cliente não identificado'}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {reserva.tours?.name ?? '—'}
                  {reserva.tours?.start_date && (
                    <span> · {formatDate(reserva.tours.start_date)}</span>
                  )}
                </p>
              </div>

              {/* Participants */}
              {reserva.numero_participantes && (
                <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                  <Users className="w-3.5 h-3.5" />
                  {reserva.numero_participantes}
                </div>
              )}

              {/* Value */}
              <div className="hidden md:block text-right flex-shrink-0">
                <p className="text-sm font-medium text-foreground">
                  {formatCurrency(reserva.valor_pago ?? reserva.valor_total_com_opcionais ?? 0)}
                </p>
                {reserva.payment_status && (
                  <Badge
                    variant={PAYMENT_VARIANTS[reserva.payment_status] ?? 'default'}
                    className="text-xs mt-0.5"
                  >
                    {PAYMENT_LABELS[reserva.payment_status] ?? reserva.payment_status}
                  </Badge>
                )}
              </div>

              {/* Status */}
              <div className="flex-shrink-0">
                <Badge variant={STATUS_VARIANTS[reserva.status ?? ''] ?? 'default'}>
                  {STATUS_LABELS[reserva.status ?? ''] ?? reserva.status ?? '—'}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
