import { Link } from "react-router-dom"
import { ArrowRight, Sun, Moon } from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"

export function Navbar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 md:px-10 py-7 z-20">
      <Link to="/" className="text-brand-text font-semibold tracking-[0.2em] text-sm uppercase select-none">
        Prato
      </Link>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-[2px] text-brand-soft hover:text-brand-highlight transition-colors"
          aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <Link
          to="/login"
          className="hidden sm:inline-flex text-[0.75rem] tracking-[0.08em] border border-brand-line/40 text-brand-soft px-[1rem] py-[0.45rem] rounded-[2px] transition-colors duration-200 hover:border-brand-primary/50 hover:text-brand-text items-center gap-[0.375rem] group"
        >
          Acessar plataforma
          <ArrowRight className="w-3.5 h-3.5 text-brand-primary transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </header>
  )
}



