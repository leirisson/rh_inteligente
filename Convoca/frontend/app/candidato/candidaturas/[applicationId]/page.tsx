import { CandidatePage } from "@/app/_lib/layout/CandidatePage";
import { CandidateShell } from "@/app/_lib/layout/CandidateShell";
import { MockDataBanner } from "@/app/_lib/design-system/MockDataBanner";
import { getMockCandidateProfile } from "@/app/_lib/mock/screening-conversation";

export default async function CandidatoConversaPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;

  return (
    <CandidatePage>
      {async () => {
        const profile = await getMockCandidateProfile(applicationId);

        return (
          <CandidateShell title={profile.jobTitle} backHref="/candidato/candidaturas">
            <MockDataBanner note="leitura de conversa pelo candidato" />
            <div className="flex flex-col gap-2.5 rounded-2xl bg-ai-accent-bg p-4">
              {profile.chat.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.sender === "AGENT" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                      m.sender === "AGENT"
                        ? "rounded-2xl rounded-bl-md bg-white text-violet-900"
                        : "rounded-2xl rounded-br-md bg-primary text-white"
                    }`}
                  >
                    {m.text}
                    <div
                      className={`mt-1 text-right text-[9.5px] ${
                        m.sender === "AGENT" ? "text-violet-300" : "text-indigo-200"
                      }`}
                    >
                      {m.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CandidateShell>
        );
      }}
    </CandidatePage>
  );
}
