import { Link, Outlet, useLocation } from "react-router-dom"
import { Box, FileSpreadsheet, Layers, Moon, PieChart, Store, Sun, TrendingUp, Unlink } from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"

export function AppLayout() {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="bg-brand-bg text-brand-text antialiased font-sans min-h-screen flex">
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-brand-line/20 bg-brand-surface min-h-screen sticky top-0 h-screen overflow-y-auto">
        <div className="px-5 py-5 border-b border-brand-line/15">
          <Link to="/" className="flex items-center gap-2.5 group w-fit">
            <span className="text-brand-highlight transition-colors">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="11" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="11" cy="11" r="1.5" fill="currentColor"/>
              </svg>
            </span>
            <span className="font-semibold text-lg tracking-tight text-brand-text group-hover:text-brand-highlight transition-colors">Prato</span>
          </Link>
        </div>
        <nav className="px-3 py-5 flex flex-col gap-0.5 flex-1">
          <p className="text-brand-muted text-[0.65rem] tracking-[0.15em] uppercase font-medium px-3 mb-2">Operação</p>
          <Link
            to="/insumos"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-[2px] text-[0.82rem] font-medium transition-colors ${
              location.pathname === "/insumos"
                ? "text-brand-highlight bg-brand-highlight/10"
                : "text-brand-muted hover:text-brand-soft hover:bg-brand-line/10"
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            Insumos
          </Link>
          <Link
            to="/receitas"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-[2px] text-[0.82rem] font-medium transition-colors ${
              location.pathname.startsWith("/receitas")
                ? "text-brand-highlight bg-brand-highlight/10"
                : "text-brand-muted hover:text-brand-soft hover:bg-brand-line/10"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Receitas
          </Link>
          <Link
            to="/vendas"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-[2px] text-[0.82rem] font-medium transition-colors ${
              location.pathname === "/vendas"
                ? "text-brand-highlight bg-brand-highlight/10"
                : "text-brand-muted hover:text-brand-soft hover:bg-brand-line/10"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Vendas
          </Link>
          <Link
            to="/vendas/ausentes"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-[2px] text-[0.82rem] font-medium transition-colors ${
              location.pathname === "/vendas/ausentes"
                ? "text-brand-highlight bg-brand-highlight/10"
                : "text-brand-muted hover:text-brand-soft hover:bg-brand-line/10"
            }`}
          >
            <Unlink className="w-3.5 h-3.5" />
            SKUs não vinculados
          </Link>
          <div className="border-t border-brand-line/15 my-4"></div>
          <p className="text-brand-muted text-[0.65rem] tracking-[0.15em] uppercase font-medium px-3 mb-2">Análise</p>
          <Link
            to="/lojas"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-[2px] text-[0.82rem] font-medium transition-colors ${
              location.pathname.startsWith("/lojas")
                ? "text-brand-highlight bg-brand-highlight/10"
                : "text-brand-muted hover:text-brand-soft hover:bg-brand-line/10"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            Lojas
          </Link>
          <Link
            to="/dashboard"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-[2px] text-[0.82rem] font-medium transition-colors ${
              location.pathname === "/dashboard"
                ? "text-brand-highlight bg-brand-highlight/10"
                : "text-brand-muted hover:text-brand-soft hover:bg-brand-line/10"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            CMV
          </Link>
          <div className="flex items-center gap-2.5 px-3 py-2 opacity-50 pointer-events-none text-brand-muted text-[0.82rem] font-medium">
            <PieChart className="w-3.5 h-3.5" />
            Margem
          </div>
        </nav>
        <div className="px-5 h-[60px] shrink-0 border-t border-brand-line/15 flex items-center justify-between">
          <p className="text-brand-muted text-xs">Acesso antecipado</p>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-[2px] text-brand-muted hover:text-brand-highlight hover:bg-brand-line/10 transition-colors"
            aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <header className="md:hidden flex items-center justify-between px-5 py-4 border-b border-brand-line/20 bg-brand-surface sticky top-0 z-20">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-brand-highlight">
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="11" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="11" cy="11" r="1.5" fill="currentColor"/>
              </svg>
            </span>
            <span className="font-semibold text-base tracking-tight text-brand-text">Prato</span>
          </Link>
          <div className="flex gap-2 items-center flex-wrap justify-end">
            <Link to="/insumos" className={`text-xs ${location.pathname === "/insumos" ? "text-brand-highlight font-medium" : "text-brand-muted"}`}>
              Insumos
            </Link>
            <span className="text-brand-line/50">|</span>
            <Link to="/receitas" className={`text-xs ${location.pathname.startsWith("/receitas") ? "text-brand-highlight font-medium" : "text-brand-muted"}`}>
              Receitas
            </Link>
            <span className="text-brand-line/50">|</span>
            <Link to="/vendas" className={`text-xs ${location.pathname === "/vendas" ? "text-brand-highlight font-medium" : "text-brand-muted"}`}>
              Vendas
            </Link>
            <span className="text-brand-line/50">|</span>
            <Link to="/vendas/ausentes" className={`text-xs ${location.pathname === "/vendas/ausentes" ? "text-brand-highlight font-medium" : "text-brand-muted"}`}>
              Vínculos
            </Link>
            <span className="text-brand-line/50">|</span>
            <Link to="/lojas" className={`text-xs ${location.pathname.startsWith("/lojas") ? "text-brand-highlight font-medium" : "text-brand-muted"}`}>
              Lojas
            </Link>
            <span className="text-brand-line/50">|</span>
            <Link to="/dashboard" className={`text-xs ${location.pathname === "/dashboard" ? "text-brand-highlight font-medium" : "text-brand-muted"}`}>
              CMV
            </Link>
            <span className="text-brand-line/50">|</span>
            <button
              onClick={toggleTheme}
              className="p-1 rounded-[2px] text-brand-muted hover:text-brand-highlight transition-colors"
              aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </header>
        <main className={`flex-1 px-6 md:px-10 py-8 md:py-10 mx-auto w-full ${
          location.pathname.startsWith("/lojas") || location.pathname.startsWith("/dashboard") ? "max-w-[1600px]" : "max-w-6xl"
        }`}>
          <Outlet />
        </main>
        <footer className="h-[60px] shrink-0 px-6 md:px-10 border-t border-brand-line/15 flex items-center">
          <p className="text-brand-muted text-xs">© {new Date().getFullYear()} Prato — Inteligência de margem para restaurantes.</p>
        </footer>
      </div>
    </div>
  )
}

