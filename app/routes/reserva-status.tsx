import { useParams } from 'react-router-dom'
import ReservaStatus from '@/pages/agency/ReservaStatus'

export default function ReservaStatusRoute() {
  const { slug } = useParams<{ slug: string }>()
  return <ReservaStatus slug={slug!} />
}
