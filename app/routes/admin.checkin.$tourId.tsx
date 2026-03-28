import type { LoaderFunctionArgs } from 'react-router'
import { useLoaderData } from 'react-router'
import AdminCheckin from '@/pages/admin/AdminCheckin'

export async function loader({ params }: LoaderFunctionArgs) {
  return { tourId: params.tourId! }
}

export default function AdminCheckinRoute() {
  const { tourId } = useLoaderData<typeof loader>()
  return <AdminCheckin tourId={tourId} />
}
