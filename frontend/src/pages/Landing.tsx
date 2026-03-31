import { Link } from "react-router-dom"
import { FadeUp } from "@/components/ui/fade-up"

export default function Landing() {
  return (
    <div className="bg-brand-bg text-brand-text font-sans scroll-smooth">
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 pb-24 pt-20">
        <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none overflow-hidden">
          <svg viewBox="0 0 800 800" className="w-[min(128vw,128vh)]" fill="none" aria-hidden="true">
            <g className="animate-arc-spin origin-[400px_460px]" style={{ animationDelay: `-${Date.now() % 40000}ms` }}>
              <circle cx="400" cy="460" r="375" stroke="hsl(var(--circle-stroke) / 0.35)" strokeWidth="2.5" />
              <line x1="9" y1="460" x2="41" y2="460" stroke="hsl(var(--circle-stroke) / 0.35)" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="759" y1="460" x2="791" y2="460" stroke="hsl(var(--circle-stroke) / 0.35)" strokeWidth="3.5" strokeLinecap="round" />
            </g>
            <circle cx="400" cy="460" r="295" stroke="hsl(var(--circle-stroke) / 0.20)" strokeWidth="2" />
            <line x1="93" y1="460" x2="117" y2="460" stroke="hsl(var(--circle-stroke) / 0.20)" strokeWidth="3" strokeLinecap="round" />
            <line x1="683" y1="460" x2="707" y2="460" stroke="hsl(var(--circle-stroke) / 0.20)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="400" cy="460" r="215" stroke="hsl(var(--circle-stroke) / 0.13)" strokeWidth="1.5" />
            <line x1="177" y1="460" x2="193" y2="460" stroke="hsl(var(--circle-stroke) / 0.13)" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="607" y1="460" x2="623" y2="460" stroke="hsl(var(--circle-stroke) / 0.13)" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx="400" cy="460" r="135" stroke="hsl(var(--circle-stroke) / 0.10)" strokeWidth="1" />
            <line x1="259" y1="460" x2="271" y2="460" stroke="hsl(var(--circle-stroke) / 0.10)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="529" y1="460" x2="541" y2="460" stroke="hsl(var(--circle-stroke) / 0.10)" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="400" cy="460" r="58" stroke="hsl(var(--circle-stroke) / 0.08)" strokeWidth="0.5" />
            <line x1="338" y1="460" x2="346" y2="460" stroke="hsl(var(--circle-stroke) / 0.08)" strokeWidth="1" strokeLinecap="round" />
            <line x1="454" y1="460" x2="462" y2="460" stroke="hsl(var(--circle-stroke) / 0.08)" strokeWidth="1" strokeLinecap="round" />
            <circle cx="400" cy="460" r="3" fill="rgba(var(--circle-glow),0.4)" />
            <circle cx="400" cy="460" r="375" stroke="rgba(var(--circle-glow),0.04)" strokeWidth="28" />
          </svg>
        </div>

        {/* Glows */}
        <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[280px] rounded-full pointer-events-none z-0 bg-[radial-gradient(ellipse,_rgba(94,111,55,0.07)_0%,_transparent_70%)] blur-[60px]" />
        <div className="absolute top-[50%] left-[58%] -translate-x-1/2 -translate-y-1/2 w-[240px] h-[140px] rounded-full pointer-events-none z-0 bg-[radial-gradient(ellipse,_rgba(201,76,182,0.05)_0%,_transparent_70%)] blur-[60px]" />

        <div className="relative z-10 max-w-6xl mx-auto text-center flex flex-col items-center">
          <p className="text-brand-soft text-xs md:text-sm tracking-[0.35em] uppercase font-medium mb-10">
            Inteligência de Margem para Restaurantes
          </p>
          <h1 className="text-[2.75rem] sm:text-5xl md:text-6xl lg:text-[4.5rem] font-semibold leading-[1.08] tracking-tight mb-6">
            Clareza sobre a <span className="text-brand-highlight">margem</span><br />
            do seu <span className="underline decoration-[#7BA83F] decoration-3 underline-offset-4">restaurante.</span>
          </h1>
          <p className="text-brand-soft text-xl md:text-2xl font-light leading-relaxed max-w-3xl mb-3">
            Sua operação começa a ficar mais clara aqui.
          </p>
          <p className="text-brand-muted text-base md:text-lg leading-relaxed max-w-2xl mb-12 md:mb-14">
            Compare CMV ideal e real, entenda impactos da operação<br className="hidden md:block" /> e encontre oportunidades com mais clareza.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center">
            <Link
              id="hero-cta-acessar"
              to="/login"
              className="bg-brand-primary text-brand-button-text font-medium text-sm tracking-wide px-7 py-3.5 rounded-sm transition-all duration-200 hover:bg-brand-primary-hover hover:shadow-[0_0_18px_rgba(201,76,182,0.18),0_0_6px_rgba(94,111,55,0.25)] flex items-center justify-center"
            >
              Acessar Plataforma
            </Link>
          </div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="py-24 md:py-32 px-6 bg-brand-surface">
        <div className="max-w-4xl mx-auto">
          <FadeUp><p className="text-brand-soft text-xs tracking-[0.35em] uppercase font-medium mb-6">O problema</p></FadeUp>
          <FadeUp delay={0.1}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-snug mb-16 max-w-2xl">
              Você sabe quanto deveria custar cada prato.<br />
              Mas raramente sabe quanto <span className="text-brand-highlight">está custando</span>.
            </h2>
          </FadeUp>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10">
            {[
              { t: "CMV invisível", d: "Insumos variam, fornecedores mudam, receitas derivam — e o custo real da operação fica opaco." },
              { t: "Decisões no escuro", d: "Precificação por feeling. Promoções sem análise de impacto. Mix definido sem dados de margem." },
              { t: "Vazamento silencioso", d: "Frete, delivery e operação consomem margem sem deixar rastro claro de onde está o problema." }
            ].map((i, idx) => (
              <FadeUp key={idx} delay={0.1 * idx} className="border-t border-brand-line/30 pt-6">
                <h3 className="flex items-center gap-2.5 text-brand-text font-medium mb-2.5 text-base">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-highlight shrink-0" />
                  {i.t}
                </h3>
                <p className="text-brand-muted text-base leading-relaxed">{i.d}</p>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* THE SOLUTION */}
      <section className="py-24 md:py-32 px-6 bg-brand-bg">
        <div className="max-w-4xl mx-auto">
          <FadeUp><p className="text-brand-soft text-xs tracking-[0.35em] uppercase font-medium mb-6">A solução</p></FadeUp>
          <FadeUp delay={0.1}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-snug mb-4 max-w-2xl">
              Prato conecta o que você planejou<br className="hidden md:block" /> com o que está acontecendo.
            </h2>
            <p className="text-brand-soft text-lg leading-relaxed max-w-xl mb-16">
              Inteligência de margem para operações gastronômicas reais — sem ERP pesado, sem planilha manual.
            </p>
          </FadeUp>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                icon: <path d="M10 6v8M6 10h8" stroke="#8CB84F" strokeWidth="1.4" strokeLinecap="round" />,
                t: "CMV ideal vs. real", d: "Cadastre insumos e receitas. Prato calcula o CMV teórico e mostra o desvio — em reais, não em teoria."
              },
              {
                icon: <path d="M3 14L7.5 9L11.5 12.5L17 5" stroke="#8CB84F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />,
                t: "Análise de impacto", d: "Entenda como frete, delivery e mix afetam sua margem — antes de decisões que já foram tomadas."
              },
              {
                icon: <><circle cx="10" cy="10" r="7.5" stroke="#8CB84F" strokeWidth="1.4" /><path d="M10 6.5V10.5L12.5 12" stroke="#8CB84F" strokeWidth="1.4" strokeLinecap="round" /></>,
                t: "Visibilidade em tempo real", d: "Painel claro, sem excesso de dados. Você vê o que importa — e só o que importa."
              },
              {
                icon: <path d="M10 2.5L11.9 8.1H17.8L13.0 11.6L14.8 17.2L10 13.7L5.2 17.2L7.0 11.6L2.2 8.1H8.1L10 2.5Z" stroke="#8CB84F" strokeWidth="1.4" strokeLinejoin="round" />,
                t: "Oportunidades identificadas", d: "O sistema aponta onde está a perda de margem e o que melhora com cada decisão operacional."
              }
            ].map((i, idx) => (
              <FadeUp key={idx} delay={0.1 * idx} className="bg-brand-surface-2 border border-brand-line/20 rounded-sm p-6 md:p-7">
                <div className="mb-5">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    {i.icon}
                  </svg>
                </div>
                <h3 className="text-brand-text font-medium mb-2 text-base">{i.t}</h3>
                <p className="text-brand-muted text-base leading-relaxed">{i.d}</p>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative py-32 md:py-44 px-6 bg-brand-bg overflow-hidden border-t border-brand-line/20">
        <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none overflow-hidden">
          <svg viewBox="0 0 600 600" className="w-[min(90vw,560px)] opacity-60" fill="none" aria-hidden="true">
            <circle cx="300" cy="300" r="278" stroke="hsl(var(--circle-stroke) / 0.11)" strokeWidth="2" />
            <circle cx="300" cy="300" r="198" stroke="hsl(var(--circle-stroke) / 0.15)" strokeWidth="1.5" />
            <circle cx="300" cy="300" r="118" stroke="hsl(var(--circle-stroke) / 0.11)" strokeWidth="1" />
            <circle cx="300" cy="300" r="44" stroke="hsl(var(--circle-stroke) / 0.09)" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] rounded-full pointer-events-none z-0 bg-[radial-gradient(ellipse,_rgba(94,111,55,0.06)_0%,_transparent_70%)] blur-[80px]" />
        
        <FadeUp className="relative z-10 max-w-xl mx-auto text-center">
          <p className="text-brand-soft text-xs tracking-[0.35em] uppercase font-medium mb-8">Acesso antecipado</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight mb-5">
            Pronto para ver a margem real<br className="hidden sm:block" /> do seu restaurante?
          </h2>
          <p className="text-brand-soft text-lg leading-relaxed max-w-sm mx-auto mb-10">
            Prato está aberto para novos restaurantes acessarem a plataforma.
          </p>
          <Link
            id="cta-final-acessar"
            to="/login"
            className="inline-block bg-brand-primary text-brand-button-text font-medium text-base px-8 py-3.5 rounded-sm transition-all duration-200 hover:bg-brand-primary-hover hover:shadow-[0_0_18px_rgba(201,76,182,0.18),0_0_6px_rgba(94,111,55,0.25)]"
          >
            Acessar a Plataforma Agora
          </Link>
        </FadeUp>
      </section>
    </div>
  )
}


