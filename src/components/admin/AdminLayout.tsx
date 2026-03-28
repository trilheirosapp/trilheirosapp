import { useState, useEffect } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Map, BookOpen, Users, Settings,
  LogOut, Menu, X, ChevronUp, Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/contexts/OrganizationContext'
import type { Organization } from '@/types/organization'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// ── Nav items ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/admin',            icon: LayoutDashboard, label: 'Visão geral',  end: true },
  { to: '/admin/passeios',   icon: Map,             label: 'Passeios' },
  { to: '/admin/reservas',   icon: BookOpen,        label: 'Reservas' },
  { to: '/admin/clientes',   icon: Users,           label: 'Clientes' },
  { to: '/admin/configuracoes', icon: Settings,     label: 'Configurações' },
]

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratuito', basico: 'Básico', pro: 'Pro',
}

// ── Sidebar ────────────────────────────────────────────────────────────────

interface SidebarProps {
  onClose?: () => void
}

function Sidebar({ onClose }: SidebarProps) {
  const { organization } = useOrganization()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    toast.success('Saiu com sucesso')
    navigate('/admin/entrar')
  }

  const plan = organization?.plan ?? 'free'

  return (
    <div className="flex flex-col h-full bg-card border-r border-border w-64">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 min-h-[65px]">
        <Avatar className="h-9 w-9 rounded-xl flex-shrink-0">
          <AvatarImage src={organization?.logo_url ?? undefined} />
          <AvatarFallback
            className="rounded-xl text-white font-bold"
            style={{ backgroundColor: organization?.primary_color || '#2D6A4F' }}
          >
            {organization?.name?.charAt(0).toUpperCase() ?? 'A'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {organization?.name ?? 'Minha Agência'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {organization?.slug}.trilheiros.app
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <Separator />

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Separator />

      {/* Plan + Logout */}
      <div className="p-3 space-y-2">
        {plan !== 'pro' && (
          <button
            onClick={() => navigate('/admin/configuracoes')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-primary/5 hover:bg-primary/10 text-primary transition-colors border border-primary/20"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Fazer upgrade para Pro</span>
            <ChevronUp className="w-3.5 h-3.5 ml-auto" />
          </button>
        )}

        <div className="flex items-center justify-between px-3 py-1">
          <Badge variant={plan as 'free' | 'basico' | 'pro'}>
            {PLAN_LABELS[plan]}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            loading={loggingOut}
            className="h-7 text-xs text-muted-foreground"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Layout ─────────────────────────────────────────────────────────────────

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [orgLoading, setOrgLoading] = useState(true)
  const navigate = useNavigate()
  const { organization, setOrganization } = useOrganization()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        navigate('/admin/entrar', { replace: true })
        return
      }
      // On localhost the SSR loader returns organization=null.
      // Load the user's org via organization_members so all admin pages work.
      if (!organization) {
        const { data: member, error: memberError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', data.user.id)
          .maybeSingle()

        console.log('[AdminLayout] user:', data.user.id)
        console.log('[AdminLayout] member:', member, 'error:', memberError)

        if (member) {
          const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', member.organization_id)
            .maybeSingle()

          console.log('[AdminLayout] org:', org, 'error:', orgError)

          if (org) setOrganization(org as unknown as Organization)
          else navigate('/cadastro', { replace: true })
        } else {
          // Logged in but no org → send to signup
          navigate('/cadastro', { replace: true })
          return
        }
      }
      setOrgLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (orgLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile header + theme toggle) */}
        <header className="flex items-center gap-3 px-4 h-[65px] border-b border-border flex-shrink-0 md:justify-end">
          <button
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 md:flex-none" />
          <ThemeToggle />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
