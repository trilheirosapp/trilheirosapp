import type { LoaderFunctionArgs } from 'react-router'
import { useLoaderData } from 'react-router'
import AdminTourWizard from '@/pages/admin/AdminTourWizard'

export async function loader({ params }: LoaderFunctionArgs) {
  return { tourId: params.id! }
}

export default function AdminEditarPasseio() {
  const { tourId } = useLoaderData<typeof loader>()
  return <AdminTourWizard tourId={tourId} />
}
