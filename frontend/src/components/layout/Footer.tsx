export function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-brand-line/20 bg-brand-bg">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-brand-muted font-semibold tracking-[0.22em] text-sm uppercase">
          Prato
        </span>
        <p className="text-brand-muted text-sm text-center sm:text-left">
          © {new Date().getFullYear()} Prato. Inteligência para a margem do seu restaurante.
        </p>
      </div>
    </footer>
  )
}


