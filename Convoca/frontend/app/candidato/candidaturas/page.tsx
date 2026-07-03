import Link from "next/link";
import { CandidatePage } from "@/app/_lib/layout/CandidatePage";
import { CandidateShell } from "@/app/_lib/layout/CandidateShell";
import { listMyApplications } from "@/app/_lib/api/endpoints/candidates";
import { Badge } from "@/app/_lib/design-system/Badge";
import { getApplicationStatusStyle } from "@/app/_lib/design-system/status-map";

export default async function CandidaturasPage() {
  return (
    <CandidatePage>
      {async (session) => {
        const applications = await listMyApplications();

        return (
          <CandidateShell title={`Olá, ${session.candidate.name.split(" ")[0]}`}>
            <div className="mb-3.5 flex items-center justify-between">
              <p className="text-[14.5px] font-semibold text-text">
                Você tem <span className="text-primary">{applications.length}</span> candidatura
                {applications.length === 1 ? "" : "s"} em andamento
              </p>
              <Link href="/candidato/perfil" className="text-[13px] font-semibold text-primary">
                Meu perfil
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-white p-8 text-center">
                <p className="text-sm leading-relaxed text-text-secondary">
                  Assim que você for compatível com uma vaga, nosso agente vai entrar em
                  contato.
                </p>
              </div>
            ) : (
              <ul className="space-y-3.5">
                {applications.map((app) => {
                  const style = getApplicationStatusStyle(app.status);
                  return (
                    <li
                      key={app.id}
                      className="rounded-2xl border border-border bg-white p-4.5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="mb-0.5 text-[11px] font-semibold text-text-muted">
                            Vaga #{app.jobId.slice(0, 8)}
                          </div>
                        </div>
                        <Badge {...style} />
                      </div>
                      <p className="text-[12px] text-text-muted">
                        Detalhes da vaga indisponíveis no momento.
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </CandidateShell>
        );
      }}
    </CandidatePage>
  );
}
