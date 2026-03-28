import type { LoaderFunctionArgs } from 'react-router'
import { useLoaderData } from 'react-router'
import { createSupabasePublicClient } from '~/utils/supabase.server'
import PortalBuscar from '@/pages/portal/PortalBuscar'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const q = url.searchParams.get('q')?.trim() ?? ''
  const estado = url.searchParams.get('estado') ?? ''
  const dificuldade = url.searchParams.get('dificuldade') ?? ''
  const tipo = url.searchParams.get('tipo') ?? ''
  const dataFrom = url.searchParams.get('data_de') ?? ''

  const supabase = createSupabasePublicClient()

  let query = supabase
    .from('tours')
    .select('id, name, city, state, start_date, valor_padrao, difficulty, image_url, trail_type, organizations(name, slug, logo_url)')
    .eq('is_published_to_portal', true)
    .eq('is_active', true)
    .order('start_date', { ascending: true })

  if (q) query = query.ilike('name', `%${q}%`)
  if (estado) query = query.eq('state', estado)
  if (dificuldade) query = query.eq('difficulty', dificuldade)
  if (dataFrom) query = query.gte('start_date', dataFrom)
  if (tipo) {
    const tipos = tipo.split(',').filter(Boolean)
    if (tipos.length) query = query.overlaps('trail_type', tipos)
  }

  const { data: tours } = await query.limit(50)

  return { tours: tours ?? [] }
}

export default function BuscarRoute() {
  const { tours } = useLoaderData<typeof loader>()
  return <PortalBuscar initialTours={tours} />
}
