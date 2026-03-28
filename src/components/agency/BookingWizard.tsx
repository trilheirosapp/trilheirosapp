import { useState } from 'react'
import { MessageCircle, Check, ChevronRight, ChevronLeft, Users, MapPin, X, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatCPF, sanitizeCPF, whatsappLink, isValidCPF } from '@/lib/format'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

interface PricingOption {
  id: string
  option_name: string
  pix_price: number | null
  card_price: number | null
}

interface BoardingPoint {
  id: string
  name: string
  address: string | null
  departure_time: string | null
}

interface OptionalItem {
  id: string
  name: string
  description: string | null
  price: number
}

interface Tour {
  id: string
  name: string
  start_date: string | null
  pix_discount_percent: number | null
  payment_mode: string | null
}

interface ParticipantForm {
  nome: string
  cpf: string
  whatsapp: string
  email: string
  dataNascimento: string
  problemaSaude: boolean
  descricaoSaude: string
}

export interface BookingWizardProps {
  open: boolean
  onClose: () => void
  tour: Tour
  pricingOptions: PricingOption[]
  boardingPoints: BoardingPoint[]
  optionalItems: OptionalItem[]
}

// ── Constants ───────────────────────────────────────────────────────────────

const emptyParticipant = (): ParticipantForm => ({
  nome: '', cpf: '', whatsapp: '', email: '',
  dataNascimento: '', problemaSaude: false, descricaoSaude: '',
})

// ── Main component ───────────────────────────────────────────────────────────

export default function BookingWizard({
  open, onClose, tour, pricingOptions, boardingPoints, optionalItems,
}: BookingWizardProps) {
  const { organization } = useOrganization()

  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [reservaNumero, setReservaNumero] = useState<string | null>(null)
  const [reservaId, setReservaId] = useState<string | null>(null)
  const [mpLoading, setMpLoading] = useState(false)

  // Step 1
  const [selectedPricing, setSelectedPricing] = useState<PricingOption | null>(null)
  const [selectedBoarding, setSelectedBoarding] = useState<BoardingPoint | null>(null)
  const [participantCount, setParticipantCount] = useState(1)

  // Step 2
  const [participants, setParticipants] = useState<ParticipantForm[]>([emptyParticipant()])

  // Step 3
  const [selectedOptionals, setSelectedOptionals] = useState<Record<string, boolean>>({})

  // ── Helpers ───────────────────────────────────────────────────────────────

  const basePrice = selectedPricing?.pix_price ?? selectedPricing?.card_price ?? 0
  const pixPrice = selectedPricing?.pix_price ?? basePrice
  const cardPrice = selectedPricing?.card_price ?? basePrice
  const pixDiscountPct = tour.pix_discount_percent ?? 0

  const optionalsTotal = optionalItems
    .filter(o => selectedOptionals[o.id])
    .reduce((sum, o) => sum + o.price, 0)

  const subtotalPix = pixPrice * participantCount + optionalsTotal
  const subtotalCard = cardPrice * participantCount + optionalsTotal

  const updateParticipant = (index: number, field: keyof ParticipantForm, value: string | boolean) => {
    setParticipants(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  const handleParticipantCountChange = (count: number) => {
    setParticipantCount(count)
    setParticipants(prev => {
      if (count > prev.length) {
        return [...prev, ...Array(count - prev.length).fill(null).map(emptyParticipant)]
      }
      return prev.slice(0, count)
    })
  }

  // ── Validation ────────────────────────────────────────────────────────────

  const validateStep1 = () => {
    if (!selectedPricing) { toast.error('Selecione uma opção de preço'); return false }
    return true
  }

  const validateStep2 = () => {
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i]
      if (!p.nome.trim()) { toast.error(`Nome do participante ${i + 1} é obrigatório`); return false }
      const cpf = sanitizeCPF(p.cpf)
      if (!cpf || !isValidCPF(cpf)) { toast.error(`CPF inválido para o participante ${i + 1}`); return false }
      if (!p.whatsapp.trim()) { toast.error(`WhatsApp do participante ${i + 1} é obrigatório`); return false }
    }
    return true
  }

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep(s => s + 1)
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!organization) return
    setSubmitting(true)
    try {
      // Generate reservation number
      const numero = `TR-${Date.now().toString(36).toUpperCase()}`

      // Upsert lead client (first participant) by CPF
      const lead = participants[0]
      const cpf = sanitizeCPF(lead.cpf)

      const { data: clienteData } = await supabase
        .from('clientes')
        .upsert({
          cpf,
          organization_id: organization.id,
          nome_completo: lead.nome.trim(),
          whatsapp: lead.whatsapp.replace(/\D/g, '') || null,
          email: lead.email.trim() || null,
          data_nascimento: lead.dataNascimento || null,
          problema_saude: lead.problemaSaude,
          descricao_problema_saude: lead.problemaSaude ? lead.descricaoSaude : null,
        }, {
          onConflict: 'cpf,organization_id',
          ignoreDuplicates: false,
        })
        .select('id')
        .single()

      const clienteId = clienteData?.id ?? null

      // Compute values
      const valorPasseio = pixPrice * participantCount
      const opcionaisSelecionados = optionalItems
        .filter(o => selectedOptionals[o.id])
        .map(o => ({ id: o.id, name: o.name, price: o.price }))

      // Create reserva
      const { data: reserva, error: reservaError } = await supabase
        .from('reservas')
        .insert({
          organization_id: organization.id,
          tour_id: tour.id,
          cliente_id: clienteId,
          reserva_numero: numero,
          status: 'pendente',
          payment_status: 'pendente',
          numero_participantes: participantCount,
          ponto_embarque_id: selectedBoarding?.id ?? null,
          valor_passeio: valorPasseio,
          valor_total_com_opcionais: valorPasseio + optionalsTotal,
          selected_optional_items: opcionaisSelecionados.length ? opcionaisSelecionados : null,
          problema_saude: participants.some(p => p.problemaSaude),
          descricao_problema_saude: participants
            .filter(p => p.problemaSaude && p.descricaoSaude)
            .map(p => `${p.nome}: ${p.descricaoSaude}`)
            .join('; ') || null,
        })
        .select('id')
        .single()

      if (reservaError) throw reservaError

      // Create participants
      await supabase.from('reservation_participants').insert(
        participants.map((p, i) => ({
          reserva_id: reserva.id,
          organization_id: organization.id,
          participant_index: i,
          nome_completo: p.nome.trim(),
          cpf: sanitizeCPF(p.cpf) || null,
          whatsapp: p.whatsapp.replace(/\D/g, '') || null,
          email: p.email.trim() || null,
          data_nascimento: p.dataNascimento || null,
          pricing_option_id: selectedPricing?.id ?? null,
          pricing_option_name: selectedPricing?.option_name ?? null,
          ponto_embarque_id: selectedBoarding?.id ?? null,
          problema_saude: p.problemaSaude,
          descricao_problema_saude: p.problemaSaude ? p.descricaoSaude : null,
        }))
      )

      setReservaNumero(numero)
      setReservaId(reserva.id)
      setStep(4)
    } catch (err) {
      toast.error('Erro ao realizar reserva. Tente novamente.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Reset on close ────────────────────────────────────────────────────────

  const handleClose = () => {
    setStep(1)
    setSelectedPricing(null)
    setSelectedBoarding(null)
    setParticipantCount(1)
    setParticipants([emptyParticipant()])
    setSelectedOptionals({})
    setReservaNumero(null)
    setReservaId(null)
    onClose()
  }

  const handleMpPayment = async () => {
    if (!reservaId) return
    setMpLoading(true)
    try {
      const res = await fetch('/api/criar-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservaId }),
      })
      const data = await res.json() as { init_point?: string; sandbox_init_point?: string; error?: string }
      if (!res.ok || data.error) {
        toast.error(data.error ?? 'Erro ao iniciar pagamento')
        return
      }
      const url = import.meta.env.DEV ? data.sandbox_init_point : data.init_point
      if (url) window.location.href = url
    } catch {
      toast.error('Erro ao conectar com Mercado Pago')
    } finally {
      setMpLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-base">
              {step < 4 ? 'Fazer reserva' : 'Reserva realizada!'}
            </DialogTitle>
            {/* Step indicator */}
            {step < 4 && (
              <div className="flex items-center gap-1">
                {[1, 2, 3].map(s => (
                  <div
                    key={s}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      step >= s ? 'bg-primary' : 'bg-border'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{tour.name}</p>
        </DialogHeader>

        <div className="space-y-5 pt-1">

          {/* ── STEP 1: Selecionar opção ─────────────────────────────── */}
          {step === 1 && (
            <>
              {pricingOptions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Opção de preço</p>
                  {pricingOptions.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedPricing(opt)}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors',
                        selectedPricing?.id === opt.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40'
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium">{opt.option_name}</p>
                        {opt.pix_price && opt.card_price && opt.pix_price !== opt.card_price && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            PIX: {formatCurrency(opt.pix_price)} · Cartão: {formatCurrency(opt.card_price)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">
                          {formatCurrency(opt.pix_price ?? opt.card_price ?? 0)}
                        </p>
                        {pixDiscountPct > 0 && opt.card_price && (opt.pix_price ?? 0) < opt.card_price && (
                          <Badge variant="success" className="text-xs">{pixDiscountPct}% PIX</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {boardingPoints.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Ponto de embarque</p>
                  {boardingPoints.map(bp => (
                    <button
                      key={bp.id}
                      type="button"
                      onClick={() => setSelectedBoarding(bp)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors',
                        selectedBoarding?.id === bp.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40'
                      )}
                    >
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{bp.name}</p>
                        {bp.address && <p className="text-xs text-muted-foreground">{bp.address}</p>}
                      </div>
                      {bp.departure_time && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">{bp.departure_time}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Número de participantes</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleParticipantCountChange(Math.max(1, participantCount - 1))}
                    className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-accent transition-colors text-lg font-medium"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-lg font-bold">{participantCount}</span>
                  <button
                    type="button"
                    onClick={() => handleParticipantCountChange(Math.min(20, participantCount + 1))}
                    className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-accent transition-colors text-lg font-medium"
                  >
                    +
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {participantCount === 1 ? 'pessoa' : 'pessoas'}
                  </span>
                </div>
              </div>

              {selectedPricing && (
                <div className="p-3 bg-accent/50 rounded-xl text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {selectedPricing.option_name} × {participantCount}
                    </span>
                    <span className="font-medium">
                      {formatCurrency((selectedPricing.pix_price ?? 0) * participantCount)}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── STEP 2: Dados dos participantes ─────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              {participants.map((p, i) => (
                <div key={i} className="space-y-3">
                  {participantCount > 1 && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                        {i + 1}
                      </div>
                      <p className="text-sm font-medium">
                        {i === 0 ? 'Responsável pela reserva' : `Participante ${i + 1}`}
                      </p>
                    </div>
                  )}
                  <Input
                    label={i === 0 ? 'Nome completo' : 'Nome completo'}
                    required
                    value={p.nome}
                    onChange={e => updateParticipant(i, 'nome', e.target.value)}
                    placeholder="Nome completo"
                    autoComplete="name"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="CPF"
                      required
                      value={p.cpf}
                      onChange={e => updateParticipant(i, 'cpf', formatCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                    <Input
                      label="Data de nascimento"
                      type="date"
                      value={p.dataNascimento}
                      onChange={e => updateParticipant(i, 'dataNascimento', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="WhatsApp"
                      required
                      value={p.whatsapp}
                      onChange={e => updateParticipant(i, 'whatsapp', e.target.value)}
                      placeholder="(11) 99999-9999"
                      type="tel"
                    />
                    <Input
                      label="E-mail"
                      value={p.email}
                      onChange={e => updateParticipant(i, 'email', e.target.value)}
                      placeholder="email@exemplo.com"
                      type="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-border"
                        checked={p.problemaSaude}
                        onChange={e => updateParticipant(i, 'problemaSaude', e.target.checked)}
                      />
                      <span className="text-sm">Possui problema de saúde relevante</span>
                    </label>
                    {p.problemaSaude && (
                      <Input
                        value={p.descricaoSaude}
                        onChange={e => updateParticipant(i, 'descricaoSaude', e.target.value)}
                        placeholder="Descreva brevemente o problema de saúde..."
                      />
                    )}
                  </div>
                  {i < participants.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}

          {/* ── STEP 3: Resumo e opcionais ───────────────────────────── */}
          {step === 3 && (
            <>
              {optionalItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Opcionais disponíveis</p>
                  {optionalItems.map(item => (
                    <label
                      key={item.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                        selectedOptionals[item.id]
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/40'
                      )}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-border flex-shrink-0"
                        checked={!!selectedOptionals[item.id]}
                        onChange={e => setSelectedOptionals(prev => ({
                          ...prev,
                          [item.id]: e.target.checked,
                        }))}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                      <span className="text-sm font-semibold flex-shrink-0">
                        {formatCurrency(item.price)}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div className="p-4 border rounded-xl space-y-2.5 bg-card">
                <p className="text-sm font-semibold">Resumo da reserva</p>

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      {selectedPricing?.option_name} × {participantCount}
                    </span>
                    <span>{formatCurrency(pixPrice * participantCount)}</span>
                  </div>
                  {optionalItems.filter(o => selectedOptionals[o.id]).map(o => (
                    <div key={o.id} className="flex justify-between text-muted-foreground">
                      <span>{o.name}</span>
                      <span>{formatCurrency(o.price)}</span>
                    </div>
                  ))}
                  {selectedBoarding && (
                    <div className="flex items-center gap-1.5 text-muted-foreground pt-1 text-xs">
                      <MapPin className="w-3.5 h-3.5" />
                      {selectedBoarding.name}
                      {selectedBoarding.departure_time && ` · ${selectedBoarding.departure_time}`}
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-1">
                  {(tour.payment_mode === 'pix' || tour.payment_mode === 'ambos') && (
                    <div className="flex justify-between font-semibold">
                      <span className="text-sm">Total PIX</span>
                      <span className="text-primary">{formatCurrency(subtotalPix)}</span>
                    </div>
                  )}
                  {(tour.payment_mode === 'cartao' || tour.payment_mode === 'ambos') && (
                    <div className="flex justify-between font-semibold">
                      <span className="text-sm">Total Cartão</span>
                      <span>{formatCurrency(subtotalCard)}</span>
                    </div>
                  )}
                  {(!tour.payment_mode || tour.payment_mode === 'ambos') && subtotalPix < subtotalCard && (
                    <p className="text-xs text-muted-foreground">
                      Economize {formatCurrency(subtotalCard - subtotalPix)} pagando via PIX
                    </p>
                  )}
                </div>

                {/* Participants summary */}
                <div className="pt-1 space-y-1">
                  {participants.map((p, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="w-3 h-3 flex-shrink-0" />
                      {p.nome || `Participante ${i + 1}`}
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Ao confirmar, você receberá as instruções de pagamento. A reserva só é confirmada após o pagamento.
              </p>
            </>
          )}

          {/* ── STEP 4: Sucesso ──────────────────────────────────────── */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">Reserva solicitada!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Número da reserva:
                </p>
                <p className="text-xl font-mono font-bold text-primary mt-0.5">{reservaNumero}</p>
              </div>
              {organization?.mp_collector_id ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Clique abaixo para pagar via Mercado Pago (PIX ou cartão de crédito).
                  </p>
                  <Button
                    className="w-full gap-2"
                    onClick={handleMpPayment}
                    disabled={mpLoading}
                  >
                    <CreditCard className="w-4 h-4" />
                    {mpLoading ? 'Aguarde...' : 'Pagar agora'}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Aguarde a confirmação do pagamento. Entraremos em contato pelo WhatsApp informado.
                  </p>
                  {organization?.whatsapp && (
                    <a
                      href={whatsappLink(
                        organization.whatsapp,
                        `Olá! Acabei de fazer a reserva ${reservaNumero} para o passeio "${tour.name}". Gostaria de confirmar o pagamento.`
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button className="w-full gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Confirmar pagamento no WhatsApp
                      </Button>
                    </a>
                  )}
                </>
              )}
              <Button variant="outline" className="w-full" onClick={handleClose}>
                Fechar
              </Button>
            </div>
          )}
        </div>

        {/* Navigation */}
        {step < 4 && (
          <div className="flex items-center justify-between pt-4 border-t mt-2">
            {step > 1 ? (
              <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)}>
                <ChevronLeft className="w-4 h-4" /> Anterior
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="w-4 h-4" /> Cancelar
              </Button>
            )}
            {step < 3 ? (
              <Button size="sm" onClick={handleNext}>
                Próximo <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Enviando...' : 'Confirmar reserva'}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
