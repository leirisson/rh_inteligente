import { verifyCompanySession } from "@/app/_lib/auth/session";
import { TopNav } from "@/app/_lib/layout/TopNav";
import { MockDataBanner } from "@/app/_lib/design-system/MockDataBanner";
import { Button } from "@/app/_lib/design-system/Button";
import { ConfigNav } from "../ConfigNav";
import { getMockTeam } from "@/app/_lib/mock/admin-settings";

const roleColors: Record<string, { bg: string; color: string }> = {
  SUPER_ADMIN: { bg: "#F5F3FF", color: "#7C3AED" },
  TENANT_ADMIN: { bg: "#EEF2FF", color: "#4F46E5" },
  RECRUITER: { bg: "#EFF6FF", color: "#2563EB" },
  DEPARTMENT_LEAD: { bg: "#F1F5F9", color: "#475569" },
};

export default async function ConfigEquipePage() {
  const session = await verifyCompanySession();
  const team = await getMockTeam();

  return (
    <>
      <TopNav active="config" user={session.user} />
      <div className="flex w-full items-start gap-7.5 px-8 pb-14 pt-7">
        <ConfigNav active="/empresa/config/equipe" />
        <section className="min-w-0 flex-1">
          <div className="mb-4.5 flex items-center justify-between">
            <div>
              <div className="mb-1 text-[13px] font-semibold text-text-muted">
                Configurações / Equipe
              </div>
              <h1 className="text-[22px] font-extrabold tracking-tight">Equipe</h1>
            </div>
            <Button size="sm">+ Convidar membro</Button>
          </div>
          <MockDataBanner note="listagem/convite de usuários" />

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.08)]">
            <div className="grid grid-cols-[2fr_1.4fr_1.3fr_1fr] bg-surface px-5 py-3.5 text-[11.5px] font-bold uppercase tracking-wide text-text-muted">
              <span>Nome</span>
              <span>Papel</span>
              <span>Telefone</span>
              <span>Último acesso</span>
            </div>
            {team.map((t) => {
              const style = roleColors[t.role];
              const initials = t.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
                <div
                  key={t.email}
                  className="grid grid-cols-[2fr_1.4fr_1.3fr_1fr] items-center border-b border-slate-100 px-5 py-3.5 last:border-0"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-[#EEF2FF] text-xs font-bold text-primary">
                      {initials}
                    </div>
                    <div>
                      <div className="text-[13.5px] font-semibold">{t.name}</div>
                      <div className="text-xs text-text-muted">{t.email}</div>
                    </div>
                  </div>
                  <span>
                    <span
                      className="rounded-full px-2.5 py-1 text-[11.5px] font-bold"
                      style={{ backgroundColor: style.bg, color: style.color }}
                    >
                      {t.roleLabel}
                    </span>
                  </span>
                  <span className="text-[13px] text-text-secondary">{t.phone}</span>
                  <span className="text-[13px] text-text-muted">{t.lastAccess}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
