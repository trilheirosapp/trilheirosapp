import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Palette, Phone, Globe, CreditCard, Shield,
  Upload, Save, Zap, Lock, Check, Clock, Crown,
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectField,
} from '@/components/ui/select'
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

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({
  title, description, icon: Icon, children,
}: {
  title: string
  description?: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="lg:col-span-2 space-y-4">{children}</div>
    </div>
  )
}

// ── Locked feature overlay ─────────────────────────────────────────────────

function LockedFeature({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="pointer-events-none opacity-40">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-sm">
        <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-1.5 shadow-sm">
          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Disponível no plano Pro</span>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AdminConfiguracoes() {
  const { organization, refetch } = useOrganization()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Branding
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#2D6A4F')
  const [secondaryColor, setSecondaryColor] = useState('#F5A623')

  // Contact
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [instagram, setInstagram] = useState('')
  const [website, setWebsite] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')

  // Booking fields config
  const [collectHealth, setCollectHealth] = useState(false)
  const [collectEmergency, setCollectEmergency] = useState(false)

  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isPro = organization?.plan === 'pro'

  // Populate form from organization
  useEffect(() => {
    if (!organization) return
    setLogoPreview(organization.logo_url ?? null)
    setCoverPreview(organization.cover_image_url ?? null)
    setPrimaryColor(organization.primary_color || '#2D6A4F')
    setSecondaryColor(organization.secondary_color || '#F5A623')
    setName(organization.name || '')
    setBio(organization.bio || '')
    setWhatsapp(organization.whatsapp ? formatPhone(organization.whatsapp) : '')
    setEmail(organization.email || '')
    setInstagram(organization.instagram || '')
    setWebsite(organization.website || '')
    setCity(organization.city || '')
    setState(organization.state || '')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setCollectHealth((organization as any).collect_health_data ?? false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setCollectEmergency((organization as any).collect_emergency_contact ?? false)
  }, [organization?.id])

  if (!organization) return null

  // ── File handlers ──────────────────────────────────────────────────────

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: (v: string | null) => void,
    setFile: (v: File | null) => void,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Arquivo muito grande. Máximo 5MB.'); return }
    setFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const { error } = await supabase.storage
      .from('organization-assets')
      .upload(path, file, { upsert: true })
    if (error) { console.error(error); return null }
    const { data: { publicUrl } } = supabase.storage
      .from('organization-assets')
      .getPublicUrl(path)
    return publicUrl
  }

  // ── Validate ───────────────────────────────────────────────────────────

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Nome da agência é obrigatório'
    const phone = sanitizePhone(whatsapp)
    if (whatsapp && phone.length < 10) newErrors.whatsapp = 'WhatsApp inválido'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Save ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const ext = (f: File) => f.name.split('.').pop()

      const [logo_url, cover_image_url] = await Promise.all([
        logoFile ? uploadFile(logoFile, `${organization.id}/logo.${ext(logoFile)}`) : Promise.resolve(organization.logo_url),
        coverFile ? uploadFile(coverFile, `${organization.id}/cover.${ext(coverFile)}`) : Promise.resolve(organization.cover_image_url),
      ])

      const { error } = await supabase
        .from('organizations')
        .update({
          name: name.trim(),
          bio: bio.trim() || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          ...(logo_url !== undefined && { logo_url }),
          ...(cover_image_url !== undefined && { cover_image_url }),
          whatsapp: whatsapp ? sanitizePhone(whatsapp) : null,
          email: email.trim() || null,
          instagram: instagram.replace('@', '').trim() || null,
          website: website.trim() || null,
          city: city.trim() || null,
          state: state || null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          collect_health_data: collectHealth as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          collect_emergency_contact: collectEmergency as any,
        })
        .eq('id', organization.id)

      if (error) throw error

      // Apply new colors immediately
      document.documentElement.style.setProperty('--brand-primary', primaryColor)
      document.documentElement.style.setProperty('--brand-secondary', secondaryColor)

      setLogoFile(null)
      setCoverFile(null)
      refetch()
      toast.success('Configurações salvas com sucesso')
    } catch {
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-10">

      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie o perfil e as preferências da sua agência
          </p>
        </div>
        <Button onClick={handleSave} loading={saving}>
          <Save className="w-4 h-4" />
          Salvar alterações
        </Button>
      </div>

      {/* ── Branding ──────────────────────────────────────────────────── */}
      <Section
        icon={Palette}
        title="Identidade visual"
        description="Logo, capa e cores que aparecem no seu site e nos tickets."
      >
        {/* Logo */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Logo</p>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl border flex items-center justify-center overflow-hidden text-white font-bold text-xl flex-shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {logoPreview
                ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                : organization.name.charAt(0).toUpperCase()
              }
            </div>
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => handleFileSelect(e, setLogoPreview, setLogoFile)} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-3.5 h-3.5" /> Alterar logo
              </Button>
              {logoPreview && logoPreview !== organization.logo_url && (
                <Button variant="ghost" size="sm"
                  onClick={() => { setLogoPreview(organization.logo_url ?? null); setLogoFile(null) }}>
                  Desfazer
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Cover image */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Imagem de capa</p>
          <div
            className="w-full h-28 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary/50 transition-colors"
            onClick={() => coverInputRef.current?.click()}
          >
            {coverPreview
              ? <img src={coverPreview} alt="Capa" className="w-full h-full object-cover" />
              : <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">Clique para enviar imagem de capa</span>
                </div>
            }
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => handleFileSelect(e, setCoverPreview, setCoverFile)} />
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Cor principal</p>
            <div className="flex items-center gap-2 border border-input rounded-lg p-2">
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
              <span className="text-sm font-mono text-muted-foreground">{primaryColor}</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Cor secundária</p>
            <div className="flex items-center gap-2 border border-input rounded-lg p-2">
              <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
              <span className="text-sm font-mono text-muted-foreground">{secondaryColor}</span>
            </div>
          </div>
        </div>
      </Section>

      <Separator />

      {/* ── Contact ───────────────────────────────────────────────────── */}
      <Section
        icon={Phone}
        title="Informações gerais"
        description="Nome, bio e formas de contato exibidas no site da agência."
      >
        <Input label="Nome da agência" required value={name}
          onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
          error={errors.name} />

        <Textarea label="Descrição / Bio" rows={3} value={bio} onChange={e => setBio(e.target.value)}
          hint="Aparece na página pública da sua agência" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="WhatsApp" placeholder="(11) 99999-9999"
            value={whatsapp} error={errors.whatsapp}
            onChange={e => {
              const raw = sanitizePhone(e.target.value)
              setWhatsapp(formatPhone(raw))
              setErrors(p => ({ ...p, whatsapp: '' }))
            }} />
          <Input label="E-mail de contato" type="email" placeholder="contato@suaagencia.com.br"
            value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Instagram" placeholder="@suaagencia"
            value={instagram} onChange={e => setInstagram(e.target.value)} />
          <Input label="Website" placeholder="https://"
            value={website} onChange={e => setWebsite(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Cidade" placeholder="Ex: Lençóis"
            value={city} onChange={e => setCity(e.target.value)} />
          <SelectField label="Estado">
            <Select value={state} onValueChange={setState}>
              <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
              <SelectContent>
                {ESTADOS.map(e => (
                  <SelectItem key={e.uf} value={e.uf}>{e.uf} — {e.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SelectField>
        </div>
      </Section>

      <Separator />

      {/* ── Booking fields ─────────────────────────────────────────────── */}
      <Section
        icon={Shield}
        title="Formulário de reserva"
        description="Escolha quais dados adicionais serão coletados dos participantes."
      >
        <div className="space-y-3 rounded-xl border p-4">
          <Switch
            label="Dados de saúde"
            description="Pergunta se o participante tem problema de saúde e qual"
            checked={collectHealth}
            onCheckedChange={setCollectHealth}
          />
          <Separator />
          <Switch
            label="Contato de emergência"
            description="Coleta nome e telefone de contato de emergência"
            checked={collectEmergency}
            onCheckedChange={setCollectEmergency}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Recomendado para passeios de aventura com maior nível de risco.
        </p>
      </Section>

      <Separator />

      {/* ── Mercado Pago ───────────────────────────────────────────────── */}
      <Section
        icon={CreditCard}
        title="Pagamentos"
        description="Conecte sua conta Mercado Pago para receber pagamentos online."
      >
        <div className={cn(
          'rounded-xl border p-4 space-y-3',
          organization.mp_collector_id ? 'border-primary/30 bg-primary/5' : ''
        )}>
          {organization.mp_collector_id ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-foreground">Mercado Pago conectado</span>
                <Badge variant="success" className="ml-auto">Ativo</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                ID do vendedor: {organization.mp_collector_id}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Aceite PIX e cartão de crédito. O valor cai diretamente na sua conta Mercado Pago.
              </p>
              <a
                href={
                  `https://auth.mercadopago.com/authorization` +
                  `?client_id=${import.meta.env.VITE_MP_CLIENT_ID}` +
                  `&response_type=code` +
                  `&platform_id=mp` +
                  `&redirect_uri=${encodeURIComponent(import.meta.env.VITE_MP_REDIRECT_URI ?? '')}` +
                  `&state=${organization.id}`
                }
              >
                <Button variant="outline" className="w-full gap-2">
                  <CreditCard className="w-4 h-4" />
                  Conectar Mercado Pago
                </Button>
              </a>
            </>
          )}
        </div>
      </Section>

      <Separator />

      {/* ── Custom domain ─────────────────────────────────────────────── */}
      <Section
        icon={Globe}
        title="Domínio personalizado"
        description="Use seu próprio domínio em vez de slug.trilheiros.app."
      >
        {isPro ? (
          <Input
            label="Domínio personalizado"
            placeholder="www.suaagencia.com.br"
            value={organization.custom_domain ?? ''}
            hint="Configure o DNS do seu domínio apontando para trilheiros.app"
          />
        ) : (
          <LockedFeature>
            <Input
              label="Domínio personalizado"
              placeholder="www.suaagencia.com.br"
              disabled
            />
          </LockedFeature>
        )}
      </Section>

      <Separator />

      {/* ── Plan ──────────────────────────────────────────────────────── */}
      <UpgradeSection organizationId={organization.id} currentPlan={organization.plan} />

      {/* Bottom save button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={handleSave} loading={saving} size="lg">
          <Save className="w-4 h-4" />
          Salvar todas as alterações
        </Button>
      </div>

    </div>
  )
}

// ── Upgrade Section ─────────────────────────────────────────────────────────

const PLAN_DETAILS = {
  basico: {
    name: 'Básico',
    price: 'R$ 97',
    period: '/mês',
    tours: 'Até 15 passeios ativos',
    features: ['Site próprio da agência', 'Painel administrativo', 'Gestão de reservas', 'Gestão de clientes'],
  },
  pro: {
    name: 'Pro',
    price: 'R$ 197',
    period: '/mês',
    tours: 'Passeios ilimitados',
    features: ['Tudo do Básico', 'Analytics avançado', 'Loja integrada', 'CMS', 'Cupons de desconto', 'Exportação de dados', 'Domínio personalizado'],
  },
}

function UpgradeSection({ organizationId, currentPlan }: { organizationId: string; currentPlan: string }) {
  const [pendingRequest, setPendingRequest] = useState<{ id: string; requested_plan: string } | null>(null)
  const [requesting, setRequesting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('upgrade_requests' as any)
      .select('id, requested_plan')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .maybeSingle()
      .then(({ data }: any) => {
        setPendingRequest(data)
        setLoading(false)
      })
  }, [organizationId])

  const handleRequest = async (plan: string) => {
    setRequesting(true)
    try {
      const { error } = await supabase.from('upgrade_requests' as any).insert({
        organization_id: organizationId,
        requested_plan: plan,
      })
      if (error) throw error
      setPendingRequest({ id: 'new', requested_plan: plan })
      toast.success('Solicitação de upgrade enviada! Aguarde a aprovação.')
    } catch {
      toast.error('Erro ao solicitar upgrade')
    } finally {
      setRequesting(false)
    }
  }

  const availablePlans = currentPlan === 'free'
    ? (['basico', 'pro'] as const)
    : currentPlan === 'basico'
    ? (['pro'] as const)
    : []

  return (
    <Section icon={Zap} title="Plano atual" description="Seu plano determina os recursos disponíveis.">
      {/* Current plan badge */}
      <div className="flex items-center justify-between rounded-xl border p-4">
        <div>
          <p className="text-sm font-semibold text-foreground capitalize">Plano {currentPlan}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentPlan === 'free' && 'Gratuito · Listagem no portal'}
            {currentPlan === 'basico' && 'R$ 97/mês · Até 15 passeios ativos'}
            {currentPlan === 'pro' && 'R$ 197/mês · Passeios ilimitados'}
          </p>
        </div>
        <Badge variant={currentPlan as 'free' | 'basico' | 'pro'}>
          {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
        </Badge>
      </div>

      {/* Pending request banner */}
      {pendingRequest && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4">
          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Upgrade para <strong className="capitalize">{pendingRequest.requested_plan}</strong> solicitado — aguardando aprovação.
          </p>
        </div>
      )}

      {/* Pro plan celebration */}
      {currentPlan === 'pro' && (
        <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30 p-4">
          <Crown className="w-4 h-4 text-violet-600 flex-shrink-0" />
          <p className="text-sm text-violet-800 dark:text-violet-200">
            Você está no melhor plano! Todos os recursos estão desbloqueados.
          </p>
        </div>
      )}

      {/* Plan cards */}
      {availablePlans.length > 0 && !pendingRequest && !loading && (
        <div className={`grid gap-4 ${availablePlans.length > 1 ? 'md:grid-cols-2' : ''}`}>
          {availablePlans.map((plan) => {
            const details = PLAN_DETAILS[plan]
            const isPro = plan === 'pro'
            return (
              <div
                key={plan}
                className={`rounded-xl border p-5 space-y-4 ${
                  isPro ? 'border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/20' : ''
                }`}
              >
                {isPro && (
                  <Badge variant="pro" className="text-[10px]">Recomendado</Badge>
                )}
                <div>
                  <p className="text-lg font-bold text-foreground">{details.name}</p>
                  <p className="text-2xl font-extrabold text-foreground mt-1">
                    {details.price}
                    <span className="text-sm font-normal text-muted-foreground">{details.period}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{details.tours}</p>
                </div>
                <ul className="space-y-2">
                  {details.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={isPro ? 'default' : 'outline'}
                  onClick={() => handleRequest(plan)}
                  disabled={requesting}
                >
                  <Zap className="w-3.5 h-3.5" />
                  {requesting ? 'Enviando...' : `Solicitar ${details.name}`}
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </Section>
  )
}
