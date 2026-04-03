import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Eye, EyeOff, LogIn, ArrowLeft, Sun, Moon } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/ThemeProvider"

export default function Login() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Preencha todos os campos.")
      return
    }

    setIsLoading(true)
    // Mockup: simulate network delay — replace with real API call
    await new Promise((r) => setTimeout(r, 900))
    setIsLoading(false)
    navigate("/insumos")
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans flex">

      {/* ── LEFT PANEL (decorative) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] bg-brand-surface border-r border-brand-line/20 px-12 py-10 relative overflow-hidden">
        {/* Concentric circles background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg viewBox="0 0 600 600" className="w-[min(90vw,520px)] opacity-50" fill="none" aria-hidden="true">
            <circle cx="300" cy="300" r="278" stroke="hsl(var(--circle-stroke) / 0.12)" strokeWidth="1" />
            <circle cx="300" cy="300" r="210" stroke="hsl(var(--circle-stroke) / 0.16)" strokeWidth="1" />
            <circle cx="300" cy="300" r="142" stroke="hsl(var(--circle-stroke) / 0.12)" strokeWidth="1" />
            <circle cx="300" cy="300" r="74"  stroke="hsl(var(--circle-stroke) / 0.10)" strokeWidth="1" />
            <circle cx="300" cy="300" r="3"   fill="rgba(94,111,55,0.5)" />
          </svg>
        </div>
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-48 rounded-full bg-[radial-gradient(ellipse,rgba(94,111,55,0.10)_0%,transparent_70%)] blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5 group w-fit">
            <span className="text-brand-highlight group-hover:text-[#9cc85f] transition-colors">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="11" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="11" cy="11" r="1.5" fill="currentColor"/>
              </svg>
            </span>
            <span className="font-semibold text-lg tracking-tight text-brand-text">Prato</span>
          </Link>
        </div>

        {/* Center quote */}
        <div className="relative z-10 text-center px-4">
          <p className="text-brand-line text-[0.65rem] tracking-[0.35em] uppercase font-medium mb-6">
            Inteligência de Margem
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold leading-snug tracking-tight text-brand-text mb-4">
            Clareza sobre a{" "}
            <span className="text-brand-highlight">margem</span>
            <br />do seu restaurante.
          </h2>
          <p className="text-brand-muted text-sm leading-relaxed max-w-xs mx-auto">
            Compare CMV ideal e real, entenda impactos da operação e encontre oportunidades com mais clareza.
          </p>
        </div>

        {/* Bottom badge */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-1 h-1 rounded-full bg-brand-highlight" />
          <p className="text-brand-line text-xs">Acesso antecipado · Prato β</p>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className="flex-1 flex flex-col justify-between px-8 sm:px-12 lg:px-16 py-10">
        {/* Top nav */}
        <div className="flex items-center justify-between">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <span className="text-brand-highlight">
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="11" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="11" cy="11" r="1.5" fill="currentColor"/>
              </svg>
            </span>
            <span className="font-semibold text-base text-brand-text">Prato</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-[2px] text-brand-muted hover:text-brand-highlight transition-colors"
              aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link
              to="/"
              className="hidden lg:flex items-center gap-1.5 text-brand-line hover:text-brand-muted text-sm transition-colors duration-150"
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
              Voltar ao início
            </Link>
          </div>

          <a
            href="mailto:contato@prato.app"
            className="text-brand-line hover:text-brand-highlight text-sm transition-colors duration-150"
          >
            Solicitar acesso
          </a>
        </div>

        {/* Form area */}
        <div className="w-full max-w-sm mx-auto flex flex-col gap-0">
          {/* Header */}
          <div className="mb-8">
            <p className="text-brand-line text-[0.65rem] tracking-[0.35em] uppercase font-medium mb-3">
              Prato · Acesso à Plataforma
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold leading-snug tracking-tight text-brand-text">
              Bem-vindo de volta
            </h1>
            <p className="text-brand-muted text-sm mt-2 leading-relaxed">
              Entre com suas credenciais para acessar o painel.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="login-email"
                className="text-brand-soft text-xs font-medium tracking-wide"
              >
                E-mail
              </Label>
              <Input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  bg-brand-bg border-brand-line/35 text-brand-text placeholder:text-brand-line/70
                  h-10 focus-visible:ring-brand-highlight/10 focus-visible:border-brand-highlight/60
                "
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="login-password"
                  className="text-brand-soft text-xs font-medium tracking-wide"
                >
                  Senha
                </Label>
                <Button
                  variant="link"
                  type="button"
                  className="text-brand-line hover:text-brand-highlight text-xs p-0 h-auto font-normal"
                >
                  Esqueceu a senha?
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="
                    bg-brand-bg border-brand-line/35 text-brand-text placeholder:text-brand-line/70
                    h-10 pr-10 focus-visible:ring-brand-highlight/10 focus-visible:border-brand-highlight/60
                  "
                />
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1 top-1 w-8 h-8 text-brand-line hover:text-brand-highlight hover:bg-transparent"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword
                    ? <EyeOff size={15} strokeWidth={1.5} />
                    : <Eye size={15} strokeWidth={1.5} />
                  }
                </Button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-400/80 text-xs -mt-1">{error}</p>
            )}

            {/* Submit */}
            <Button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="mt-1 w-full h-10 bg-brand-primary hover:bg-brand-primary-hover text-brand-button-text hover:shadow-[0_0_18px_rgba(201,76,182,0.18),0_0_6px_rgba(94,111,55,0.3)]"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 opacity-70 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Entrando…
                </>
              ) : (
                <>
                  <LogIn size={15} strokeWidth={1.5} className="mr-2" />
                  Entrar na plataforma
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-brand-line text-xs">
          Ainda não tem acesso?{" "}
          <a href="mailto:contato@prato.app" className="text-brand-highlight hover:underline">
            Fale com a gente
          </a>
        </p>
      </div>
    </div>
  )
}


