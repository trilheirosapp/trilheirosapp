import { useParams } from 'react-router'
import PortalDestino from '@/pages/portal/PortalDestino'

export default function Destino() {
  const { slug } = useParams<{ slug: string }>()
  return <PortalDestino slug={slug!} />
}
