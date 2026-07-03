import Link from "next/link";
import { CompanyPage } from "@/app/_lib/layout/CompanyPage";
import { listJobs } from "@/app/_lib/api/endpoints/jobs";
import { Badge } from "@/app/_lib/design-system/Badge";
import { getJobStatusStyle } from "@/app/_lib/design-system/status-map";

export default async function VagasPage() {
  const { data: jobs, total } = await listJobs(1, 50);
  const activeCount = jobs.filter((j) => j.status === "ACTIVE").length;

  return (
    <CompanyPage active="vagas">
      <div className="mx-auto max-w-[1200px] px-10 pb-14 pt-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="mb-1 text-[26px] font-extrabold tracking-tight">Vagas</h1>
            <p className="text-sm text-text-secondary">
              Seu agente de IA está triando candidatos em segundo plano.
            </p>
          </div>
          <Link
            href="/empresa/vagas/nova"
            className="flex h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(79,70,229,0.28)]"
          >
            + Nova Vaga
          </Link>
        </div>

        <div className="mb-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="text-[30px] font-extrabold tracking-tight">{activeCount}</div>
            <div className="mt-1 text-[12.5px] font-medium text-text-secondary">
              Vagas ativas
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="text-[30px] font-extrabold tracking-tight">{total}</div>
            <div className="mt-1 text-[12.5px] font-medium text-text-secondary">
              Total de vagas
            </div>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
            <p className="mb-4 text-sm text-text-secondary">Nenhuma vaga cadastrada ainda.</p>
            <Link
              href="/empresa/vagas/nova"
              className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-white"
            >
              Criar a primeira vaga
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => {
              const style = getJobStatusStyle(job.status);
              return (
                <div
                  key={job.id}
                  className="flex flex-col rounded-2xl border border-border bg-white p-5.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                  <div className="mb-3.5 flex items-center justify-between">
                    <Badge {...style} />
                    {job.status === "ACTIVE" && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ai-accent">
                        <span className="h-1.5 w-1.5 rounded-full bg-ai-accent" />
                        Agente IA ativo
                      </span>
                    )}
                  </div>
                  <h3 className="mb-0.5 text-[16.5px] font-bold tracking-tight">{job.title}</h3>
                  <p className="mb-4.5 line-clamp-2 text-[13px] text-text-muted">
                    {job.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                    <Link
                      href={`/empresa/vagas/${job.id}`}
                      className="text-[13px] font-semibold text-text-secondary"
                    >
                      Editar
                    </Link>
                    <Link
                      href={`/empresa/vagas/${job.id}/funil`}
                      className="text-[13px] font-bold text-primary"
                    >
                      Ver funil →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <footer className="border-t border-slate-100 px-10 py-5.5 text-center text-xs text-text-muted">
        © 2026 Convoca · Suporte
      </footer>
    </CompanyPage>
  );
}
