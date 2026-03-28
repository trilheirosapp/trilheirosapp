import type { LoaderFunctionArgs } from 'react-router'
import { useLoaderData } from 'react-router'
import { createSupabasePublicClient } from '~/utils/supabase.server'
import PortalAgencia from '@/pages/portal/PortalAgencia'

export async function loader({ params }: LoaderFunctionArgs) {
  const slug = params.slug!
  const supabase = createSupabasePublicClient()

  const { data: agency } = await supabase
    .from('organizations')
    .select('id, name, slug, bio, logo_url, cover_image_url, city, state, whatsapp, instagram, website, plan')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()

  if (!agency) {
    return { agency: null, tours: [] }
  }

  const { data: tours } = await supabase
    .from('tours')
    .select('id, name, city, state, start_date, valor_padrao, difficulty, image_url, trail_type, organizations(name, slug, logo_url)')
    .eq('organization_id', agency.id)
    .eq('is_published_to_portal', true)
    .eq('is_active', true)
    .gte('start_date', new Date().toISOString().split('T')[0])
    .order('start_date', { ascending: true })

  return { agency, tours: tours ?? [] }
}

export default function AgenciaPortal() {
  const { agency, tours } = useLoaderData<typeof loader>()
  return <PortalAgencia slug={agency?.slug ?? ''} initialAgency={agency} initialTours={tours} />
}
