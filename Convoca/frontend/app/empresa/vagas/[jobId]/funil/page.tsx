import Link from "next/link";
import { CompanyPage } from "@/app/_lib/layout/CompanyPage";
import { MockDataBanner } from "@/app/_lib/design-system/MockDataBanner";
import { getJob } from "@/app/_lib/api/endpoints/jobs";
import { getJobStatusStyle } from "@/app/_lib/design-system/status-map";
import { Badge } from "@/app/_lib/design-system/Badge";
import { getMockFunnelBoard } from "@/app/_lib/mock/funnel";

export default async function FunilPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const [job, columns] = await Promise.all([getJob(jobId), getMockFunnelBoard()]);
  const style = getJobStatusStyle(job.status);
  const total = columns.reduce((sum, col) => sum + col.cards.length, 0);

  return (
    <CompanyPage active="candidatos">
      <div className="px-8 pb-3.5 pt-6.5">
        <div className="mb-2 text-[13px] font-semibold text-text-muted">
          <Link href="/empresa/vagas">Vagas</Link> / {job.title} / Funil
        </div>
        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-[23px] font-extrabold tracking-tight">{job.title}</h1>
          <Badge {...style} />
        </div>
        <MockDataBanner note="lista de candidatos por vaga" />
        <p className="text-[13.5px] font-medium text-text-secondary">
          {total} candidaturas no total (dados de exemplo)
        </p>
      </div>

      <div className="overflow-x-auto px-8 pb-10 pt-1.5">
        <div className="flex min-w-min gap-4">
          {columns.map((col) => (
            <div key={col.title} className="w-[266px] flex-shrink-0 rounded-[14px] bg-slate-100 p-3">
              <div className="flex items-center justify-between px-1.5 pb-3 pt-1">
                <span className="text-[13px] font-bold text-slate-700">{col.title}</span>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[11.5px] font-bold text-text-secondary">
                  {col.cards.length}
                </span>
              </div>
              {col.cards.map((card) => (
                <Link
                  key={card.applicationId}
                  href={`/empresa/candidaturas/${card.applicationId}`}
                  className="mb-2.5 block rounded-xl border border-border bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                  <div className="mb-3 flex items-center gap-2.5">
                    <div
                      className="flex h-8.5 w-8.5 flex-shrink-0 items-center justify-center rounded-full text-[12.5px] font-bold"
                      style={{ backgroundColor: card.avBg, color: card.avColor }}
                    >
                      {card.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13.5px] font-bold">{card.name}</div>
                      <div className="text-[11.5px] text-text-muted">há {card.time}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11.5px] font-bold"
                      style={{
                        backgroundColor: card.match >= 80 ? "#ECFDF5" : "#EEF2FF",
                        color: card.match >= 80 ? "#059669" : "#4F46E5",
                      }}
                    >
                      {card.match}% match
                    </span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-xs">
                      {card.channel === "whatsapp" ? "💬" : "✉️"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </CompanyPage>
  );
}
