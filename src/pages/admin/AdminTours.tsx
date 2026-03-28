import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, MapPin, Calendar, Users, MoreVertical,
  Eye, EyeOff, Pencil, Trash2, Globe,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { formatDate, formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

interface Tour {
  id: string
  name: string
  city: string | null
  state: string | null
  start_date: string | null
  vagas: number | null
  valor_padrao: number | null
  is_active: boolean | null
  is_published_to_portal: boolean | null
  difficulty: string | null
  reservas_count?: number
}

const DIFFICULTY_LABELS: Record<string, string> = {
  facil: 'Fácil', moderado: 'Moderado', dificil: 'Difícil', muito_dificil: 'Muito difícil',
}
const DIFFICULTY_VARIANTS: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
  facil: 'success', moderado: 'warning', dificil: 'destructive', muito_dificil: 'destructive',
}

// ── Tour row ───────────────────────────────────────────────────────────────

interface TourRowProps {
  tour: Tour
  onToggleActive: (id: string, value: boolean) => void
  onTogglePortal: (id: string, value: boolean) => void
  onDelete: (id: string) => void
}

function TourRow({ tour, onToggleActive, onTogglePortal, onDelete }: TourRowProps) {
  return (
    <div className="flex items-center gap-4 py-4 px-4 hover:bg-accent/30 rounded-xl transition-colors group">
      {/* Status indicator */}
      <div className={cn(
        'w-2 h-2 rounded-full flex-shrink-0',
        tour.is_active ? 'bg-primary' : 'bg-muted-foreground'
      )} />

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={`/admin/passeios/${tour.id}`}
            className="text-sm font-medium text-foreground hover:text-primary truncate max-w-[240px]"
          >
            {tour.name}
          </Link>
          {tour.difficulty && (
            <Badge variant={DIFFICULTY_VARIANTS[tour.difficulty] ?? 'default'} className="text-xs">
              {DIFFICULTY_LABELS[tour.difficulty] ?? tour.difficulty}
            </Badge>
          )}
          {tour.is_published_to_portal && (
            <Badge variant="outline" className="text-xs gap-1">
              <Globe className="w-3 h-3" /> Portal
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
          {tour.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {tour.city}/{tour.state}
            </span>
          )}
          {tour.start_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatDate(tour.start_date)}
            </span>
          )}
          {tour.vagas && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {tour.reservas_count ?? 0}/{tour.vagas} vagas
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      {tour.valor_padrao && (
        <div className="hidden sm:block text-right flex-shrink-0">
          <p className="text-sm font-medium text-foreground">
            {formatCurrency(tour.valor_padrao)}
          </p>
          <p className="text-xs text-muted-foreground">a partir de</p>
        </div>
      )}

      {/* Portal toggle */}
      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        <Switch
          checked={tour.is_published_to_portal ?? false}
          onCheckedChange={v => onTogglePortal(tour.id, v)}
        />
        <span className="text-xs text-muted-foreground w-14">
          {tour.is_published_to_portal ? 'No portal' : 'Oculto'}
        </span>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 flex-shrink-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to={`/admin/passeios/${tour.id}`}>
              <Pencil className="w-4 h-4" /> Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onToggleActive(tour.id, !tour.is_active)}>
            {tour.is_active
              ? <><EyeOff className="w-4 h-4" /> Desativar</>
              : <><Eye className="w-4 h-4" /> Ativar</>
            }
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onTogglePortal(tour.id, !tour.is_published_to_portal)}>
            <Globe className="w-4 h-4" />
            {tour.is_published_to_portal ? 'Remover do portal' : 'Publicar no portal'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(tour.id)}
          >
            <Trash2 className="w-4 h-4" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ── Filter tabs ────────────────────────────────────────────────────────────

type FilterTab = 'todos' | 'ativos' | 'inativos'

// ── Main component ─────────────────────────────────────────────────────────

export default function AdminTours() {
  const { organization } = useOrganization()
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('todos')

  useEffect(() => {
    if (organization) fetchTours()
  }, [organization?.id])

  const fetchTours = async () => {
    if (!organization) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('tours')
        .select('id, name, city, state, start_date, vagas, valor_padrao, is_active, is_published_to_portal, difficulty')
        .eq('organization_id', organization.id)
        .order('start_date', { ascending: false })

      if (!data) return

      // Count reservations per tour in parallel
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
      setTours(toursWithCount)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, value: boolean) => {
    setTours(prev => prev.map(t => t.id === id ? { ...t, is_active: value } : t))
    const { error } = await supabase
      .from('tours').update({ is_active: value }).eq('id', id)
    if (error) {
      setTours(prev => prev.map(t => t.id === id ? { ...t, is_active: !value } : t))
      toast.error('Erro ao atualizar passeio')
    } else {
      toast.success(value ? 'Passeio ativado' : 'Passeio desativado')
    }
  }

  const handleTogglePortal = async (id: string, value: boolean) => {
    setTours(prev => prev.map(t => t.id === id ? { ...t, is_published_to_portal: value } : t))
    const { error } = await supabase
      .from('tours').update({ is_published_to_portal: value }).eq('id', id)
    if (error) {
      setTours(prev => prev.map(t => t.id === id ? { ...t, is_published_to_portal: !value } : t))
      toast.error('Erro ao atualizar passeio')
    } else {
      toast.success(value ? 'Publicado no portal' : 'Removido do portal')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza? Esta ação não pode ser desfeita.')) return
    const { error } = await supabase.from('tours').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir passeio'); return }
    setTours(prev => prev.filter(t => t.id !== id))
    toast.success('Passeio excluído')
  }

  const filtered = tours.filter(t => {
    if (filter === 'ativos') return t.is_active
    if (filter === 'inativos') return !t.is_active
    return true
  })

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'todos', label: `Todos (${tours.length})` },
    { key: 'ativos', label: `Ativos (${tours.filter(t => t.is_active).length})` },
    { key: 'inativos', label: `Inativos (${tours.filter(t => !t.is_active).length})` },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Passeios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie seus tours e experiências
          </p>
        </div>
        <Link to="/admin/passeios/novo">
          <Button>
            <Plus className="w-4 h-4" /> Novo passeio
          </Button>
        </Link>
      </div>

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

      {/* Tour list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-foreground">
            {filter === 'todos' ? 'Nenhum passeio criado ainda' : 'Nenhum passeio nesta categoria'}
          </p>
          {filter === 'todos' && (
            <Link to="/admin/passeios/novo">
              <Button className="mt-4" size="sm">
                <Plus className="w-4 h-4" /> Criar primeiro passeio
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border">
          {filtered.map(tour => (
            <TourRow
              key={tour.id}
              tour={tour}
              onToggleActive={handleToggleActive}
              onTogglePortal={handleTogglePortal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
