import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, LogIn } from "lucide-react"

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const navigate = useNavigate()
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
    // Simulate auth delay — replace with real API call
    await new Promise((r) => setTimeout(r, 900))
    setIsLoading(false)

    // Mockup: any credentials go through
    onOpenChange(false)
    navigate("/insumos")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          sm:max-w-md
          bg-brand-surface
          border border-brand-line/30
          text-brand-text
          shadow-[0_0_60px_rgba(var(--circle-glow),0.12),0_0_20px_rgba(0,0,0,0.3)]
          rounded-sm
          p-8
        "
      >
        {/* Subtle glow accent */}
        <div className="absolute inset-0 rounded-sm overflow-hidden pointer-events-none">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full bg-[radial-gradient(ellipse,rgba(94,111,55,0.14)_0%,transparent_70%)] blur-2xl" />
        </div>

        <DialogHeader className="relative z-10 mb-6">
          {/* Brand badge */}
          <p className="text-brand-muted text-[0.65rem] tracking-[0.35em] uppercase font-medium mb-3">
            Prato · Acesso à Plataforma
          </p>
          <DialogTitle className="text-brand-text text-2xl font-semibold leading-snug tracking-tight">
            Bem-vindo de volta
          </DialogTitle>
          <DialogDescription className="text-brand-muted text-sm leading-relaxed mt-1">
            Entre com seu e-mail e senha para acessar o painel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-5">
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
                bg-brand-bg
                border-brand-line/40
                text-brand-text
                placeholder:text-brand-line/70
                focus:border-brand-highlight/60
                focus:ring-brand-highlight/20
                rounded-sm
                h-10
                text-sm
                transition-all duration-200
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
              <button
                type="button"
                className="text-brand-line hover:text-brand-highlight text-xs transition-colors duration-150"
              >
                Esqueceu a senha?
              </button>
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
                  bg-brand-bg
                  border-brand-line/40
                  text-brand-text
                  placeholder:text-brand-line/70
                  focus:border-brand-highlight/60
                  focus:ring-brand-highlight/20
                  rounded-sm
                  h-10
                  text-sm
                  pr-10
                  transition-all duration-200
                "
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-line hover:text-brand-highlight transition-colors duration-150"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff size={15} strokeWidth={1.5} />
                ) : (
                  <Eye size={15} strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400/80 text-xs leading-relaxed -mt-1">
              {error}
            </p>
          )}

          {/* Submit */}
          <Button
            id="login-submit"
            type="submit"
            disabled={isLoading}
            className="
              mt-1
              w-full
              bg-brand-primary
              hover:bg-brand-primary-hover
              text-brand-button-text
              font-medium
              text-sm
              tracking-wide
              h-10
              rounded-sm
              transition-all duration-200
              hover:shadow-[0_0_18px_rgba(201,76,182,0.18),0_0_6px_rgba(94,111,55,0.3)]
              disabled:opacity-60
              flex items-center justify-center gap-2
            "
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 opacity-70"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Entrando…
              </span>
            ) : (
              <>
                <LogIn size={15} strokeWidth={1.5} />
                Entrar
              </>
            )}
          </Button>

          <p className="text-center text-brand-line text-xs leading-relaxed">
            Ainda não tem acesso?{" "}
            <a
              href="mailto:contato@prato.app"
              className="text-brand-highlight hover:underline transition-all"
            >
              Solicite acesso antecipado
            </a>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}


