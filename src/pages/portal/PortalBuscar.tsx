import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import PortalNav from '@/components/portal/PortalNav'
import { TourCard } from '@/pages/portal/PortalHome'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

interface Tour {
  id: string
  name: string
  city: string | null
  state: string | null
  start_date: string | null
  valor_padrao: number | null
  difficulty: string | null
  image_url: string | null
  trail_type: string[] | null
  organizations: { name: string; slug: string; logo_url: string | null } | null
}

// ── Constants ───────────────────────────────────────────────────────────────

const BR_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const DIFFICULTIES = [
  { value: 'facil', label: 'Fácil' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'dificil', label: 'Difícil' },
  { value: 'muito_dificil', label: 'Muito difícil' },
]

const TRAIL_TYPES = [
  'trilha', 'cachoeira', 'camping', 'escalada', 'rapel',
  'mergulho', 'cicloturismo', 'caverna', 'canyoning',
]

// ── Main component ─────────────────────────────────────────────────────────

export default function PortalBuscar({ initialTours }: { initialTours?: Tour[] }) {
  const [searchParams] = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [estado, setEstado] = useState(searchParams.get('estado') ?? '')
  const [difficulty, setDifficulty] = useState(searchParams.get('dificuldade') ?? '')
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    searchParams.get('tipo') ? searchParams.get('tipo')!.split(',') : []
  )
  const [startDateFrom, setStartDateFrom] = useState(searchParams.get('data_de') ?? '')

  const [tours, setTours] = useState<Tour[]>(initialTours ?? [])
  const [loading, setLoading] = useState(!initialTours)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const activeFiltersCount = [estado, difficulty, selectedTypes.length > 0, startDateFrom]
    .filter(Boolean).length

  useEffect(() => {
    fetchTours()
  }, [query, estado, difficulty, selectedTypes, startDateFrom])

  const fetchTours = async () => {
    setLoading(true)
    try {
      let q = supabase
        .from('tours')
        .select('id, name, city, state, start_date, valor_padrao, difficulty, image_url, trail_type, organizations(name, slug, logo_url)')
        .eq('is_published_to_portal', true)
        .eq('is_active', true)
        .order('start_date', { ascending: true })

      if (query.trim()) q = q.ilike('name', `%${query.trim()}%`)
      if (estado) q = q.eq('state', estado)
      if (difficulty) q = q.eq('difficulty', difficulty)
      if (startDateFrom) q = q.gte('start_date', startDateFrom)
      if (selectedTypes.length) q = q.overlaps('trail_type', selectedTypes)

      const { data } = await q.limit(50)
      setTours((data as Tour[]) ?? [])
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setEstado('')
    setDifficulty('')
    setSelectedTypes([])
    setStartDateFrom('')
  }

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PortalNav />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Search bar */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar trilha, destino, passeio..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button
            variant="outline"
            className={cn('gap-1.5 relative', activeFiltersCount > 0 && 'border-primary text-primary')}
            onClick={() => setFiltersOpen(v => !v)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Filters panel */}
        {filtersOpen && (
          <div className="p-4 border rounded-2xl bg-card space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Filtros</p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Limpar filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Estado */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado</p>
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os estados</SelectItem>
                    {BR_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Dificuldade */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dificuldade</p>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Qualquer dificuldade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Qualquer dificuldade</SelectItem>
                    {DIFFICULTIES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Data a partir de */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">A partir de</p>
                <Input
                  type="date"
                  value={startDateFrom}
                  onChange={e => setStartDateFrom(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Tipo de atividade */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipo de atividade</p>
              <div className="flex flex-wrap gap-2">
                {TRAIL_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={cn(
                      'px-3 py-1.5 rounded-full border text-sm capitalize transition-colors',
                      selectedTypes.includes(type)
                        ? 'bg-primary/10 border-primary text-primary font-medium'
                        : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active filter badges */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {estado && (
              <Badge variant="secondary" className="gap-1.5">
                {estado}
                <button onClick={() => setEstado('')}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {difficulty && (
              <Badge variant="secondary" className="gap-1.5 capitalize">
                {DIFFICULTIES.find(d => d.value === difficulty)?.label ?? difficulty}
                <button onClick={() => setDifficulty('')}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {selectedTypes.map(t => (
              <Badge key={t} variant="secondary" className="gap-1.5 capitalize">
                {t}
                <button onClick={() => toggleType(t)}><X className="w-3 h-3" /></button>
              </Badge>
            ))}
            {startDateFrom && (
              <Badge variant="secondary" className="gap-1.5">
                A partir de {startDateFrom}
                <button onClick={() => setStartDateFrom('')}><X className="w-3 h-3" /></button>
              </Badge>
            )}
          </div>
        )}

        {/* Results */}
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            {loading ? 'Buscando...' : `${tours.length} passeio${tours.length !== 1 ? 's' : ''} encontrado${tours.length !== 1 ? 's' : ''}`}
          </p>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-72 rounded-2xl" />)}
            </div>
          ) : tours.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-2xl">
              <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="font-medium text-foreground">Nenhum passeio encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tente outros filtros ou termos de busca
              </p>
              {activeFiltersCount > 0 && (
                <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tours.map(tour => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
