import { verifyCompanySession } from "@/app/_lib/auth/session";
import { TopNav } from "@/app/_lib/layout/TopNav";
import { MockDataBanner } from "@/app/_lib/design-system/MockDataBanner";
import { Input } from "@/app/_lib/design-system/Input";
import { Button } from "@/app/_lib/design-system/Button";
import { ConfigNav } from "../ConfigNav";
import { getMockSessions } from "@/app/_lib/mock/admin-settings";

export default async function ConfigSegurancaPage() {
  const session = await verifyCompanySession();
  const sessions = await getMockSessions();

  return (
    <>
      <TopNav active="config" user={session.user} />
      <div className="mx-auto flex max-w-[1080px] items-start gap-7.5 px-8 pb-14 pt-7">
        <ConfigNav active="/empresa/config/seguranca" />
        <section className="min-w-0 max-w-[560px] flex-1">
          <div className="mb-1 text-[13px] font-semibold text-text-muted">
            Configurações / Segurança
          </div>
          <h1 className="mb-4.5 text-[22px] font-extrabold tracking-tight">Segurança</h1>
          <MockDataBanner note="troca de senha e gestão de sessões" />

          <div className="mb-4.5 rounded-2xl border border-border bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <h3 className="mb-4.5 text-[15px] font-bold">Alterar senha</h3>
            <Input
              id="currentPassword"
              type="password"
              label="Senha atual"
              disabled
              className="mb-3.5"
            />
            <div className="mb-5 grid grid-cols-2 gap-3.5">
              <Input id="newPassword" type="password" label="Nova senha" disabled />
              <Input id="confirmPassword" type="password" label="Confirmar" disabled />
            </div>
            <Button size="sm" disabled>
              Atualizar senha
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="mb-3.5 flex items-center justify-between">
              <h3 className="text-[15px] font-bold">Sessões ativas</h3>
              <span className="text-[12.5px] font-semibold text-danger">
                Encerrar todas as outras
              </span>
            </div>
            {sessions.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold">{s.device}</span>
                    {s.current && (
                      <span className="rounded-full bg-success-bg px-2 py-0.5 text-[10.5px] font-bold text-success">
                        esta sessão
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-text-muted">{s.location}</div>
                </div>
                {!s.current && (
                  <button className="text-[12.5px] font-semibold text-danger">Encerrar</button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
