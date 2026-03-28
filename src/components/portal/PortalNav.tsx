import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function PortalNav() {
  return (
    <nav className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-0.5 font-bold text-lg flex-shrink-0">
          <span className="text-primary">trilheiros</span>
          <span className="text-foreground">.app</span>
        </Link>

        {/* Center nav */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/buscar">
            <Button variant="ghost" size="sm" className="text-sm gap-1.5">
              <Search className="w-3.5 h-3.5" /> Buscar passeios
            </Button>
          </Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ThemeToggle />
          <Link to="/entrar">
            <Button variant="ghost" size="sm" className="hidden sm:flex text-sm">
              Entrar
            </Button>
          </Link>
          <Link to="/cadastro">
            <Button size="sm" className="text-sm">
              Cadastrar agência
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
