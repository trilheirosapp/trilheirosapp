import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/contexts/OrganizationContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isValidCPF, sanitizeCPF } from '@/lib/format'

export default function ClienteCadastro() {
  const navigate = useNavigate()
  const { organization } = useOrganization()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cpf, setCpf] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidCPF(cpf)) { toast.error('CPF inválido'); return }

    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (authError) throw authError

      if (authData.user && organization) {
        await supabase.from('clientes').upsert({
          cpf: sanitizeCPF(cpf),
          organization_id: organization.id,
          nome_completo: name.trim(),
          email: email.trim(),
          whatsapp: whatsapp.replace(/\D/g, '') || null,
        }, { onConflict: 'cpf,organization_id', ignoreDuplicates: false })
      }

      toast.success('Conta criada! Verifique seu e-mail.')
      navigate('/cliente/minhas-reservas')
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">

        <div className="text-center space-y-2">
          {organization?.logo_url && (
            <img src={organization.logo_url} alt={organization.name} className="h-12 mx-auto object-contain" />
          )}
          <h1 className="text-xl font-bold text-foreground">Criar conta</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre-se para acompanhar suas reservas
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome completo"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Seu nome completo"
            autoComplete="name"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="CPF"
              required
              value={cpf}
              onChange={e => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              maxLength={14}
            />
            <Input
              label="WhatsApp"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="(11) 99999-9999"
              type="tel"
            />
          </div>
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
            placeholder="Mínimo 6 caracteres"
            minLength={6}
            autoComplete="new-password"
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link to="/cliente/entrar" className="text-primary hover:underline font-medium">
            Entrar
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
