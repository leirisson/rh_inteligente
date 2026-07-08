import { CompanyPage } from "@/app/_lib/layout/CompanyPage";
import { MockDataBanner } from "@/app/_lib/design-system/MockDataBanner";
import { getMockInterviews } from "@/app/_lib/mock/interviews-list";
import { InterviewsCalendarView } from "./InterviewsCalendarView";

export default async function EntrevistasPage() {
  const interviews = await getMockInterviews();

  return (
    <CompanyPage active="entrevistas">
      <div className="w-full px-10 pb-14 pt-8">
        <h1 className="mb-3 text-[26px] font-extrabold tracking-tight">Entrevistas</h1>
        <MockDataBanner note="listagem consolidada de entrevistas" />

        <InterviewsCalendarView interviews={interviews} />
      </div>
    </CompanyPage>
  );
}
