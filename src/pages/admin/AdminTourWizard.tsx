import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Upload, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  SelectField,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// ── Types ───────────────────────────────────────────────────────────────────

interface PricingOption {
  id?: string
  option_name: string
  pix_price: string
  card_price: string
}

interface BoardingPoint {
  id?: string
  name: string
  address: string
  departure_time: string
}

interface OptionalItem {
  id?: string
  name: string
  description: string
  price: string
}

// ── Constants ───────────────────────────────────────────────────────────────

const DIFFICULTIES = [
  { value: 'facil', label: 'Fácil' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'dificil', label: 'Difícil' },
  { value: 'muito_dificil', label: 'Muito difícil' },
]

const TRAIL_TYPES = [
  { value: 'trilha', label: 'Trilha' },
  { value: 'cachoeira', label: 'Cachoeira' },
  { value: 'camping', label: 'Camping' },
  { value: 'escalada', label: 'Escalada' },
  { value: 'rapel', label: 'Rapel' },
  { value: 'mergulho', label: 'Mergulho' },
  { value: 'cicloturismo', label: 'Cicloturismo' },
  { value: 'caverna', label: 'Caverna' },
  { value: 'canyoning', label: 'Canyoning' },
  { value: 'outros', label: 'Outros' },
]

const PAYMENT_MODES = [
  { value: 'pix', label: 'Apenas PIX' },
  { value: 'cartao', label: 'Apenas Cartão' },
  { value: 'ambos', label: 'PIX e Cartão' },
]

const INSTALLMENTS = [
  { value: '1', label: 'À vista' },
  ...Array.from({ length: 11 }, (_, i) => ({
    value: String(i + 2),
    label: `Até ${i + 2}x`,
  })),
]

const BR_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const STEPS = [
  { label: 'Informações', description: 'Dados básicos' },
  { label: 'Datas e preços', description: 'Valores e vagas' },
  { label: 'Embarques', description: 'Pontos de saída' },
  { label: 'Opcionais', description: 'Itens extras' },
]

// ── Main component ───────────────────────────────────────────────────────────

export default function AdminTourWizard({ tourId }: { tourId?: string }) {
  const navigate = useNavigate()
  const { organization } = useOrganization()
  const isEditing = !!tourId

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEditing)
  const [imageUploading, setImageUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 1
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [trailTypes, setTrailTypes] = useState<string[]>([])
  const [distanceKm, setDistanceKm] = useState('')
  const [durationHours, setDurationHours] = useState('')
  const [about, setAbout] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  // Step 2
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [vagas, setVagas] = useState('')
  const [valorPadrao, setValorPadrao] = useState('')
  const [pixDiscount, setPixDiscount] = useState('')
  const [installmentsMax, setInstallmentsMax] = useState('12')
  const [paymentMode, setPaymentMode] = useState('ambos')
  const [pricingOptions, setPricingOptions] = useState<PricingOption[]>([
    { option_name: 'Duplo', pix_price: '', card_price: '' },
  ])

  // Step 3
  const [boardingPoints, setBoardingPoints] = useState<BoardingPoint[]>([
    { name: '', address: '', departure_time: '' },
  ])

  // Step 4
  const [optionals, setOptionals] = useState<OptionalItem[]>([])

  // ── Load existing tour ───────────────────────────────────────────────────

  useEffect(() => {
    if (!tourId || !organization) return
    loadTourData()
  }, [tourId, organization?.id])

  const loadTourData = async () => {
    if (!tourId) return
    setLoading(true)
    try {
      const [
        { data: tour },
        { data: pricing },
        { data: boarding },
        { data: opts },
      ] = await Promise.all([
        supabase.from('tours').select('*').eq('id', tourId).single(),
        supabase.from('tour_pricing_options').select('*').eq('tour_id', tourId).order('display_order'),
        supabase.from('tour_boarding_points').select('*').eq('tour_id', tourId).order('display_order'),
        supabase.from('tour_optional_items').select('*').eq('tour_id', tourId),
      ])

      if (!tour) { toast.error('Passeio não encontrado'); navigate('/admin/passeios'); return }

      setName(tour.name ?? '')
      setCity(tour.city ?? '')
      setState(tour.state ?? '')
      setDifficulty(tour.difficulty ?? '')
      setTrailTypes(tour.trail_type ?? [])
      setDistanceKm(tour.distance_km?.toString() ?? '')
      setDurationHours(tour.duration_hours?.toString() ?? '')
      setAbout(tour.about ?? '')
      setImageUrl(tour.image_url ?? '')
      setStartDate(tour.start_date ?? '')
      setEndDate(tour.end_date ?? '')
      setVagas(tour.vagas?.toString() ?? '')
      setValorPadrao(tour.valor_padrao?.toString() ?? '')
      setPixDiscount(tour.pix_discount_percent?.toString() ?? '')
      setInstallmentsMax(tour.mp_installments_max?.toString() ?? '12')
      setPaymentMode(tour.payment_mode ?? 'ambos')

      if (pricing?.length) {
        setPricingOptions(pricing.map(p => ({
          id: p.id,
          option_name: p.option_name,
          pix_price: p.pix_price?.toString() ?? '',
          card_price: p.card_price?.toString() ?? '',
        })))
      }
      if (boarding?.length) {
        setBoardingPoints(boarding.map(b => ({
          id: b.id,
          name: b.name,
          address: b.address ?? '',
          departure_time: b.departure_time ?? '',
        })))
      }
      if (opts?.length) {
        setOptionals(opts.map(o => ({
          id: o.id,
          name: o.name,
          description: o.description ?? '',
          price: o.price.toString(),
        })))
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Image upload ─────────────────────────────────────────────────────────

  const handleImageUpload = async (file: File) => {
    if (!organization) return
    setImageUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `tours/${organization.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('organization-assets')
        .upload(path, file, { upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(path)
      setImageUrl(publicUrl)
    } catch {
      toast.error('Erro ao fazer upload da imagem')
    } finally {
      setImageUploading(false)
    }
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  const validateStep = () => {
    if (step === 1 && !name.trim()) {
      toast.error('O nome do passeio é obrigatório')
      return false
    }
    if (step === 2 && !startDate) {
      toast.error('A data de saída é obrigatória')
      return false
    }
    return true
  }

  const handleNext = () => {
    if (validateStep()) setStep(s => s + 1)
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!organization) return
    setSaving(true)
    try {
      const tourData = {
        name: name.trim(),
        city: city || null,
        state: state || null,
        difficulty: difficulty || null,
        trail_type: trailTypes.length ? trailTypes : null,
        distance_km: distanceKm ? parseFloat(distanceKm) : null,
        duration_hours: durationHours ? parseFloat(durationHours) : null,
        about: about || null,
        image_url: imageUrl || null,
        start_date: startDate || null,
        end_date: endDate || null,
        vagas: vagas ? parseInt(vagas) : null,
        valor_padrao: valorPadrao ? parseFloat(valorPadrao) : null,
        pix_discount_percent: pixDiscount ? parseFloat(pixDiscount) : null,
        mp_installments_max: parseInt(installmentsMax),
        payment_mode: paymentMode,
        organization_id: organization.id,
      }

      let savedId = tourId
      if (isEditing) {
        const { error } = await supabase.from('tours').update(tourData).eq('id', tourId!)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('tours').insert({ ...tourData, is_active: true }).select('id').single()
        if (error) throw error
        savedId = data.id
      }

      // Replace related records
      await supabase.from('tour_pricing_options').delete().eq('tour_id', savedId!)
      const validPricing = pricingOptions.filter(p => p.option_name.trim())
      if (validPricing.length) {
        await supabase.from('tour_pricing_options').insert(
          validPricing.map((p, i) => ({
            tour_id: savedId!,
            organization_id: organization.id,
            option_name: p.option_name.trim(),
            pix_price: p.pix_price ? parseFloat(p.pix_price) : null,
            card_price: p.card_price ? parseFloat(p.card_price) : null,
            display_order: i,
          }))
        )
      }

      await supabase.from('tour_boarding_points').delete().eq('tour_id', savedId!)
      const validBoarding = boardingPoints.filter(b => b.name.trim())
      if (validBoarding.length) {
        await supabase.from('tour_boarding_points').insert(
          validBoarding.map((b, i) => ({
            tour_id: savedId!,
            organization_id: organization.id,
            name: b.name.trim(),
            address: b.address || null,
            departure_time: b.departure_time || null,
            display_order: i,
          }))
        )
      }

      await supabase.from('tour_optional_items').delete().eq('tour_id', savedId!)
      const validOpts = optionals.filter(o => o.name.trim() && o.price)
      if (validOpts.length) {
        await supabase.from('tour_optional_items').insert(
          validOpts.map(o => ({
            tour_id: savedId!,
            organization_id: organization.id,
            name: o.name.trim(),
            description: o.description || null,
            price: parseFloat(o.price),
          }))
        )
      }

      toast.success(isEditing ? 'Passeio atualizado!' : 'Passeio criado!')
      navigate('/admin/passeios')
    } catch (err) {
      toast.error('Erro ao salvar passeio')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          {isEditing ? 'Editar passeio' : 'Novo passeio'}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isEditing
            ? 'Atualize as informações do passeio'
            : 'Preencha os dados em 4 etapas simples'}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => i + 1 < step && setStep(i + 1)}
              className="flex items-center gap-2 group"
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 flex-shrink-0 transition-colors',
                step > i + 1
                  ? 'bg-primary border-primary text-primary-foreground'
                  : step === i + 1
                  ? 'border-primary text-primary'
                  : 'border-border text-muted-foreground'
              )}>
                {step > i + 1 ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <div className="hidden sm:block">
                <p className={cn(
                  'text-xs font-medium leading-none',
                  step === i + 1 ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {s.label}
                </p>
              </div>
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-px mx-3',
                step > i + 1 ? 'bg-primary' : 'bg-border'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="space-y-5">

        {/* ── STEP 1: Informações básicas ────────────────────────────── */}
        {step === 1 && (
          <>
            <Input
              label="Nome do passeio"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Chapada Diamantina – Morro do Pai Inácio"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Cidade"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Ex: Lençóis"
              />
              <SelectField label="Estado">
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {BR_STATES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SelectField>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <SelectField label="Dificuldade">
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SelectField>
              <Input
                label="Distância (km)"
                type="number"
                min="0"
                step="0.1"
                value={distanceKm}
                onChange={e => setDistanceKm(e.target.value)}
                placeholder="Ex: 12"
              />
              <Input
                label="Duração (h)"
                type="number"
                min="0"
                step="0.5"
                value={durationHours}
                onChange={e => setDurationHours(e.target.value)}
                placeholder="Ex: 8"
              />
            </div>

            <div>
              <Label className="mb-2 block">Tipo de atividade</Label>
              <div className="flex flex-wrap gap-2">
                {TRAIL_TYPES.map(t => (
                  <label
                    key={t.value}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors select-none',
                      trailTypes.includes(t.value)
                        ? 'bg-primary/10 border-primary text-primary font-medium'
                        : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={trailTypes.includes(t.value)}
                      onChange={e => setTrailTypes(prev =>
                        e.target.checked ? [...prev, t.value] : prev.filter(x => x !== t.value)
                      )}
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>

            <Textarea
              label="Descrição"
              value={about}
              onChange={e => setAbout(e.target.value)}
              placeholder="Descreva o passeio, o que os participantes vão vivenciar..."
              rows={4}
            />

            {/* Image */}
            <div className="space-y-2">
              <Label>Imagem de capa</Label>
              {imageUrl ? (
                <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
                  <img src={imageUrl} alt="Capa do passeio" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-background transition-colors"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                  className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-accent/30 transition-colors"
                >
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {imageUploading ? 'Enviando...' : 'Clique para fazer upload'}
                  </span>
                  <span className="text-xs text-muted-foreground">PNG, JPG até 5MB</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }}
              />
              <Input
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="Ou cole uma URL de imagem..."
              />
            </div>
          </>
        )}

        {/* ── STEP 2: Datas e preços ─────────────────────────────────── */}
        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Data de saída"
                required
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <Input
                label="Data de retorno"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Total de vagas"
                type="number"
                min="1"
                value={vagas}
                onChange={e => setVagas(e.target.value)}
                placeholder="Ex: 30"
              />
              <Input
                label="Preço a partir de (R$)"
                type="number"
                min="0"
                step="0.01"
                value={valorPadrao}
                onChange={e => setValorPadrao(e.target.value)}
                placeholder="Ex: 450.00"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <SelectField label="Forma de pagamento">
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SelectField>
              <Input
                label="Desconto PIX (%)"
                type="number"
                min="0"
                max="100"
                value={pixDiscount}
                onChange={e => setPixDiscount(e.target.value)}
                placeholder="Ex: 5"
              />
              <SelectField label="Parcelamento máx.">
                <Select value={installmentsMax} onValueChange={setInstallmentsMax}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTALLMENTS.map(inst => (
                      <SelectItem key={inst.value} value={inst.value}>{inst.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SelectField>
            </div>

            {/* Pricing options */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label>Opções de preço</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Variações como Duplo, Triplo, Individual, Camping, etc.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPricingOptions(p => [...p, { option_name: '', pix_price: '', card_price: '' }])}
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </Button>
              </div>

              {/* Header row */}
              <div className="grid grid-cols-[1fr_120px_120px_36px] gap-3 mb-1.5 px-0.5">
                <p className="text-xs text-muted-foreground font-medium">Nome da opção</p>
                <p className="text-xs text-muted-foreground font-medium">Preço PIX</p>
                <p className="text-xs text-muted-foreground font-medium">Preço Cartão</p>
                <span />
              </div>

              <div className="space-y-2">
                {pricingOptions.map((opt, i) => (
                  <div key={i} className="grid grid-cols-[1fr_120px_120px_36px] gap-3 items-start">
                    <Input
                      value={opt.option_name}
                      onChange={e => setPricingOptions(prev =>
                        prev.map((p, j) => j === i ? { ...p, option_name: e.target.value } : p)
                      )}
                      placeholder="Ex: Duplo"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={opt.pix_price}
                      onChange={e => setPricingOptions(prev =>
                        prev.map((p, j) => j === i ? { ...p, pix_price: e.target.value } : p)
                      )}
                      placeholder="0.00"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={opt.card_price}
                      onChange={e => setPricingOptions(prev =>
                        prev.map((p, j) => j === i ? { ...p, card_price: e.target.value } : p)
                      )}
                      placeholder="0.00"
                    />
                    <div className="pt-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={pricingOptions.length === 1}
                        onClick={() => setPricingOptions(prev => prev.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── STEP 3: Pontos de embarque ─────────────────────────────── */}
        {step === 3 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label>Pontos de embarque</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Locais e horários de saída dos participantes
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBoardingPoints(p => [...p, { name: '', address: '', departure_time: '' }])}
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar ponto
              </Button>
            </div>

            <div className="space-y-3">
              {boardingPoints.map((pt, i) => (
                <div key={i} className="p-4 border rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Ponto {i + 1}</span>
                    {boardingPoints.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setBoardingPoints(prev => prev.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remover
                      </Button>
                    )}
                  </div>
                  <Input
                    label="Nome do local"
                    value={pt.name}
                    onChange={e => setBoardingPoints(prev =>
                      prev.map((p, j) => j === i ? { ...p, name: e.target.value } : p)
                    )}
                    placeholder="Ex: Terminal Tietê, Praça da Sé..."
                  />
                  <Input
                    label="Endereço"
                    value={pt.address}
                    onChange={e => setBoardingPoints(prev =>
                      prev.map((p, j) => j === i ? { ...p, address: e.target.value } : p)
                    )}
                    placeholder="Endereço completo (opcional)"
                  />
                  <Input
                    label="Horário de saída"
                    type="time"
                    value={pt.departure_time}
                    onChange={e => setBoardingPoints(prev =>
                      prev.map((p, j) => j === i ? { ...p, departure_time: e.target.value } : p)
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 4: Opcionais ─────────────────────────────────────── */}
        {step === 4 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label>Itens opcionais</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Serviços extras que o participante pode contratar
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOptionals(p => [...p, { name: '', description: '', price: '' }])}
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar item
              </Button>
            </div>

            {optionals.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl">
                <p className="text-sm text-muted-foreground">Nenhum item opcional adicionado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Exemplos: rapel, foto aérea com drone, foto subaquática
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {optionals.map((opt, i) => (
                  <div key={i} className="p-4 border rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Item {i + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setOptionals(prev => prev.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remover
                      </Button>
                    </div>
                    <div className="grid grid-cols-[1fr_140px] gap-3">
                      <Input
                        label="Nome"
                        value={opt.name}
                        onChange={e => setOptionals(prev =>
                          prev.map((p, j) => j === i ? { ...p, name: e.target.value } : p)
                        )}
                        placeholder="Ex: Rapel, Foto aérea..."
                      />
                      <Input
                        label="Preço (R$)"
                        type="number"
                        min="0"
                        step="0.01"
                        value={opt.price}
                        onChange={e => setOptionals(prev =>
                          prev.map((p, j) => j === i ? { ...p, price: e.target.value } : p)
                        )}
                        placeholder="0.00"
                      />
                    </div>
                    <Input
                      label="Descrição"
                      value={opt.description}
                      onChange={e => setOptionals(prev =>
                        prev.map((p, j) => j === i ? { ...p, description: e.target.value } : p)
                      )}
                      placeholder="Breve descrição do item (opcional)"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/passeios')}
        >
          Cancelar
        </Button>
        <div className="flex gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
          )}
          {step < 4 ? (
            <Button onClick={handleNext}>
              Próximo <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar passeio'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
