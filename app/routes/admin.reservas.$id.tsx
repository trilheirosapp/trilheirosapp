import type { LoaderFunctionArgs } from 'react-router'
import { useLoaderData } from 'react-router'
import AdminReservaDetail from '@/pages/admin/AdminReservaDetail'

export async function loader({ params }: LoaderFunctionArgs) {
  return { reservaId: params.id! }
}

export default function AdminReservaDetailRoute() {
  const { reservaId } = useLoaderData<typeof loader>()
  return <AdminReservaDetail reservaId={reservaId} />
}
