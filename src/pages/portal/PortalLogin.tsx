import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export default function PortalLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      navigate('/admin')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1f0d] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-1 mb-6">
            <span className="text-2xl font-bold text-green-400">trilheiros</span>
            <span className="text-2xl font-bold text-white">.app</span>
          </a>
          <h1 className="text-2xl font-bold text-white">Entrar na sua agência</h1>
          <p className="text-green-300/60 mt-2 text-sm">
            Acesse o painel admin da sua agência
          </p>
        </div>

        <form onSubmit={handleLogin} className="bg-green-950/40 border border-green-900/50 rounded-2xl p-8 space-y-4">
          <div>
            <label className="block text-sm text-green-300 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="w-full bg-green-950/50 border border-green-800 rounded-lg px-4 py-3 text-white placeholder:text-green-700 focus:outline-none focus:border-green-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-green-300 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-green-950/50 border border-green-800 rounded-lg px-4 py-3 text-white placeholder:text-green-700 focus:outline-none focus:border-green-400 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold py-3 rounded-lg transition-colors mt-2"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-green-300/50 text-sm mt-6">
          Não tem conta?{' '}
          <a href="/cadastro" className="text-green-400 hover:text-green-300">
            Cadastrar agência
          </a>
        </p>
      </div>
    </div>
  )
}
