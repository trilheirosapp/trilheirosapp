import { useEffect, useState } from 'react'
import { Users, Search, Phone, Mail } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatCPF, formatPhone } from '@/lib/format'

// ── Types ──────────────────────────────────────────────────────────────────

interface Cliente {
  id: string
  nome_completo: string
  cpf: string
  email: string | null
  whatsapp: string | null
  created_at: string | null
  reservas_count?: number
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AdminClientes() {
  const { organization } = useOrganization()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (organization) fetchClientes()
  }, [organization?.id])

  const fetchClientes = async () => {
    if (!organization) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('clientes')
        .select('id, nome_completo, cpf, email, whatsapp, created_at')
        .eq('organization_id', organization.id)
        .order('nome_completo')

      if (!data) return

      // Count reservas per client
      const withCounts = await Promise.all(
        data.map(async c => {
          const { count } = await supabase
            .from('reservas')
            .select('*', { count: 'exact', head: true })
            .eq('cliente_id', c.id)
          return { ...c, reservas_count: count ?? 0 }
        })
      )

      setClientes(withCounts)
    } finally {
      setLoading(false)
    }
  }

  const filtered = clientes.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.nome_completo.toLowerCase().includes(q) ||
      c.cpf.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.whatsapp?.includes(q)
    )
  })

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Clientes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {loading ? '...' : `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''} cadastrado${clientes.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Search */}
      <Input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por nome, CPF, e-mail ou WhatsApp..."
        prefix={<Search className="w-4 h-4" />}
      />

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-foreground">
            {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Os clientes aparecem aqui quando fazem reservas nos seus passeios
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border rounded-xl border">
          {filtered.map(cliente => (
            <div
              key={cliente.id}
              className="flex items-center gap-4 py-4 px-4 hover:bg-accent/30 rounded-xl transition-colors"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {cliente.nome_completo.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{cliente.nome_completo}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatCPF(cliente.cpf)}</p>
              </div>

              {/* Contact */}
              <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                {cliente.email && (
                  <a
                    href={`mailto:${cliente.email}`}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <Mail className="w-3.5 h-3.5" /> {cliente.email}
                  </a>
                )}
                {cliente.whatsapp && (
                  <a
                    href={`https://wa.me/55${cliente.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <Phone className="w-3.5 h-3.5" /> {formatPhone(cliente.whatsapp)}
                  </a>
                )}
              </div>

              {/* Reservas count */}
              <Badge variant="outline" className="flex-shrink-0 text-xs">
                {cliente.reservas_count} reserva{cliente.reservas_count !== 1 ? 's' : ''}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
