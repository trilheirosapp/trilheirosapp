import type { LoaderFunctionArgs } from 'react-router'
import { useLoaderData } from 'react-router'
import { createSupabasePublicClient } from '~/utils/supabase.server'
import PortalTrilha from '@/pages/portal/PortalTrilha'

export async function loader({ params }: LoaderFunctionArgs) {
  const slug = params.slug!
  const supabase = createSupabasePublicClient()

  const { data: trail } = await supabase
    .from('trail_guides')
    .select('*, destinations(name, slug, region, state)')
    .eq('slug', slug)
    .maybeSingle()

  // Fetch related tours that reference this trail guide
  let relatedTours: any[] = []
  if (trail) {
    const { data } = await supabase
      .from('tours')
      .select('id, name, city, state, start_date, valor_padrao, difficulty, image_url, trail_type, organizations(name, slug, logo_url)')
      .eq('trail_guide_id', trail.id)
      .eq('is_active', true)
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: true })
      .limit(12)
    relatedTours = data ?? []
  }

  return { trail, relatedTours }
}

export default function TrilhaRoute() {
  const { trail, relatedTours } = useLoaderData<typeof loader>()
  return <PortalTrilha trail={trail} relatedTours={relatedTours} />
}
