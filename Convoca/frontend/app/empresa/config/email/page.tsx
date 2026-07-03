import { verifyCompanySession } from "@/app/_lib/auth/session";
import { TopNav } from "@/app/_lib/layout/TopNav";
import { MockDataBanner } from "@/app/_lib/design-system/MockDataBanner";
import { Button } from "@/app/_lib/design-system/Button";
import { ConfigNav } from "../ConfigNav";
import { getMockEmailLog } from "@/app/_lib/mock/admin-settings";

export default async function ConfigEmailPage() {
  const session = await verifyCompanySession();
  const log = await getMockEmailLog();

  return (
    <>
      <TopNav active="config" user={session.user} />
      <div className="mx-auto flex max-w-[1080px] items-start gap-7.5 px-8 pb-14 pt-7">
        <ConfigNav active="/empresa/config/email" />
        <section className="min-w-0 flex-1">
          <div className="mb-1 text-[13px] font-semibold text-text-muted">
            Configurações / Integrações
          </div>
          <h1 className="mb-4.5 text-[22px] font-extrabold tracking-tight">E-mail (SMTP)</h1>
          <MockDataBanner note="status de configuração SMTP" />

          <div className="mb-5 flex items-center justify-between rounded-2xl border border-border bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-bg">
                <span className="h-3.5 w-3.5 rounded-full bg-success" />
              </div>
              <div>
                <div className="text-base font-extrabold">Conectado</div>
                <div className="mt-0.5 text-[13px] text-text-secondary">
                  Remetente: <strong className="text-text">Convoca &lt;no-reply@convoca.app&gt;</strong>
                </div>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              Enviar e-mail de teste
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h3 className="mb-3 text-sm font-bold">Uso do e-mail</h3>
              <div className="mb-3 flex gap-2.5">
                <span className="font-extrabold text-primary">1.</span>
                <span className="text-[13px] leading-relaxed text-text-secondary">
                  Fallback de contato com candidatos quando não há WhatsApp cadastrado.
                </span>
              </div>
              <div className="flex gap-2.5">
                <span className="font-extrabold text-primary">2.</span>
                <span className="text-[13px] leading-relaxed text-text-secondary">
                  Notificação de recrutadores/admins quando um candidato é aprovado na triagem.
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h3 className="mb-3 text-sm font-bold">Últimos e-mails enviados</h3>
              {log.map((e, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 border-b border-slate-100 py-2 last:border-0"
                >
                  <span className="text-[13px]">{e.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-semibold">{e.subject}</div>
                    <div className="text-[11px] text-text-muted">{e.to}</div>
                  </div>
                  <span className="flex-shrink-0 text-[11px] text-text-muted">{e.time}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-5 text-xs text-text-muted">
            Credenciais de e-mail são configuradas pela equipe técnica no ambiente do servidor.
          </p>
        </section>
      </div>
    </>
  );
}
