import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanyPage } from "@/app/_lib/layout/CompanyPage";
import { getJob } from "@/app/_lib/api/endpoints/jobs";
import { listJobRequirements } from "@/app/_lib/api/endpoints/job-requirements";
import { listScreeningQuestions } from "@/app/_lib/api/endpoints/screening-questions";
import { ApiError } from "@/app/_lib/api/client";
import { Input, Textarea } from "@/app/_lib/design-system/Input";
import { Button } from "@/app/_lib/design-system/Button";
import { Badge } from "@/app/_lib/design-system/Badge";
import { getJobStatusStyle } from "@/app/_lib/design-system/status-map";
import {
  updateJobDetailsAction,
  publishJobAction,
  setJobStatusAction,
  addRequirementAction,
  removeRequirementAction,
  addScreeningQuestionAction,
  removeScreeningQuestionAction,
} from "./actions";

export default async function EditarVagaPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  let job, requirements, questions;
  try {
    [job, requirements, questions] = await Promise.all([
      getJob(jobId),
      listJobRequirements(jobId),
      listScreeningQuestions(jobId),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const style = getJobStatusStyle(job.status);
  const nextOrder = questions.length > 0 ? Math.max(...questions.map((q) => q.order)) + 1 : 0;

  return (
    <CompanyPage active="vagas">
      <div className="mx-auto max-w-[840px] px-10 pb-28 pt-7">
        <div className="mb-1.5 text-[13px] font-semibold text-text-muted">
          <Link href="/empresa/vagas">Vagas</Link> /{" "}
          <span className="text-primary">{job.title}</span>
        </div>
        <div className="mb-5.5 flex items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight">{job.title}</h1>
          <Badge {...style} />
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {job.status === "DRAFT" && (
            <form action={publishJobAction.bind(null, jobId)}>
              <Button type="submit" size="sm">
                Publicar vaga
              </Button>
            </form>
          )}
          {job.status === "ACTIVE" && (
            <form action={setJobStatusAction.bind(null, jobId, "PAUSED")}>
              <Button type="submit" variant="secondary" size="sm">
                Pausar vaga
              </Button>
            </form>
          )}
          {job.status === "PAUSED" && (
            <form action={setJobStatusAction.bind(null, jobId, "ACTIVE")}>
              <Button type="submit" size="sm">
                Reativar vaga
              </Button>
            </form>
          )}
          {job.status !== "CLOSED" && (
            <form action={setJobStatusAction.bind(null, jobId, "CLOSED")}>
              <Button type="submit" variant="danger" size="sm">
                Encerrar vaga
              </Button>
            </form>
          )}
          <Link href={`/empresa/vagas/${jobId}/funil`}>
            <Button type="button" variant="secondary" size="sm">
              Ver funil →
            </Button>
          </Link>
        </div>

        {/* Informações */}
        <form
          action={updateJobDetailsAction.bind(null, jobId)}
          className="mb-4.5 rounded-2xl border border-border bg-white p-6.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        >
          <h3 className="mb-4.5 text-[15px] font-bold">Informações da vaga</h3>
          <Input
            id="title"
            name="title"
            label="Título"
            defaultValue={job.title}
            required
            className="mb-4"
          />
          <Textarea
            id="description"
            name="description"
            label="Descrição"
            defaultValue={job.description}
            required
            className="h-24"
          />
          <div className="mt-4 flex justify-end">
            <Button type="submit" variant="secondary" size="sm">
              Salvar alterações
            </Button>
          </div>
        </form>

        {/* Requisitos */}
        <div className="mb-4.5 rounded-2xl border border-border bg-white p-6.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-bold">Requisitos</h3>
            <span className="text-xs font-semibold text-ai-accent">🤖 usados no matching</span>
          </div>
          <ul className="mb-3 space-y-2.5">
            {requirements.map((req) => (
              <li key={req.id} className="flex items-center gap-2.5">
                <span className="flex-1 rounded-xl border border-border px-3.5 py-2.5 text-sm">
                  {req.text}
                </span>
                <form action={removeRequirementAction.bind(null, jobId, req.id)}>
                  <button
                    type="submit"
                    className="flex h-9.5 w-9.5 items-center justify-center rounded-[10px] border border-border text-text-muted"
                    aria-label="Remover"
                  >
                    ×
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <form action={addRequirementAction.bind(null, jobId)} className="flex gap-2.5">
            <input
              type="text"
              name="text"
              placeholder="Ex: 3+ anos com Node.js"
              required
              className="h-10.5 flex-1 rounded-xl border border-border px-3.5 text-sm outline-none focus:border-primary"
            />
            <Button type="submit" variant="secondary" size="sm">
              + Adicionar
            </Button>
          </form>
        </div>

        {/* Perguntas de triagem */}
        <div className="rounded-2xl border border-border bg-white p-6.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <h3 className="mb-1 text-[15px] font-bold">Perguntas de triagem</h3>
          <p className="mb-4.5 text-[13px] text-text-secondary">
            O agente fará estas perguntas ao candidato via WhatsApp.
          </p>
          <ul className="mb-4 space-y-2.5">
            {questions.map((q) => (
              <li key={q.id} className="rounded-xl border border-border p-3.5">
                <div className="flex items-center justify-between gap-2.5">
                  <span className="text-sm font-medium">{q.question}</span>
                  <form action={removeScreeningQuestionAction.bind(null, jobId, q.id)}>
                    <button
                      type="submit"
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border text-text-muted"
                      aria-label="Remover"
                    >
                      ×
                    </button>
                  </form>
                </div>
                {q.expectedAnswer && (
                  <p className="mt-2 rounded-lg bg-ai-accent-bg px-3 py-1.5 text-[12.5px] text-violet-700">
                    Resposta esperada: {q.expectedAnswer}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <form
            action={addScreeningQuestionAction.bind(null, jobId, nextOrder)}
            className="space-y-2.5 rounded-xl border border-dashed border-border p-3.5"
          >
            <input
              type="text"
              name="question"
              placeholder="Pergunta"
              required
              className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary"
            />
            <input
              type="text"
              name="expectedAnswer"
              placeholder="Resposta-modelo (opcional)"
              className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary"
            />
            <Button type="submit" variant="secondary" size="sm">
              + Adicionar pergunta
            </Button>
          </form>
        </div>
      </div>
    </CompanyPage>
  );
}
