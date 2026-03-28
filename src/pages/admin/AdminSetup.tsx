import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  MapPin, Phone, Instagram, Palette, Upload,
  CheckCircle2, ArrowRight, ArrowLeft, ExternalLink,
  CreditCard, SkipForward,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectField } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatPhone, sanitizePhone } from '@/lib/format'

// ── Brazilian states ───────────────────────────────────────────────────────

const ESTADOS = [
  { uf: 'AC', nome: 'Acre' }, { uf: 'AL', nome: 'Alagoas' },
  { uf: 'AP', nome: 'Amapá' }, { uf: 'AM', nome: 'Amazonas' },
  { uf: 'BA', nome: 'Bahia' }, { uf: 'CE', nome: 'Ceará' },
  { uf: 'DF', nome: 'Distrito Federal' }, { uf: 'ES', nome: 'Espírito Santo' },
  { uf: 'GO', nome: 'Goiás' }, { uf: 'MA', nome: 'Maranhão' },
  { uf: 'MT', nome: 'Mato Grosso' }, { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'MG', nome: 'Minas Gerais' }, { uf: 'PA', nome: 'Pará' },
  { uf: 'PB', nome: 'Paraíba' }, { uf: 'PR', nome: 'Paraná' },
  { uf: 'PE', nome: 'Pernambuco' }, { uf: 'PI', nome: 'Piauí' },
  { uf: 'RJ', nome: 'Rio de Janeiro' }, { uf: 'RN', nome: 'Rio Grande do Norte' },
  { uf: 'RS', nome: 'Rio Grande do Sul' }, { uf: 'RO', nome: 'Rondônia' },
  { uf: 'RR', nome: 'Roraima' }, { uf: 'SC', nome: 'Santa Catarina' },
  { uf: 'SP', nome: 'São Paulo' }, { uf: 'SE', nome: 'Sergipe' },
  { uf: 'TO', nome: 'Tocantins' },
]

// ── Progress bar ───────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">Etapa {current} de {total}</span>
        <span className="text-xs font-medium text-primary">{Math.round((current / total) * 100)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  )
}

// ── Branding preview ───────────────────────────────────────────────────────

interface BrandingPreviewProps {
  name: string
  primaryColor: string
  secondaryColor: string
  logoPreview: string | null
}

function BrandingPreview({ name, primaryColor, secondaryColor, logoPreview }: BrandingPreviewProps) {
  return (
    <div className="rounded-xl border overflow-hidden shadow-sm">
      {/* Cover simulation */}
      <div className="h-20 w-full" style={{ backgroundColor: primaryColor + '33' }} />
      <div className="p-4 bg-card">
        <div className="flex items-center gap-3 -mt-8 mb-3">
          <div
            className="w-14 h-14 rounded-xl border-2 border-background flex items-center justify-center shadow-md overflow-hidden text-white font-bold text-lg"
            style={{ backgroundColor: primaryColor }}
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              name.charAt(0).toUpperCase()
            )}
          </div>
        </div>
        <p className="font-semibold text-sm text-foreground">{name || 'Sua agência'}</p>
        <p className="text-xs text-muted-foreground mt-0.5">trilheiros.app</p>
        <div className="mt-3 flex gap-2">
          <div
            className="h-7 px-3 rounded-lg text-xs font-medium flex items-center text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Ver passeios
          </div>
          <div
            className="h-7 px-3 rounded-lg text-xs font-medium flex items-center border"
            style={{ color: secondaryColor, borderColor: secondaryColor + '66' }}
          >
            WhatsApp
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AdminSetup() {
  const { organization: ctxOrg, setOrganization } = useOrganization()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load org from DB when context is null (e.g. on localhost main portal)
  const [orgLoading, setOrgLoading] = useState(!ctxOrg)
  const organization = ctxOrg

  useEffect(() => {
    if (ctxOrg) { setOrgLoading(false); return }
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { navigate('/admin/entrar', { replace: true }); return }
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', data.user.id)
        .maybeSingle()
      if (member) {
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', member.organization_id)
          .maybeSingle()
        if (org) setOrganization(org as unknown as import('@/types/organization').Organization)
      }
      setOrgLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  // Step 1: Branding
  const [primaryColor, setPrimaryColor] = useState('#2D6A4F')
  const [secondaryColor, setSecondaryColor] = useState('#F5A623')

  // Step 2: Contact
  const [whatsapp, setWhatsapp] = useState('')
  const [instagram, setInstagram] = useState('')
  const [bio, setBio] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')

  // Sync form state when org loads
  useEffect(() => {
    if (!organization) return
    setLogoPreview(organization.logo_url ?? null)
    setPrimaryColor(organization.primary_color || '#2D6A4F')
    setSecondaryColor(organization.secondary_color || '#F5A623')
    setWhatsapp(organization.whatsapp || '')
    setInstagram(organization.instagram || '')
    setBio(organization.bio || '')
    setCity(organization.city || '')
    setState(organization.state || '')
  }, [organization?.id])

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (orgLoading || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── Logo upload ──────────────────────────────────────────────────────────

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 2MB.')
      return
    }
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return organization.logo_url

    const ext = logoFile.name.split('.').pop()
    const path = `${organization.id}/logo.${ext}`

    const { error } = await supabase.storage
      .from('organization-assets')
      .upload(path, logoFile, { upsert: true })

    if (error) {
      console.error('Logo upload error:', error)
      toast.warning('Não foi possível fazer upload do logo. Você pode adicioná-lo depois em Configurações.')
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('organization-assets')
      .getPublicUrl(path)

    return publicUrl
  }

  // ── Step save handlers ────────────────────────────────────────────────────

  const saveStep1 = async () => {
    setSaving(true)
    try {
      const logo_url = await uploadLogo()
      const { error } = await supabase
        .from('organizations')
        .update({ primary_color: primaryColor, secondary_color: secondaryColor, ...(logo_url ? { logo_url } : {}) })
        .eq('id', organization.id)

      if (error) throw error

      // Apply colors immediately
      document.documentElement.style.setProperty('--brand-primary', primaryColor)
      document.documentElement.style.setProperty('--brand-secondary', secondaryColor)

      setStep(2)
    } catch {
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const saveStep2 = async () => {
    const newErrors: Record<string, string> = {}
    const cleanPhone = sanitizePhone(whatsapp)
    if (!cleanPhone || cleanPhone.length < 10) {
      newErrors.whatsapp = 'WhatsApp inválido. Use o formato (11) 99999-9999'
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    setSaving(true)
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          whatsapp: cleanPhone,
          instagram: instagram.replace('@', '') || null,
          bio: bio || null,
          city: city || null,
          state: state || null,
        })
        .eq('id', organization.id)

      if (error) throw error
      setStep(3)
    } catch {
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const goToStep4 = () => setStep(4)

  const goToDashboard = () => navigate('/admin')

  // ── Render steps ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-4"
            style={{ backgroundColor: primaryColor }}
          >
            {organization.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold text-foreground">Configurar sua agência</h1>
          <p className="text-muted-foreground mt-1 text-sm">Leva menos de 2 minutos</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <ProgressBar current={step} total={4} />
        </div>

        {/* ── Step 1: Branding ────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  Logo e identidade visual
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Personalize como sua agência aparece para os clientes.
                </p>
              </div>

              {/* Logo upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Logo da agência</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'w-full h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors',
                    'border-border hover:border-primary/50 hover:bg-primary/5',
                  )}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="max-h-20 max-w-full object-contain" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">PNG, JPG ou SVG · Máx. 2MB</span>
                    </>
                  )}
                </button>
                {logoPreview && (
                  <button
                    type="button"
                    className="text-xs text-destructive hover:underline"
                    onClick={() => { setLogoPreview(null); setLogoFile(null) }}
                  >
                    Remover logo
                  </button>
                )}
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Cor principal</label>
                  <div className="flex items-center gap-2 border border-input rounded-lg p-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-sm font-mono text-muted-foreground">{primaryColor}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Cor secundária</label>
                  <div className="flex items-center gap-2 border border-input rounded-lg p-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={e => setSecondaryColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-sm font-mono text-muted-foreground">{secondaryColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live preview */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Pré-visualização</p>
              <BrandingPreview
                name={organization.name}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                logoPreview={logoPreview}
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Contact ──────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6 max-w-lg">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Informações de contato
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Como os clientes vão entrar em contato com você.
              </p>
            </div>

            <Input
              label="WhatsApp"
              placeholder="(11) 99999-9999"
              required
              value={whatsapp}
              onChange={e => {
                const raw = sanitizePhone(e.target.value)
                setWhatsapp(formatPhone(raw))
                setErrors(prev => ({ ...prev, whatsapp: '' }))
              }}
              error={errors.whatsapp}
              prefix={<Phone className="w-4 h-4" />}
              hint="Número principal para receber reservas"
            />

            <Input
              label="Instagram"
              placeholder="@suaagencia"
              value={instagram}
              onChange={e => setInstagram(e.target.value)}
              prefix={<Instagram className="w-4 h-4" />}
            />

            <Textarea
              label="Descrição da agência"
              placeholder="Conte um pouco sobre sua agência, o que vocês fazem e o que torna vocês únicos..."
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              hint="Aparece na página pública da sua agência"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Cidade"
                placeholder="Ex: Lençóis"
                value={city}
                onChange={e => setCity(e.target.value)}
                prefix={<MapPin className="w-4 h-4" />}
              />
              <SelectField label="Estado">
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map(e => (
                      <SelectItem key={e.uf} value={e.uf}>{e.uf} — {e.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SelectField>
            </div>
          </div>
        )}

        {/* ── Step 3: Mercado Pago ─────────────────────────────────────────── */}
        {step === 3 && (
          <div className="max-w-lg space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Pagamentos online
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Receba reservas e pagamentos diretamente na sua conta Mercado Pago.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#009ee3]/10 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-[#009ee3]" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Mercado Pago Marketplace</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Aceite PIX e cartão de crédito em até 12x. O valor cai direto na sua conta, descontando a comissão da plataforma automaticamente.
                  </p>
                </div>
              </div>

              <ul className="space-y-2">
                {[
                  'PIX com desconto configurável',
                  'Cartão de crédito em até 12x',
                  'Repasse automático para sua conta',
                  'Relatório de pagamentos no painel',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button className="w-full" disabled>
                <CreditCard className="w-4 h-4" />
                Conectar Mercado Pago
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Integração disponível em breve. Você pode configurar depois em{' '}
                <span className="text-primary">Configurações → Pagamentos</span>.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 4: Done ─────────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="max-w-lg text-center space-y-6">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Tudo pronto!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Sua agência está configurada. Agora é só criar seus primeiros passeios.
                </p>
              </div>
            </div>

            {/* Checklist */}
            <div className="rounded-xl border bg-card p-4 text-left space-y-3">
              {[
                { label: 'Identidade visual', done: true },
                { label: 'Informações de contato', done: !!whatsapp },
                { label: 'Pagamentos online', done: !!organization.mp_collector_id },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                    item.done ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  )}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span className={cn(
                    'text-sm',
                    item.done ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {item.label}
                  </span>
                  {!item.done && (
                    <span className="ml-auto text-xs text-muted-foreground">Opcional</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={() => window.open(`https://${organization.slug}.trilheiros.app`, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
                Ver meu site
              </Button>
              <Button onClick={goToDashboard}>
                Ir para o painel
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Navigation buttons ────────────────────────────────────────────── */}
        {step < 4 && (
          <div className="mt-8 flex items-center justify-between">
            <div>
              {step > 1 && (
                <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={saving}>
                  <ArrowLeft className="w-4 h-4" />
                  Anterior
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {step === 3 && (
                <Button variant="ghost" onClick={goToStep4}>
                  <SkipForward className="w-4 h-4" />
                  Pular por agora
                </Button>
              )}
              <Button
                onClick={step === 1 ? saveStep1 : step === 2 ? saveStep2 : goToStep4}
                loading={saving}
              >
                {step === 3 ? 'Concluir' : 'Próximo'}
                {!saving && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Você pode alterar tudo isso depois em{' '}
          <button onClick={goToDashboard} className="text-primary hover:underline">
            Configurações
          </button>
        </p>

      </div>
    </div>
  )
}
