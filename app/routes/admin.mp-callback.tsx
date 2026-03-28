import { redirect } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { createSupabaseAuthClient } from '~/utils/supabase.server'
import { exchangeOAuthCode } from '~/utils/mercadopago.server'

// GET /admin/mp-callback?code=CODE&state=ORG_ID
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const orgId = url.searchParams.get('state')

  if (!code || !orgId) {
    return redirect('/admin/configuracoes?mp=error')
  }

  const { supabase } = createSupabaseAuthClient(request)

  // Verify the logged-in user owns this organization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/admin/entrar')

  const { data: org } = await supabase
    .from('organizations')
    .select('id, user_id')
    .eq('id', orgId)
    .single()

  if (!org || org.user_id !== user.id) {
    return redirect('/admin/configuracoes?mp=error')
  }

  try {
    const { access_token, collector_id, public_key } = await exchangeOAuthCode(code)

    await supabase
      .from('organizations')
      .update({
        mp_access_token: access_token,
        mp_collector_id: String(collector_id),
        mp_public_key: public_key,
      })
      .eq('id', orgId)

    return redirect('/admin/configuracoes?mp=success')
  } catch (err) {
    console.error('MP OAuth error:', err)
    return redirect('/admin/configuracoes?mp=error')
  }
}

export default function MpCallback() {
  return null
}
