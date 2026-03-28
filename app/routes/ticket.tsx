import type { LoaderFunctionArgs } from 'react-router'
import { useLoaderData } from 'react-router'
import { createSupabasePublicClient } from '~/utils/supabase.server'
import TicketPage from '@/pages/agency/TicketPage'

export async function loader({ params }: LoaderFunctionArgs) {
  const token = params.token!
  const supabase = createSupabasePublicClient()

  const { data: ticket } = await supabase
    .from('tickets')
    .select('*, reservation_participants(nome_completo, pricing_option_name), tours(name, image_url, city, state), organizations(name, logo_url)')
    .eq('qr_token', token)
    .maybeSingle()

  return { ticket, token }
}

export default function TicketRoute() {
  const { ticket, token } = useLoaderData<typeof loader>()
  return <TicketPage token={token} initialTicket={ticket} />
}
