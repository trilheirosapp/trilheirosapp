import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, Calendar, MapPin, AlertCircle,
  CheckCircle2, Circle, ArrowRight,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

interface Stats {
  reservasThisMonth: number
  receitaThisMonth: number
  toursAtivos: number
  reservasPendentes: number
}

interface UpcomingTour {
  id: string
  name: string
  start_date: string | null
  city: string | null
  state: string | null
  vagas: number | null
  reservas_count: number
}

// ── Stat card ──────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  loading?: boolean
  alert?: boolean
}

function StatCard({ label, value, icon: Icon, loading, alert }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="h-7 w-24 mt-1" />
            ) : (
              <p className={cn('text-2xl font-bold', alert && value !== 0 && 'text-amber-500')}>
                {value}
              </p>
            )}
          </div>
          <div className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center',
            alert && typeof value === 'number' && value > 0
              ? 'bg-amber-500/10 text-amber-500'
              : 'bg-primary/10 text-primary'
          )}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { organization } = useOrganization()
  const [stats, setStats] = useState<Stats | null>(null)
  const [upcomingTours, setUpcomingTours] = useState<UpcomingTour[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingTours, setLoadingTours] = useState(true)

  useEffect(() => {
    if (!organization) return
    fetchStats()
    fetchUpcomingTours()
  }, [organization?.id])

  const fetchStats = async () => {
    if (!organization) return
    setLoadingStats(true)
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [
        { count: reservasThisMonth },
        { data: receita },
        { count: toursAtivos },
        { count: reservasPendentes },
      ] = await Promise.all([
        supabase
          .from('reservas')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .gte('created_at', startOfMonth),
        supabase
          .from('reservas')
          .select('valor_pago')
          .eq('organization_id', organization.id)
          .eq('payment_status', 'pago')
          .gte('created_at', startOfMonth),
        supabase
          .from('tours')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .eq('is_active', true),
        supabase
          .from('reservas')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id)
          .eq('status', 'pendente'),
      ])

      const receitaThisMonth =
        receita?.reduce((sum, r) => sum + (r.valor_pago ?? 0), 0) ?? 0

      setStats({
        reservasThisMonth: reservasThisMonth ?? 0,
        receitaThisMonth,
        toursAtivos: toursAtivos ?? 0,
        reservasPendentes: reservasPendentes ?? 0,
      })
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchUpcomingTours = async () => {
    if (!organization) return
    setLoadingTours(true)
    try {
      const { data } = await supabase
        .from('tours')
        .select('id, name, start_date, city, state, vagas')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true })
        .limit(5)

      if (!data) return

      const toursWithCount = await Promise.all(
        data.map(async (tour) => {
          const { count } = await supabase
            .from('reservas')
            .select('*', { count: 'exact', head: true })
            .eq('tour_id', tour.id)
            .in('status', ['confirmada', 'pendente'])
          return { ...tour, reservas_count: count ?? 0 }
        })
      )
      setUpcomingTours(toursWithCount)
    } finally {
      setLoadingTours(false)
    }
  }

  if (!organization) return null

  // ── Setup checklist ──────────────────────────────────────────────────────

  const checklistItems = [
    { label: 'Logo e cores da marca',    done: !!organization.logo_url,        link: '/admin/configuracoes' },
    { label: 'WhatsApp de contato',      done: !!organization.whatsapp,        link: '/admin/configuracoes' },
    { label: 'Mercado Pago conectado',   done: !!organization.mp_collector_id, link: '/admin/configuracoes' },
    { label: 'Primeiro passeio criado',  done: (stats?.toursAtivos ?? 0) > 0,  link: '/admin/passeios/novo' },
  ]
  const checklistDone = checklistItems.filter(i => i.done).length
  const setupComplete = checklistDone === checklistItems.length

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">

      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Visão geral</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Bem-vindo, {organization.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Reservas este mês"
          value={stats?.reservasThisMonth ?? 0}
          icon={Calendar}
          loading={loadingStats}
        />
        <StatCard
          label="Receita este mês"
          value={stats ? formatCurrency(stats.receitaThisMonth) : '—'}
          icon={TrendingUp}
          loading={loadingStats}
        />
        <StatCard
          label="Passeios ativos"
          value={stats?.toursAtivos ?? 0}
          icon={MapPin}
          loading={loadingStats}
        />
        <StatCard
          label="Reservas pendentes"
          value={stats?.reservasPendentes ?? 0}
          icon={AlertCircle}
          loading={loadingStats}
          alert
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upcoming tours */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Próximos passeios</CardTitle>
              <Link to="/admin/passeios">
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  Ver todos <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingTours ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : upcomingTours.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">Nenhum passeio agendado</p>
                <Link to="/admin/passeios/novo">
                  <Button size="sm" className="mt-3">Criar passeio</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {upcomingTours.map(tour => {
                  const ocupacao = tour.vagas
                    ? Math.round((tour.reservas_count / tour.vagas) * 100)
                    : 0
                  return (
                    <Link
                      key={tour.id}
                      to={`/admin/passeios/${tour.id}`}
                      className="flex items-center gap-3 py-3 hover:bg-accent/50 rounded-lg px-2 -mx-2 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{tour.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tour.start_date ? formatDate(tour.start_date) : '—'}
                          {tour.city && ` · ${tour.city}/${tour.state}`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium text-foreground">
                          {tour.reservas_count}/{tour.vagas ?? '?'}
                        </p>
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden mt-1">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              ocupacao >= 90
                                ? 'bg-destructive'
                                : ocupacao >= 60
                                ? 'bg-amber-500'
                                : 'bg-primary'
                            )}
                            style={{ width: `${Math.min(ocupacao, 100)}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup checklist (while incomplete) */}
        {!setupComplete && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Configure sua agência</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {checklistDone}/{checklistItems.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              {checklistItems.map(item => (
                <Link
                  key={item.label}
                  to={item.link}
                  className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-accent/50 transition-colors group"
                >
                  {item.done ? (
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className={cn(
                    'text-sm flex-1',
                    item.done ? 'text-muted-foreground line-through' : 'text-foreground'
                  )}>
                    {item.label}
                  </span>
                  {!item.done && (
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Pending reservations alert */}
        {(stats?.reservasPendentes ?? 0) > 0 && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {stats!.reservasPendentes} reserva
                    {stats!.reservasPendentes > 1 ? 's' : ''} aguardando confirmação
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Confirme ou cancele para manter seus clientes informados.
                  </p>
                  <Link to="/admin/reservas?status=pendente">
                    <Button size="sm" variant="outline" className="mt-3 h-7 text-xs">
                      Ver reservas pendentes
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
