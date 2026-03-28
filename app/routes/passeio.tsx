import type { LoaderFunctionArgs } from 'react-router'
import { useLoaderData } from 'react-router'
import { createSupabasePublicClient } from '~/utils/supabase.server'
import TourPage from '@/pages/agency/TourPage'

export async function loader({ params }: LoaderFunctionArgs) {
  const tourId = params.slug!
  const supabase = createSupabasePublicClient()

  const [
    { data: tour },
    { data: pricingOptions },
    { data: boardingPoints },
    { data: optionalItems },
    { data: reviews },
    { count: reservasCount },
  ] = await Promise.all([
    supabase.from('tours').select('*').eq('id', tourId).single(),
    supabase.from('tour_pricing_options').select('*').eq('tour_id', tourId).order('display_order'),
    supabase.from('tour_boarding_points').select('*').eq('tour_id', tourId).order('display_order'),
    supabase.from('tour_optional_items').select('*').eq('tour_id', tourId).eq('is_active', true),
    supabase.from('reviews').select('*').eq('tour_id', tourId).eq('is_published', true).order('created_at', { ascending: false }),
    supabase.from('reservas').select('*', { count: 'exact', head: true }).eq('tour_id', tourId).in('status', ['confirmada', 'pendente']),
  ])

  return {
    tour,
    pricingOptions: pricingOptions ?? [],
    boardingPoints: boardingPoints ?? [],
    optionalItems: optionalItems ?? [],
    reviews: reviews ?? [],
    reservasCount: reservasCount ?? 0,
  }
}

export default function PasseioRoute() {
  const data = useLoaderData<typeof loader>()
  return (
    <TourPage
      tourId={data.tour?.id ?? ''}
      initialData={data}
    />
  )
}
