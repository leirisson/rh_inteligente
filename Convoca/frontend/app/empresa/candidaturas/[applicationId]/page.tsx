import { CompanyPage } from "@/app/_lib/layout/CompanyPage";
import { MockDataBanner } from "@/app/_lib/design-system/MockDataBanner";
import { Button } from "@/app/_lib/design-system/Button";
import { getMockCandidateProfile } from "@/app/_lib/mock/screening-conversation";
import { ScheduleInterviewButton } from "./ScheduleInterviewButton";
import { BackLink } from "./BackLink";

export default async function CandidaturaDetalhePage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  const profile = await getMockCandidateProfile(applicationId);

  return (
    <CompanyPage active="candidatos">
      <div className="border-b border-slate-100 px-8 pb-3 pt-5.5">
        <BackLink />
        <MockDataBanner note="conversa e respostas de triagem" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF2FF] text-sm font-bold text-primary">
              {profile.initials}
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">{profile.candidateName}</h1>
              <span className="text-[12.5px] text-text-secondary">{profile.jobTitle}</span>
            </div>
          </div>
          <div className="flex gap-2.5">
            <Button variant="danger" size="sm">
              Reprovar
            </Button>
            <Button variant="secondary" size="sm">
              Aprovar manualmente
            </Button>
            <ScheduleInterviewButton
              applicationId={applicationId}
              candidateName={profile.candidateName}
              jobTitle={profile.jobTitle}
              matchScore={profile.matchScore}
              channel={profile.channel}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5.5 px-8 pb-12 pt-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-border bg-white p-5.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="mb-4.5 flex items-center gap-2 border-b border-slate-100 pb-3.5">
            <span className="text-[15px]">🤖</span>
            <span className="text-[13px] font-bold text-violet-700">
              Conversa conduzida pelo Agente Convoca
            </span>
          </div>
          {profile.chat.map((m, i) => (
            <div
              key={i}
              className={`mb-3.5 flex flex-col ${m.sender === "AGENT" ? "items-start" : "items-end"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                  m.sender === "AGENT"
                    ? "bg-ai-accent-bg text-violet-900"
                    : "border border-border bg-white text-text"
                }`}
              >
                {m.text}
              </div>
              <span className="mt-1 text-[10.5px] text-text-muted">{m.time}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <h3 className="mb-3.5 text-sm font-bold">Perfil</h3>
            <div className="space-y-2.5 text-[13px]">
              <div className="flex justify-between">
                <span className="text-text-muted">E-mail</span>
                <span className="font-semibold">{profile.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Telefone</span>
                <span className="font-semibold">{profile.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Canal</span>
                <span className="font-semibold text-success">{profile.channel}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <h3 className="mb-2 text-sm font-bold">Score de matching</h3>
            <div className="mb-3 flex items-baseline gap-1.5">
              <span className="text-[32px] font-extrabold tracking-tight text-primary">
                {profile.matchScore}%
              </span>
              <span className="text-xs text-text-muted">compatível</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#EEF2FF]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-primary"
                style={{ width: `${profile.matchScore}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <h3 className="mb-3.5 text-sm font-bold">Respostas da triagem</h3>
            {profile.answers.map((a, i) => (
              <div key={i} className="mb-3.5 last:mb-0">
                <div className="mb-1 flex items-start gap-1.5">
                  <span className="mt-px">{a.adequate ? "✅" : "⚠️"}</span>
                  <span className="text-[12.5px] font-semibold leading-tight">{a.question}</span>
                </div>
                <p className="ml-6 text-[12.5px] leading-relaxed text-text-secondary">
                  {a.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CompanyPage>
  );
}
