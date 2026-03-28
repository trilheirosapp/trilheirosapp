import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export default function PortalSignup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    email: '',
    password: '',
    whatsapp: '',
    state: '',
    city: '',
  })

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSlugChange = (value: string) => {
    const slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
    set('slug', slug)
  }

  const handleStep1 = () => {
    console.log('handleStep1 called', form)
    if (!form.name.trim()) { toast.error('Nome da agência é obrigatório'); return }
    if (!form.slug.trim()) { toast.error('Endereço no Trilheiros é obrigatório'); return }
    if (form.slug.length < 3) { toast.error('Endereço deve ter pelo menos 3 caracteres'); return }
    console.log('validation passed, going to step 2')
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email.trim()) { toast.error('E-mail é obrigatório'); return }
    if (form.password.length < 8) { toast.error('Senha deve ter pelo menos 8 caracteres'); return }
    setLoading(true)
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })
      if (authError) throw authError
      if (!authData.user) throw new Error('Erro ao criar usuário')

      // 2. Create organization using service role via API (bypasses RLS on signUp)
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: form.name,
          slug: form.slug,
          email: form.email,
          whatsapp: form.whatsapp || null,
          state: form.state || null,
          city: form.city || null,
          plan: 'free',
          status: 'active',
        })
        .select()
        .single()

      if (orgError) {
        if (orgError.code === '23505') throw new Error('Este endereço já está em uso. Escolha outro.')
        throw orgError
      }

      // 3. Create organization member (owner)
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({ organization_id: org.id, user_id: authData.user.id, role: 'owner' })

      if (memberError) throw new Error(`Erro ao vincular usuário: ${memberError.message}`)

      toast.success('Agência cadastrada com sucesso!')
      navigate('/admin/entrar')
    } catch (err: unknown) {
      console.error('Signup error:', err)
      toast.error(err instanceof Error ? err.message : 'Erro ao cadastrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1f0d] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-1 mb-6">
            <span className="text-2xl font-bold text-green-400">trilheiros</span>
            <span className="text-2xl font-bold text-white">.app</span>
          </a>
          <h1 className="text-2xl font-bold text-white">Cadastrar sua agência</h1>
          <p className="text-green-300/60 mt-2 text-sm">
            Comece grátis — apareça no portal de trilhas do Brasil
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex gap-2 mb-6">
          {[1, 2].map(s => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                step >= s ? 'bg-green-500' : 'bg-green-900'
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit}
          className="bg-green-950/40 border border-green-900/50 rounded-2xl p-8 space-y-4"
        >
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm text-green-300 mb-1">Nome da agência</label>
                <input
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Ex: Camaleão Ecoturismo"
                  className="w-full bg-green-950/50 border border-green-800 rounded-lg px-4 py-3 text-white placeholder:text-green-700 focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-sm text-green-300 mb-1">
                  Endereço no Trilheiros
                </label>
                <div className="flex items-center gap-0 border border-green-800 rounded-lg overflow-hidden focus-within:border-green-400 transition-colors">
                  <span className="bg-green-950 px-3 py-3 text-green-500 text-sm border-r border-green-800">
                    trilheiros.app/
                  </span>
                  <input
                    value={form.slug}
                    onChange={e => handleSlugChange(e.target.value)}
                    placeholder="sua-agencia"
                    className="flex-1 bg-green-950/50 px-3 py-3 text-white placeholder:text-green-700 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-green-300 mb-1">Estado</label>
                  <input
                    value={form.state}
                    onChange={e => set('state', e.target.value)}
                    placeholder="AL"
                    maxLength={2}
                    className="w-full bg-green-950/50 border border-green-800 rounded-lg px-4 py-3 text-white placeholder:text-green-700 focus:outline-none focus:border-green-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-green-300 mb-1">Cidade</label>
                  <input
                    value={form.city}
                    onChange={e => set('city', e.target.value)}
                    placeholder="Maceió"
                    className="w-full bg-green-950/50 border border-green-800 rounded-lg px-4 py-3 text-white placeholder:text-green-700 focus:outline-none focus:border-green-400"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleStep1}
                className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-lg transition-colors"
              >
                Continuar →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm text-green-300 mb-1">E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  required
                  placeholder="contato@agencia.com"
                  className="w-full bg-green-950/50 border border-green-800 rounded-lg px-4 py-3 text-white placeholder:text-green-700 focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-sm text-green-300 mb-1">Senha</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full bg-green-950/50 border border-green-800 rounded-lg px-4 py-3 text-white placeholder:text-green-700 focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-sm text-green-300 mb-1">WhatsApp (opcional)</label>
                <input
                  value={form.whatsapp}
                  onChange={e => set('whatsapp', e.target.value)}
                  placeholder="5582999999999"
                  className="w-full bg-green-950/50 border border-green-800 rounded-lg px-4 py-3 text-white placeholder:text-green-700 focus:outline-none focus:border-green-400"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border border-green-800 hover:border-green-600 text-green-300 font-medium py-3 rounded-lg transition-colors"
                >
                  ← Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold py-3 rounded-lg transition-colors"
                >
                  {loading ? 'Cadastrando...' : 'Cadastrar grátis'}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="text-center text-green-300/50 text-sm mt-6">
          Já tem conta?{' '}
          <a href="/entrar" className="text-green-400 hover:text-green-300">
            Entrar
          </a>
        </p>
      </div>
    </div>
  )
}
