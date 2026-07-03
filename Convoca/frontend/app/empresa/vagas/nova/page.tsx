import Link from "next/link";
import { CompanyPage } from "@/app/_lib/layout/CompanyPage";
import { Input, Textarea } from "@/app/_lib/design-system/Input";
import { Button } from "@/app/_lib/design-system/Button";
import { createJobAction } from "./actions";

export default function NovaVagaPage() {
  return (
    <CompanyPage active="vagas">
      <div className="mx-auto max-w-[720px] px-10 pb-28 pt-7">
        <div className="mb-1.5 text-[13px] font-semibold text-text-muted">
          <Link href="/empresa/vagas">Vagas</Link> / <span className="text-primary">Nova Vaga</span>
        </div>
        <h1 className="mb-5.5 text-2xl font-extrabold tracking-tight">Criar vaga</h1>

        <div className="mb-5.5 inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-ai-accent-bg px-3.5 py-2.5">
          <span className="text-[15px]">🤖</span>
          <span className="text-[13px] font-medium text-violet-700">
            Após criar a vaga, você poderá adicionar requisitos (usados no matching semântico) e
            perguntas de triagem.
          </span>
        </div>

        <form
          action={createJobAction}
          className="rounded-2xl border border-border bg-white p-6.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        >
          <h3 className="mb-4.5 text-[15px] font-bold">Informações da vaga</h3>
          <Input id="title" name="title" label="Título" required className="mb-4" />
          <Textarea
            id="description"
            name="description"
            label="Descrição"
            required
            className="h-28"
          />
          <div className="mt-6 flex justify-end">
            <Button type="submit">Criar vaga e continuar</Button>
          </div>
        </form>
      </div>
    </CompanyPage>
  );
}
