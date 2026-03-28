import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import {
  Building2, MapPin, Mountain, Zap,
  Plus, Pencil, Trash2, ExternalLink,
  Star, StarOff, LogOut, X,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrgRow {
  id: string; name: string; slug: string
  plan: string; status: string; created_at: string | null
  city: string | null; state: string | null
}

interface Destination {
  id: string; name: string; slug: string
  state: string | null; region: string | null
  description: string | null; cover_image_url: string | null
  is_featured: boolean | null
}

interface TrailGuide {
  id: string; name: string; slug: string
  difficulty: string | null; distance_km: number | null
  duration_hours: number | null; trail_type: string[] | null
  destination_id: string | null; cover_image_url: string | null
  description: string | null; best_season: string | null
}

type Tab = 'agencias' | 'destinos' | 'trilhas' | 'planos'

// ── Helpers ───────────────────────────────────────────────────────────────────

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SuperAdmin() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('agencias')

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/entrar')
  }

  const tabs: { id: Tab; label: string; icon: typeof Building2 }[] = [
    { id: 'agencias', label: 'Agências',  icon: Building2 },
    { id: 'destinos', label: 'Destinos',  icon: MapPin },
    { id: 'trilhas',  label: 'Trilhas',   icon: Mountain },
    { id: 'planos',   label: 'Planos',    icon: Zap },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-lg font-bold">Super Admin</span>
          <span className="ml-2 text-white/30 text-xs">trilheiros.app</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </header>

      {/* Tab nav */}
      <nav className="border-b border-white/10 px-6">
        <div className="flex gap-1">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-indigo-400 text-indigo-300'
                    : 'border-transparent text-white/40 hover:text-white/70'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="p-6">
        {tab === 'agencias' && <AgenciasTab />}
        {tab === 'destinos' && <DestinosTab />}
        {tab === 'trilhas'  && <TrilhasTab />}
        {tab === 'planos'   && <PlanosTab />}
      </main>
    </div>
  )
}

// ── Agências Tab ──────────────────────────────────────────────────────────────

function AgenciasTab() {
  const [orgs, setOrgs] = useState<OrgRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('organizations')
      .select('id, name, slug, plan, status, created_at, city, state')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setOrgs(data ?? []); setLoading(false) })
  }, [])

  const toggleStatus = async (org: OrgRow) => {
    const newStatus = org.status === 'active' ? 'suspended' : 'active'
    const { error } = await supabase.from('organizations').update({ status: newStatus }).eq('id', org.id)
    if (error) { toast.error('Erro ao atualizar status'); return }
    setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, status: newStatus } : o))
    toast.success(newStatus === 'active' ? 'Agência ativada' : 'Agência suspensa')
  }

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          Agências cadastradas
          <span className="ml-2 text-white/30 font-normal">({orgs.length})</span>
        </h2>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Agência', 'Slug', 'Localização', 'Plano', 'Status', 'Cadastro', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-white/40 font-medium text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(org => (
                <tr key={org.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium">{org.name}</td>
                  <td className="px-4 py-3 text-white/40 font-mono text-xs">{org.slug}</td>
                  <td className="px-4 py-3 text-white/40 text-xs">{[org.city, org.state].filter(Boolean).join('/')}</td>
                  <td className="px-4 py-3">
                    <PlanBadge plan={org.plan} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      org.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {org.status === 'active' ? 'Ativo' : 'Suspenso'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">
                    {org.created_at ? new Date(org.created_at).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <a
                        href={`https://${org.slug}.trilheiros.app`}
                        target="_blank" rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => toggleStatus(org)}
                        className={`text-xs transition-colors ${
                          org.status === 'active' ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'
                        }`}
                      >
                        {org.status === 'active' ? 'Suspender' : 'Ativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center py-10 text-white/30 text-sm">Nenhuma agência encontrada.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Destinos Tab ──────────────────────────────────────────────────────────────

function DestinosTab() {
  const [items, setItems] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Destination | null>(null)
  const [creating, setCreating] = useState(false)

  const fetch = async () => {
    const { data } = await supabase
      .from('destinations')
      .select('id, name, slug, state, region, description, cover_image_url, is_featured')
      .order('name')
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const toggleFeatured = async (item: Destination) => {
    const val = !item.is_featured
    await supabase.from('destinations').update({ is_featured: val }).eq('id', item.id)
    setItems(prev => prev.map(d => d.id === item.id ? { ...d, is_featured: val } : d))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este destino?')) return
    const { error } = await supabase.from('destinations').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir'); return }
    setItems(prev => prev.filter(d => d.id !== id))
    toast.success('Destino excluído')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          Destinos <span className="text-white/30 font-normal">({items.length})</span>
        </h2>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo destino
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(item => (
            <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              {item.cover_image_url && (
                <img src={item.cover_image_url} alt="" className="w-full h-28 object-cover" />
              )}
              <div className="p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-white/40 text-xs">{[item.state, item.region].filter(Boolean).join(' · ')}</p>
                  </div>
                  {item.is_featured && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded-full flex-shrink-0">Destaque</span>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => toggleFeatured(item)}
                    className="text-white/40 hover:text-yellow-300 transition-colors"
                    title={item.is_featured ? 'Remover destaque' : 'Destacar'}
                  >
                    {item.is_featured ? <StarOff className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setEditing(item)}
                    className="text-white/40 hover:text-indigo-300 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-white/40 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="col-span-3 text-center py-10 text-white/30 text-sm">Nenhum destino cadastrado.</p>
          )}
        </div>
      )}

      {(creating || editing) && (
        <DestinationModal
          initial={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSaved={() => { setCreating(false); setEditing(null); fetch() }}
        />
      )}
    </div>
  )
}

// ── Destination Modal ─────────────────────────────────────────────────────────

function DestinationModal({
  initial, onClose, onSaved,
}: {
  initial: Destination | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    slug: initial?.slug ?? '',
    state: initial?.state ?? '',
    region: initial?.region ?? '',
    description: initial?.description ?? '',
    cover_image_url: initial?.cover_image_url ?? '',
    is_featured: initial?.is_featured ?? false,
  })
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name) { toast.error('Nome é obrigatório'); return }
    setSaving(true)
    const payload = {
      ...form,
      slug: form.slug || slugify(form.name),
      state: form.state || null,
      region: form.region || null,
      description: form.description || null,
      cover_image_url: form.cover_image_url || null,
    }
    const { error } = initial
      ? await supabase.from('destinations').update(payload).eq('id', initial.id)
      : await supabase.from('destinations').insert(payload)
    setSaving(false)
    if (error) { toast.error('Erro ao salvar: ' + error.message); return }
    toast.success(initial ? 'Destino atualizado' : 'Destino criado')
    onSaved()
  }

  return (
    <Modal title={initial ? 'Editar destino' : 'Novo destino'} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Nome *">
          <input value={form.name} onChange={e => { set('name', e.target.value); if (!initial) set('slug', slugify(e.target.value)) }} className={inputCls} />
        </Field>
        <Field label="Slug">
          <input value={form.slug} onChange={e => set('slug', e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Estado (UF)">
            <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="BA" className={inputCls} />
          </Field>
          <Field label="Região">
            <input value={form.region} onChange={e => set('region', e.target.value)} placeholder="Nordeste" className={inputCls} />
          </Field>
        </div>
        <Field label="Descrição">
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className={inputCls} />
        </Field>
        <Field label="URL da imagem de capa">
          <input value={form.cover_image_url} onChange={e => set('cover_image_url', e.target.value)} className={inputCls} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
          <input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} className="rounded" />
          Destaque na home do portal
        </label>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-4 py-2 text-sm text-white/50 hover:text-white/80">Cancelar</button>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-indigo-500 hover:bg-indigo-400 rounded-lg font-medium disabled:opacity-50">
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </Modal>
  )
}

// ── Trilhas Tab ───────────────────────────────────────────────────────────────

function TrilhasTab() {
  const [items, setItems] = useState<TrailGuide[]>([])
  const [destinations, setDestinations] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<TrailGuide | null>(null)
  const [creating, setCreating] = useState(false)

  const fetch = async () => {
    const [{ data: guides }, { data: dests }] = await Promise.all([
      supabase.from('trail_guides').select('id, name, slug, difficulty, distance_km, duration_hours, trail_type, destination_id, cover_image_url, description, best_season').order('name'),
      supabase.from('destinations').select('id, name').order('name'),
    ])
    setItems(guides ?? [])
    setDestinations(dests ?? [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta trilha?')) return
    const { error } = await supabase.from('trail_guides').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir'); return }
    setItems(prev => prev.filter(t => t.id !== id))
    toast.success('Trilha excluída')
  }

  const diffColor = (d: string | null) =>
    d === 'facil' ? 'text-green-400' : d === 'moderado' ? 'text-yellow-400' : d === 'dificil' ? 'text-orange-400' : d === 'muito_dificil' ? 'text-red-400' : 'text-white/40'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          Guias de trilha <span className="text-white/30 font-normal">({items.length})</span>
        </h2>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova trilha
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Trilha', 'Destino', 'Dificuldade', 'Distância', 'Duração', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-white/40 font-medium text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const dest = destinations.find(d => d.id === item.destination_id)
                return (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-white/40 text-xs">{dest?.name ?? '—'}</td>
                    <td className={`px-4 py-3 text-xs font-medium ${diffColor(item.difficulty)}`}>
                      {item.difficulty ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {item.distance_km ? `${item.distance_km} km` : '—'}
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">
                      {item.duration_hours ? `${item.duration_hours}h` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setEditing(item)} className="text-white/40 hover:text-indigo-300 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="text-white/40 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="text-center py-10 text-white/30 text-sm">Nenhuma trilha cadastrada.</p>
          )}
        </div>
      )}

      {(creating || editing) && (
        <TrailModal
          initial={editing}
          destinations={destinations}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSaved={() => { setCreating(false); setEditing(null); fetch() }}
        />
      )}
    </div>
  )
}

// ── Trail Modal ───────────────────────────────────────────────────────────────

const DIFFICULTY_OPTIONS = [
  { value: 'facil', label: 'Fácil' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'dificil', label: 'Difícil' },
  { value: 'muito_dificil', label: 'Muito difícil' },
]

const TRAIL_TYPES = ['trilha', 'cachoeira', 'rapel', 'mergulho', 'escalada', 'canyoning', 'ciclismo', 'passeio_de_barco']

function TrailModal({
  initial, destinations, onClose, onSaved,
}: {
  initial: TrailGuide | null
  destinations: { id: string; name: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    slug: initial?.slug ?? '',
    destination_id: initial?.destination_id ?? '',
    difficulty: initial?.difficulty ?? '',
    distance_km: initial?.distance_km?.toString() ?? '',
    duration_hours: initial?.duration_hours?.toString() ?? '',
    description: initial?.description ?? '',
    best_season: initial?.best_season ?? '',
    cover_image_url: initial?.cover_image_url ?? '',
    trail_type: initial?.trail_type ?? [] as string[],
  })
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const toggleType = (t: string) =>
    set('trail_type', form.trail_type.includes(t) ? form.trail_type.filter(x => x !== t) : [...form.trail_type, t])

  const handleSave = async () => {
    if (!form.name) { toast.error('Nome é obrigatório'); return }
    setSaving(true)
    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      destination_id: form.destination_id || null,
      difficulty: form.difficulty || null,
      distance_km: form.distance_km ? Number(form.distance_km) : null,
      duration_hours: form.duration_hours ? Number(form.duration_hours) : null,
      description: form.description || null,
      best_season: form.best_season || null,
      cover_image_url: form.cover_image_url || null,
      trail_type: form.trail_type.length ? form.trail_type : null,
    }
    const { error } = initial
      ? await supabase.from('trail_guides').update(payload).eq('id', initial.id)
      : await supabase.from('trail_guides').insert(payload)
    setSaving(false)
    if (error) { toast.error('Erro ao salvar: ' + error.message); return }
    toast.success(initial ? 'Trilha atualizada' : 'Trilha criada')
    onSaved()
  }

  return (
    <Modal title={initial ? 'Editar trilha' : 'Nova trilha'} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Nome *">
          <input value={form.name} onChange={e => { set('name', e.target.value); if (!initial) set('slug', slugify(e.target.value)) }} className={inputCls} />
        </Field>
        <Field label="Slug">
          <input value={form.slug} onChange={e => set('slug', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Destino">
          <select value={form.destination_id} onChange={e => set('destination_id', e.target.value)} className={inputCls}>
            <option value="">Sem destino</option>
            {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Dificuldade">
            <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} className={inputCls}>
              <option value="">—</option>
              {DIFFICULTY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Distância (km)">
            <input type="number" value={form.distance_km} onChange={e => set('distance_km', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Duração (h)">
            <input type="number" value={form.duration_hours} onChange={e => set('duration_hours', e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Tipos de atividade">
          <div className="flex flex-wrap gap-1.5 pt-1">
            {TRAIL_TYPES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => toggleType(t)}
                className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                  form.trail_type.includes(t)
                    ? 'bg-indigo-500/30 border-indigo-400 text-indigo-200'
                    : 'border-white/20 text-white/50 hover:border-white/40'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Melhor época">
          <input value={form.best_season} onChange={e => set('best_season', e.target.value)} placeholder="ex: Abril a Outubro" className={inputCls} />
        </Field>
        <Field label="Descrição">
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className={inputCls} />
        </Field>
        <Field label="URL da imagem de capa">
          <input value={form.cover_image_url} onChange={e => set('cover_image_url', e.target.value)} className={inputCls} />
        </Field>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-4 py-2 text-sm text-white/50 hover:text-white/80">Cancelar</button>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-indigo-500 hover:bg-indigo-400 rounded-lg font-medium disabled:opacity-50">
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </Modal>
  )
}

// ── Planos Tab ────────────────────────────────────────────────────────────────

const PLANS = [
  { id: 'gratuito', label: 'Gratuito', color: 'bg-white/10 text-white/40' },
  { id: 'basico',   label: 'Básico',   color: 'bg-green-500/20 text-green-300' },
  { id: 'pro',      label: 'Pro',      color: 'bg-purple-500/20 text-purple-300' },
]

interface UpgradeRequest {
  id: string
  organization_id: string
  requested_plan: string
  status: string
  created_at: string
  org_name?: string
  org_slug?: string
  org_plan?: string
}

function PlanosTab() {
  const [orgs, setOrgs] = useState<OrgRow[]>([])
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchData = async () => {
    const [{ data: orgsData }, { data: reqsData }] = await Promise.all([
      supabase.from('organizations').select('id, name, slug, plan, status, created_at, city, state').order('name'),
      supabase.from('upgrade_requests' as any).select('*').eq('status', 'pending').order('created_at', { ascending: true }) as any,
    ])
    setOrgs(orgsData ?? [])

    // Enrich requests with org info
    const enriched = ((reqsData ?? []) as any[]).map((r: any) => {
      const org = (orgsData ?? []).find((o: any) => o.id === r.organization_id)
      return { ...r, org_name: org?.name, org_slug: org?.slug, org_plan: org?.plan } as UpgradeRequest
    })
    setUpgradeRequests(enriched)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const changePlan = async (orgId: string, plan: string) => {
    setUpdating(orgId)
    const { error } = await supabase.from('organizations').update({ plan }).eq('id', orgId)
    if (error) { toast.error('Erro ao atualizar plano'); setUpdating(null); return }
    setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, plan } : o))
    toast.success('Plano atualizado')
    setUpdating(null)
  }

  const handleUpgradeAction = async (requestId: string, orgId: string, plan: string, action: 'approved' | 'rejected') => {
    setUpdating(requestId)
    try {
      if (action === 'approved') {
        const { error } = await supabase.from('organizations').update({ plan }).eq('id', orgId)
        if (error) throw error
        setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, plan } : o))
      }
      await supabase.from('upgrade_requests' as any).update({ status: action, resolved_at: new Date().toISOString() }).eq('id', requestId)
      setUpgradeRequests(prev => prev.filter(r => r.id !== requestId))
      toast.success(action === 'approved' ? 'Upgrade aprovado!' : 'Solicitação rejeitada')
    } catch {
      toast.error('Erro ao processar solicitação')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upgrade Requests */}
      {upgradeRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">
            Solicitações de upgrade <span className="text-amber-400 font-normal">({upgradeRequests.length} pendentes)</span>
          </h2>
          <div className="space-y-2">
            {upgradeRequests.map(req => (
              <div key={req.id} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{req.org_name}</p>
                  <p className="text-white/40 text-xs font-mono">{req.org_slug}</p>
                  <p className="text-sm text-white/60 mt-1">
                    <PlanBadge plan={req.org_plan ?? 'free'} /> → <PlanBadge plan={req.requested_plan} />
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleUpgradeAction(req.id, req.organization_id, req.requested_plan, 'approved')}
                    disabled={updating === req.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 hover:bg-green-500 transition-colors disabled:opacity-50"
                  >
                    {updating === req.id ? '...' : 'Aprovar'}
                  </button>
                  <button
                    onClick={() => handleUpgradeAction(req.id, req.organization_id, req.requested_plan, 'rejected')}
                    disabled={updating === req.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors disabled:opacity-50"
                  >
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">
          Gestão de planos <span className="text-white/30 font-normal">({orgs.length} agências)</span>
        </h2>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Agência', 'Plano atual', 'Alterar para'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-white/40 font-medium text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orgs.map(org => (
                <tr key={org.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{org.name}</p>
                    <p className="text-white/30 text-xs font-mono">{org.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <PlanBadge plan={org.plan} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {PLANS.filter(p => p.id !== org.plan).map(p => (
                        <button
                          key={p.id}
                          onClick={() => changePlan(org.id, p.id)}
                          disabled={updating === org.id}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-opacity ${p.color} ${
                            updating === org.id ? 'opacity-50' : 'hover:opacity-80'
                          }`}
                        >
                          {updating === org.id ? '...' : p.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Shared components ─────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: string }) {
  const config =
    plan === 'pro'     ? 'bg-purple-500/20 text-purple-300' :
    plan === 'basico'  ? 'bg-green-500/20 text-green-300' :
    'bg-white/10 text-white/40'
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs uppercase font-semibold ${config}`}>
      {plan}
    </span>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-white/50 font-medium">{label}</label>
      {children}
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30'
