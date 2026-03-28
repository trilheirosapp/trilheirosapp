import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ClienteEntrar() {
  const navigate = useNavigate()
  const { organization } = useOrganization()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error('E-mail ou senha inválidos')
      return
    }
    navigate('/cliente/minhas-reservas')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Branding */}
        <div className="text-center space-y-2">
          {organization?.logo_url && (
            <img
              src={organization.logo_url}
              alt={organization.name}
              className="h-12 mx-auto object-contain"
            />
          )}
          <h1 className="text-xl font-bold text-foreground">Minhas reservas</h1>
          <p className="text-sm text-muted-foreground">
            Entre para ver suas reservas em {organization?.name ?? 'nossa agência'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="E-mail"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            autoComplete="email"
          />
          <Input
            label="Senha"
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Não tem conta?{' '}
          <Link to="/cliente/cadastro" className="text-primary hover:underline font-medium">
            Criar conta
          </Link>
        </p>

        <div className="text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Voltar para os passeios
          </Link>
        </div>
      </div>
    </div>
  )
}
