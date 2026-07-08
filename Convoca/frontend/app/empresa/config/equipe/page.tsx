import { verifyCompanySession } from "@/app/_lib/auth/session";
import { TopNav } from "@/app/_lib/layout/TopNav";
import { ConfigNav } from "../ConfigNav";
import { listTeamMembers } from "@/app/_lib/api/endpoints/team";
import { TeamPanel } from "./TeamPanel";

export default async function ConfigEquipePage() {
  const session = await verifyCompanySession();
  const canManage = session.user.role === "TENANT_ADMIN";
  const team =
    canManage && session.user.tenantId ? await listTeamMembers(session.user.tenantId) : [];

  return (
    <>
      <TopNav active="config" user={session.user} />
      <div className="flex w-full items-start gap-7.5 px-8 pb-14 pt-7">
        <ConfigNav active="/empresa/config/equipe" />
        <section className="min-w-0 flex-1">
          <TeamPanel initialTeam={team} canManage={canManage} />
        </section>
      </div>
    </>
  );
}
