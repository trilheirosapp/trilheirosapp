import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle, Phone, Mail, User, MapPin, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate, formatCPF, formatPhone } from '@/lib/format'

// ── Types ──────────────────────────────────────────────────────────────────

interface ReservaDetail {
  id: string
  reserva_numero: string | null
  status: string | null
  payment_status: string | null
  payment_method: string | null
  valor_passeio: number | null
  valor_pago: number | null
  valor_total_com_opcionais: number | null
  numero_participantes: number | null
  problema_saude: boolean | null
  descricao_problema_saude: string | null
  contato_emergencia_nome: string | null
  contato_emergencia_telefone: string | null
  observacoes: string | null
  created_at: string | null
  data_confirmacao: string | null
  data_cancelamento: string | null
  tickets_generated: boolean | null
  clientes: {
    nome_completo: string
    cpf: string
    email: string | null
    whatsapp: string | null
    data_nascimento: string | null
  } | null
  tours: { id: string; name: string; start_date: string | null } | null
  tour_boarding_points: { name: string; departure_time: string | null } | null
}

interface Participant {
  id: string
  nome_completo: string
  cpf: string | null
  whatsapp: string | null
  email: string | null
  pricing_option_name: string | null
  problema_saude: boolean | null
  descricao_problema_saude: string | null
}

const STATUS_VARIANTS: Record<string, 'warning' | 'success' | 'destructive' | 'default'> = {
  pendente: 'warning', confirmada: 'success', cancelada: 'destructive',
}
const PAYMENT_VARIANTS: Record<string, 'warning' | 'success' | 'destructive' | 'secondary' | 'default'> = {
  pendente: 'warning', pago: 'success', cancelado: 'destructive', reembolsado: 'secondary',
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AdminReservaDetail({ reservaId }: { reservaId: string }) {
  const navigate = useNavigate()
  const { organization } = useOrganization()
  const [reserva, setReserva] = useState<ReservaDetail | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (organization && reservaId) fetchData()
  }, [organization?.id, reservaId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [{ data: r }, { data: p }] = await Promise.all([
        supabase
          .from('reservas')
          .select('*, clientes(*), tours(id, name, start_date), tour_boarding_points(name, departure_time)')
          .eq('id', reservaId)
          .single(),
        supabase
          .from('reservation_participants')
          .select('id, nome_completo, cpf, whatsapp, email, pricing_option_name, problema_saude, descricao_problema_saude')
          .eq('reserva_id', reservaId)
          .order('participant_index'),
      ])
      if (r) setReserva(r as ReservaDetail)
      setParticipants((p as Participant[]) ?? [])
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!confirm('Confirmar esta reserva?')) return
    setConfirming(true)
    const { error } = await supabase
      .from('reservas')
      .update({ status: 'confirmada', data_confirmacao: new Date().toISOString() })
      .eq('id', reservaId)
    setConfirming(false)
    if (error) { toast.error('Erro ao confirmar reserva'); return }
    toast.success('Reserva confirmada!')
    setReserva(prev => prev ? { ...prev, status: 'confirmada' } : prev)
  }

  const handleCancel = async () => {
    if (!confirm('Cancelar esta reserva? Esta ação não pode ser desfeita.')) return
    setCancelling(true)
    const { error } = await supabase
      .from('reservas')
      .update({ status: 'cancelada', data_cancelamento: new Date().toISOString() })
      .eq('id', reservaId)
    setCancelling(false)
    if (error) { toast.error('Erro ao cancelar reserva'); return }
    toast.success('Reserva cancelada')
    setReserva(prev => prev ? { ...prev, status: 'cancelada' } : prev)
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!reserva) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center py-16">
        <p className="text-sm text-muted-foreground">Reserva não encontrada</p>
        <Link to="/admin/reservas">
          <Button variant="outline" className="mt-4">Voltar para reservas</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/reservas')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-foreground font-mono">
                {reserva.reserva_numero ?? reserva.id.slice(0, 8).toUpperCase()}
              </h1>
              <Badge variant={STATUS_VARIANTS[reserva.status ?? ''] ?? 'default'}>
                {reserva.status === 'pendente' ? 'Pendente' : reserva.status === 'confirmada' ? 'Confirmada' : reserva.status === 'cancelada' ? 'Cancelada' : reserva.status ?? '—'}
              </Badge>
              {reserva.payment_status && (
                <Badge variant={PAYMENT_VARIANTS[reserva.payment_status] ?? 'default'}>
                  {reserva.payment_status === 'pago' ? 'Pago' : reserva.payment_status === 'pendente' ? 'Pagamento pendente' : reserva.payment_status}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Criada em {reserva.created_at ? formatDate(reserva.created_at) : '—'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0">
          {reserva.status === 'pendente' && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={handleCancel}
                disabled={cancelling}
              >
                <XCircle className="w-4 h-4" />
                Cancelar
              </Button>
              <Button size="sm" onClick={handleConfirm} disabled={confirming}>
                <CheckCircle2 className="w-4 h-4" />
                Confirmar
              </Button>
            </>
          )}
          {reserva.status === 'confirmada' && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleCancel}
              disabled={cancelling}
            >
              <XCircle className="w-4 h-4" /> Cancelar reserva
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Tour info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Passeio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reserva.tours && (
              <Link
                to={`/admin/passeios/${reserva.tours.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {reserva.tours.name}
              </Link>
            )}
            {reserva.tours?.start_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(reserva.tours.start_date)}
              </div>
            )}
            {reserva.tour_boarding_points && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                {reserva.tour_boarding_points.name}
                {reserva.tour_boarding_points.departure_time && ` · ${reserva.tour_boarding_points.departure_time}`}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor do passeio</span>
              <span>{formatCurrency(reserva.valor_passeio ?? 0)}</span>
            </div>
            {(reserva.valor_total_com_opcionais ?? 0) > (reserva.valor_passeio ?? 0) && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Opcionais</span>
                <span>{formatCurrency((reserva.valor_total_com_opcionais ?? 0) - (reserva.valor_passeio ?? 0))}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-sm font-medium">
              <span>Total pago</span>
              <span className="text-foreground">{formatCurrency(reserva.valor_pago ?? reserva.valor_total_com_opcionais ?? 0)}</span>
            </div>
            {reserva.payment_method && (
              <p className="text-xs text-muted-foreground">
                Via {reserva.payment_method === 'pix' ? 'PIX' : reserva.payment_method === 'credit_card' ? 'Cartão de crédito' : reserva.payment_method}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Client info */}
        {reserva.clientes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cliente responsável</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium">{reserva.clientes.nome_completo}</span>
              </div>
              {reserva.clientes.cpf && (
                <p className="text-xs text-muted-foreground pl-5">{formatCPF(reserva.clientes.cpf)}</p>
              )}
              {reserva.clientes.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />
                  <a href={`mailto:${reserva.clientes.email}`} className="hover:text-foreground">
                    {reserva.clientes.email}
                  </a>
                </div>
              )}
              {reserva.clientes.whatsapp && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  <a href={`https://wa.me/55${reserva.clientes.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="hover:text-foreground">
                    {formatPhone(reserva.clientes.whatsapp)}
                  </a>
                </div>
              )}
              {reserva.contato_emergencia_nome && (
                <div className="pt-1 border-t">
                  <p className="text-xs text-muted-foreground">Contato de emergência</p>
                  <p className="text-sm">{reserva.contato_emergencia_nome}</p>
                  {reserva.contato_emergencia_telefone && (
                    <p className="text-xs text-muted-foreground">{formatPhone(reserva.contato_emergencia_telefone)}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Observations */}
        {(reserva.observacoes || reserva.problema_saude) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reserva.problema_saude && (
                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Problema de saúde reportado</p>
                  {reserva.descricao_problema_saude && (
                    <p className="text-sm mt-1 text-foreground">{reserva.descricao_problema_saude}</p>
                  )}
                </div>
              )}
              {reserva.observacoes && (
                <p className="text-sm text-muted-foreground">{reserva.observacoes}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Participants */}
      {participants.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Participantes ({participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {participants.map((p, i) => (
                <div key={p.id} className="px-6 py-3 flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{p.nome_completo}</p>
                      {p.pricing_option_name && (
                        <Badge variant="outline" className="text-xs">{p.pricing_option_name}</Badge>
                      )}
                      {p.problema_saude && (
                        <Badge variant="warning" className="text-xs">Saúde</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      {p.cpf && <span>{formatCPF(p.cpf)}</span>}
                      {p.whatsapp && (
                        <a href={`https://wa.me/55${p.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="hover:text-foreground">
                          {formatPhone(p.whatsapp)}
                        </a>
                      )}
                    </div>
                    {p.problema_saude && p.descricao_problema_saude && (
                      <p className="text-xs text-amber-500 mt-1">{p.descricao_problema_saude}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
