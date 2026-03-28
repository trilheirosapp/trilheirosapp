import { useRouteLoaderData } from 'react-router'
import type { RootLoaderData } from '../root'
import PortalHome from '@/pages/portal/PortalHome'
import AgencyHome from '@/pages/agency/AgencyHome'

export default function Home() {
  const { isMainPortal } = useRouteLoaderData('root') as RootLoaderData
  return isMainPortal ? <PortalHome /> : <AgencyHome />
}
