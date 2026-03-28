import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useOrganization } from '@/contexts/OrganizationContext'
import { toast } from 'sonner'

export default function AdminLogin() {
  const { organization } = useOrganization()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      // Force full page reload so AdminLayout picks up the session
      window.location.href = '/admin'
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao entrar')
      setLoading(false)
    }
  }

  const brandColor = organization?.primary_color ?? '#2D6A4F'

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: `color-mix(in srgb, ${brandColor} 8%, #000)` }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {organization?.logo_url ? (
            <img src={organization.logo_url} alt={organization.name} className="h-12 mx-auto mb-4 object-contain" />
          ) : (
            <div
              className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: brandColor }}
            >
              {(organization?.name ?? 'A').charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-2xl font-bold text-white">Painel Admin</h1>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4"
        >
          <div>
            <label className="block text-sm text-white/60 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="admin@agencia.com"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-3 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: brandColor }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center mt-6">
          <a href="/" className="text-white/30 hover:text-white/50 text-sm transition-colors">
            ← Voltar ao site
          </a>
        </p>
      </div>
    </div>
  )
}
