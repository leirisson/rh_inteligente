import { CompanyPage } from "@/app/_lib/layout/CompanyPage";
import { MockDataBanner } from "@/app/_lib/design-system/MockDataBanner";
import { Badge } from "@/app/_lib/design-system/Badge";
import { getInterviewStatusStyle } from "@/app/_lib/design-system/status-map";
import { getMockInterviews } from "@/app/_lib/mock/interviews-list";

export default async function EntrevistasPage() {
  const interviews = await getMockInterviews();

  return (
    <CompanyPage active="entrevistas">
      <div className="mx-auto max-w-[1040px] px-10 pb-14 pt-8">
        <h1 className="mb-3 text-[26px] font-extrabold tracking-tight">Entrevistas</h1>
        <MockDataBanner note="listagem consolidada de entrevistas" />

        <div className="space-y-3.5">
          {interviews.map((iv) => {
            const style = getInterviewStatusStyle(iv.status);
            const strike = iv.status === "CANCELLED";
            return (
              <div
                key={iv.id}
                className="rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14.5 flex-shrink-0 text-center">
                      <div className="text-[11px] font-bold uppercase text-danger">
                        {iv.month}
                      </div>
                      <div className="text-[26px] font-extrabold leading-none">{iv.day}</div>
                      <div className="text-[11.5px] font-semibold text-text-muted">
                        {iv.hour}
                      </div>
                    </div>
                    <div className="h-11 w-px bg-slate-100" />
                    <div>
                      <div
                        className={`text-[15.5px] font-bold tracking-tight ${strike ? "line-through" : ""}`}
                      >
                        {iv.candidateName}
                      </div>
                      <div className="mt-0.5 text-[13px] text-text-secondary">
                        {iv.jobTitle} · {iv.interviewer}
                      </div>
                      <div className="mt-1 text-[12.5px] font-semibold text-primary">
                        {iv.place}
                      </div>
                    </div>
                  </div>
                  <Badge {...style} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CompanyPage>
  );
}
