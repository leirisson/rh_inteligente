import { CandidatePage } from "@/app/_lib/layout/CandidatePage";
import { CandidateShell } from "@/app/_lib/layout/CandidateShell";
import { getMe, listContactMethods } from "@/app/_lib/api/endpoints/candidates";
import { Input, Textarea, Select } from "@/app/_lib/design-system/Input";
import { Button } from "@/app/_lib/design-system/Button";
import { updateProfileAction, addContactMethodAction, removeContactMethodAction } from "./actions";

const channelMeta: Record<string, { label: string; icon: string; bg: string }> = {
  WHATSAPP: { label: "WhatsApp", icon: "💬", bg: "#ECFDF5" },
  EMAIL: { label: "E-mail", icon: "✉️", bg: "#EEF2FF" },
};

export default async function PerfilPage() {
  return (
    <CandidatePage>
      {async () => {
        const [candidate, contactMethods] = await Promise.all([getMe(), listContactMethods()]);

        return (
          <CandidateShell title="Meu Perfil" backHref="/candidato/candidaturas">
            <form
              action={updateProfileAction}
              className="mb-3.5 rounded-2xl border border-border bg-white p-4.5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]"
            >
              <h3 className="mb-3.5 text-sm font-bold">Dados pessoais</h3>
              <Input
                id="name"
                name="name"
                label="Nome"
                defaultValue={candidate.name}
                required
                className="mb-3"
              />
              <p className="mb-3 text-xs text-text-muted">E-mail: {candidate.email}</p>
              <Textarea
                id="resumeText"
                name="resumeText"
                label="Currículo / experiência"
                defaultValue={candidate.resumeText ?? ""}
                className="mb-4 h-24"
              />
              <Button type="submit" className="w-full">
                Salvar alterações
              </Button>
            </form>

            <div className="rounded-2xl border border-border bg-white p-4.5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
              <h3 className="mb-1 text-sm font-bold">Métodos de contato</h3>
              <p className="mb-3.5 text-xs leading-relaxed text-text-secondary">
                Cadastre ao menos um método para que o agente possa falar com você.
              </p>

              <ul className="mb-3 space-y-2.5">
                {contactMethods.map((cm) => {
                  const meta = channelMeta[cm.channel];
                  return (
                    <li
                      key={cm.id}
                      className="flex items-center gap-2.5 rounded-xl border border-border p-2.5"
                    >
                      <span
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[15px]"
                        style={{ backgroundColor: meta.bg }}
                      >
                        {meta.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold text-text-muted">
                          {meta.label}
                        </div>
                        <div className="truncate text-[13.5px] font-semibold">{cm.value}</div>
                      </div>
                      <form action={removeContactMethodAction.bind(null, cm.id)}>
                        <button
                          type="submit"
                          className="text-lg text-text-muted"
                          aria-label="Remover"
                        >
                          ×
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>

              <form
                action={addContactMethodAction}
                className="space-y-2.5 rounded-xl border border-dashed border-border p-3"
              >
                <Select id="channel" name="channel" defaultValue="WHATSAPP">
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EMAIL">E-mail</option>
                </Select>
                <input
                  type="text"
                  name="value"
                  placeholder="Número ou e-mail"
                  required
                  className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary"
                />
                <Button type="submit" variant="secondary" size="sm" className="w-full">
                  + Adicionar método de contato
                </Button>
              </form>
            </div>
          </CandidateShell>
        );
      }}
    </CandidatePage>
  );
}
