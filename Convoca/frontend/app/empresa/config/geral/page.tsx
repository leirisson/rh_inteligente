import { verifyCompanySession } from "@/app/_lib/auth/session";
import { TopNav } from "@/app/_lib/layout/TopNav";
import { MockDataBanner } from "@/app/_lib/design-system/MockDataBanner";
import { Input } from "@/app/_lib/design-system/Input";
import { ConfigNav } from "../ConfigNav";
import { getMockTenantGeneral } from "@/app/_lib/mock/admin-settings";

export default async function ConfigGeralPage() {
  const session = await verifyCompanySession();
  const tenant = await getMockTenantGeneral();

  return (
    <>
      <TopNav active="config" user={session.user} />
      <div className="flex w-full items-start gap-7.5 px-8 pb-14 pt-7">
        <ConfigNav active="/empresa/config/geral" />
        <section className="min-w-0 flex-1">
          <MockDataBanner note="dados gerais do tenant" />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6.5 shadow-[0_4px_16px_rgba(15,23,42,0.08)]">
              <h3 className="mb-4.5 text-base font-bold">Dados da empresa</h3>
              <div className="mb-5 flex items-center gap-3.5 border-b border-slate-100 pb-5">
                <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-primary text-[22px] font-extrabold text-white">
                  {tenant.displayName[0]}
                </div>
                <div>
                  <div className="text-base font-bold">{tenant.displayName}</div>
                  <div className="text-[13px] text-text-secondary">
                    Plano {tenant.plan} · {tenant.activeJobs} vagas ativas
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  id="legalName"
                  label="Razão social"
                  defaultValue={tenant.legalName}
                  disabled
                />
                <Input
                  id="displayName"
                  label="Nome de exibição"
                  defaultValue={tenant.displayName}
                  disabled
                />
              </div>
              <p className="mt-5.5 text-[12.5px] text-text-muted">
                Plano atual: <strong className="text-text-secondary">{tenant.plan}</strong> —
                cobrança mensal, até 15 vagas simultâneas.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6.5 shadow-[0_4px_16px_rgba(15,23,42,0.08)]">
              <h3 className="mb-3.5 text-sm font-bold">Sobre o plano {tenant.plan}</h3>
              <ul className="space-y-3">
                <li className="flex gap-2.5">
                  <span className="font-extrabold text-primary">·</span>
                  <span className="text-[13px] leading-relaxed text-text-secondary">
                    Até 15 vagas simultâneas ativas, com triagem automática pelo agente de IA.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="font-extrabold text-primary">·</span>
                  <span className="text-[13px] leading-relaxed text-text-secondary">
                    Cobrança mensal recorrente, sem fidelidade.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="font-extrabold text-primary">·</span>
                  <span className="text-[13px] leading-relaxed text-text-secondary">
                    Precisa de mais vagas simultâneas? Fale com o suporte para avaliar um upgrade.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
