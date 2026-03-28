import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OrganizationProvider, useOrganization } from '@/contexts/OrganizationContext'
import { Toaster } from 'sonner'

// Portal pages (trilheiros.app)
import PortalHome from '@/pages/portal/PortalHome'
import PortalLogin from '@/pages/portal/PortalLogin'
import PortalSignup from '@/pages/portal/PortalSignup'

// Agency site pages ({slug}.trilheiros.app)
import AgencyHome from '@/pages/agency/AgencyHome'

// Admin pages
import AdminLogin from '@/pages/admin/AdminLogin'
import AdminDashboard from '@/pages/admin/AdminDashboard'

// Super admin
import SuperAdmin from '@/pages/admin/SuperAdmin'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function AppRouter() {
  const { isMainPortal, isLoading } = useOrganization()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1a2e1a]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-green-300 text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  if (isMainPortal) {
    return (
      <Routes>
        <Route path="/" element={<PortalHome />} />
        <Route path="/destinos/:slug" element={<PortalHome />} />
        <Route path="/trilhas/:slug" element={<PortalHome />} />
        <Route path="/agencias/:slug" element={<PortalHome />} />
        <Route path="/entrar" element={<PortalLogin />} />
        <Route path="/cadastro" element={<PortalSignup />} />
        <Route path="/admin/entrar" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        <Route path="/super" element={<SuperAdmin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  // Agency subdomain routes
  return (
    <Routes>
      <Route path="/" element={<AgencyHome />} />
      <Route path="/admin/entrar" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/*" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <OrganizationProvider isMainPortal={true} organization={null}>
          <AppRouter />
          <Toaster richColors position="top-right" />
        </OrganizationProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
