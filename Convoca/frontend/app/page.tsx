import Link from "next/link";

export default function SplashPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[radial-gradient(120%_90%_at_80%_-10%,#EEF2FF_0%,#F8FAFC_45%)]">
      <header className="flex items-center justify-between px-12 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8.5 w-8.5 items-center justify-center rounded-[10px] bg-primary text-lg font-extrabold text-white">
            C
          </div>
          <span className="text-xl font-extrabold tracking-tight">Convoca</span>
        </div>
        <span className="text-[13px] font-medium text-text-secondary">
          Recrutamento conduzido por IA
        </span>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-5">
        <div className="w-full max-w-4xl">
          <div className="mb-11 text-center">
            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-ai-accent-bg px-3.5 py-1.5 text-[12.5px] font-semibold text-violet-700">
              <span className="h-1.5 w-1.5 rounded-full bg-ai-accent" />
              Agente de IA que tria candidatos via WhatsApp
            </div>
            <h1 className="mx-auto mb-3.5 max-w-xl text-4xl font-extrabold leading-tight tracking-tight">
              Recrutamento conduzido por IA, do match à entrevista
            </h1>
            <p className="text-lg font-medium text-text-secondary">
              Escolha por onde você entra. Dois caminhos, um só produto.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col rounded-[20px] border border-border bg-white p-8 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
              <div className="mb-4.5 flex h-13 w-13 items-center justify-center rounded-2xl bg-[#EEF2FF]">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="1.8"
                >
                  <rect x="3" y="8" width="18" height="12" rx="2" />
                  <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M3 13h18" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold tracking-tight">Sou uma empresa</h3>
              <p className="mb-6 flex-1 text-[14.5px] leading-relaxed text-text-secondary">
                Publique vagas e deixe nosso agente de IA triar candidatos por você — no
                WhatsApp, em escala.
              </p>
              <Link
                href="/empresa/login"
                className="flex h-12 w-full items-center justify-center rounded-full bg-primary text-[15px] font-bold text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:bg-primary-hover"
              >
                Entrar como empresa
              </Link>
            </div>

            <div className="flex flex-col rounded-[20px] border border-border bg-white p-8 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
              <div className="mb-4.5 flex h-13 w-13 items-center justify-center rounded-2xl bg-ai-accent-bg">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8B5CF6"
                  strokeWidth="1.8"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold tracking-tight">Sou candidato</h3>
              <p className="mb-6 flex-1 text-[14.5px] leading-relaxed text-text-secondary">
                Cadastre-se uma vez e seja contatado quando surgir a vaga certa. Sem enviar
                currículo a cada vaga.
              </p>
              <Link
                href="/candidato/entrar"
                className="flex h-12 w-full items-center justify-center rounded-full bg-ai-accent text-[15px] font-bold text-white shadow-[0_4px_12px_rgba(139,92,246,0.28)] hover:opacity-90"
              >
                Entrar como candidato
              </Link>
            </div>
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-center gap-5 px-6 py-6 text-[12.5px] text-text-muted">
        <span>© 2026 Convoca</span>
        <span className="cursor-pointer">Termos de Uso</span>
        <span className="cursor-pointer">Privacidade</span>
      </footer>
    </div>
  );
}
