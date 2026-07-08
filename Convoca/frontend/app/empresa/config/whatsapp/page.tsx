import { verifyCompanySession } from "@/app/_lib/auth/session";
import { TopNav } from "@/app/_lib/layout/TopNav";
import { getWhatsAppStatus } from "@/app/_lib/api/endpoints/tenant-integration";
import { ConfigNav } from "../ConfigNav";
import { WhatsAppPanel } from "./WhatsAppPanel";

export default async function WhatsAppConfigPage() {
  const session = await verifyCompanySession();
  const status = session.user.tenantId
    ? await getWhatsAppStatus(session.user.tenantId)
    : { status: "DISCONNECTED" as const, connectedPhoneNumber: null };

  return (
    <>
      <TopNav active="config" user={session.user} />
      <div className="flex w-full items-start gap-7.5 px-8 pb-14 pt-7">
        <ConfigNav active="/empresa/config/whatsapp" />
        <section className="min-w-0 flex-1">
          <div className="mb-1 text-[13px] font-semibold text-text-muted">
            Configurações / Integrações
          </div>
          <h1 className="mb-4.5 text-[22px] font-extrabold tracking-tight">
            WhatsApp Institucional
          </h1>

          <div className="mx-auto max-w-[640px]">
            <WhatsAppPanel
              initialStatus={status.status}
              initialPhone={status.connectedPhoneNumber}
              user={session.user}
            />
          </div>

          <div className="mx-auto grid max-w-[860px] grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.08)]">
              <h3 className="mb-2 text-sm font-bold">Sobre esta conexão</h3>
              <p className="text-[13px] leading-relaxed text-text-secondary">
                Este número é usado pelo <strong className="text-ai-accent">agente de IA</strong>{" "}
                para contatar candidatos automaticamente. É compartilhado por toda a empresa —
                não é o WhatsApp pessoal de um recrutador.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.08)]">
              <h3 className="mb-2 text-sm font-bold">Canal de fallback</h3>
              <p className="text-[13px] leading-relaxed text-text-secondary">
                Se o WhatsApp falhar para um candidato (sem número ou sessão caiu), o sistema
                tenta e-mail automaticamente.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
