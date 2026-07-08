import { CandidatePage } from "@/app/_lib/layout/CandidatePage";
import { CandidateShell } from "@/app/_lib/layout/CandidateShell";
import { getMe, listContactMethods, getMyResume } from "@/app/_lib/api/endpoints/candidates";
import { Input, Textarea, Select } from "@/app/_lib/design-system/Input";
import { Button } from "@/app/_lib/design-system/Button";
import {
  updateProfileAction,
  addContactMethodAction,
  removeContactMethodAction,
  addWorkExperienceAction,
  removeWorkExperienceAction,
  addEducationAction,
  removeEducationAction,
  addSkillAction,
  removeSkillAction,
  addLanguageAction,
  removeLanguageAction,
} from "./actions";

const channelMeta: Record<string, { label: string; icon: string; bg: string }> = {
  WHATSAPP: { label: "WhatsApp", icon: "💬", bg: "#ECFDF5" },
  EMAIL: { label: "E-mail", icon: "✉️", bg: "#EEF2FF" },
};

const proficiencyLabel: Record<string, string> = {
  BASIC: "Básico",
  INTERMEDIATE: "Intermediário",
  ADVANCED: "Avançado",
  FLUENT: "Fluente",
  NATIVE: "Nativo",
};

function formatMonth(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 7);
}

function cardClass() {
  return "mb-3.5 rounded-2xl border border-border bg-white p-4.5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]";
}

export default async function PerfilPage() {
  return (
    <CandidatePage>
      {async () => {
        const [candidate, contactMethods, resume] = await Promise.all([
          getMe(),
          listContactMethods(),
          getMyResume(),
        ]);

        return (
          <CandidateShell title="Meu Perfil" backHref="/candidato/candidaturas">
            <form action={updateProfileAction} className={cardClass()}>
              <h3 className="mb-3.5 text-sm font-bold">Dados pessoais</h3>
              <Input
                id="name"
                name="name"
                label="Nome"
                defaultValue={candidate.name}
                required
                className="mb-3"
              />
              <p className="mb-4 text-xs text-text-muted">E-mail: {candidate.email}</p>
              <Button type="submit" className="w-full">
                Salvar alterações
              </Button>
            </form>

            <div className={cardClass()}>
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

            <div className={cardClass()}>
              <h3 className="mb-1 text-sm font-bold">Experiências profissionais</h3>
              <p className="mb-3.5 text-xs leading-relaxed text-text-secondary">
                Usadas para o agente encontrar as vagas mais compatíveis com você.
              </p>

              <ul className="mb-3 space-y-2.5">
                {resume.workExperiences.map((we) => (
                  <li key={we.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-semibold">
                          {we.role} — {we.company}
                        </div>
                        <div className="text-[11px] text-text-muted">
                          {formatMonth(we.startDate)} a{" "}
                          {we.isCurrent ? "atual" : formatMonth(we.endDate)}
                        </div>
                        {we.description && (
                          <p className="mt-1 text-xs text-text-secondary">{we.description}</p>
                        )}
                      </div>
                      <form action={removeWorkExperienceAction.bind(null, we.id)}>
                        <button
                          type="submit"
                          className="text-lg text-text-muted"
                          aria-label="Remover"
                        >
                          ×
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>

              <form
                action={addWorkExperienceAction}
                className="space-y-2.5 rounded-xl border border-dashed border-border p-3"
              >
                <Input name="company" placeholder="Empresa" required className="mb-0" />
                <Input name="role" placeholder="Cargo" required className="mb-0" />
                <Textarea name="description" placeholder="Descrição das atividades" className="mb-0 h-16" />
                <div className="flex gap-2.5">
                  <Input type="date" name="startDate" label="Início" required className="mb-0 flex-1" />
                  <Input type="date" name="endDate" label="Fim" className="mb-0 flex-1" />
                </div>
                <label className="flex items-center gap-2 text-xs text-text-secondary">
                  <input type="checkbox" name="isCurrent" />
                  Emprego atual
                </label>
                <Button type="submit" variant="secondary" size="sm" className="w-full">
                  + Adicionar experiência
                </Button>
              </form>
            </div>

            <div className={cardClass()}>
              <h3 className="mb-1 text-sm font-bold">Formação acadêmica</h3>

              <ul className="mb-3 space-y-2.5">
                {resume.educations.map((edu) => (
                  <li key={edu.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-semibold">
                          {edu.level} em {edu.course}
                        </div>
                        <div className="text-[11px] text-text-muted">{edu.institution}</div>
                        <div className="text-[11px] text-text-muted">
                          {formatMonth(edu.startDate)} a{" "}
                          {edu.isCurrent ? "atual" : formatMonth(edu.endDate)}
                        </div>
                      </div>
                      <form action={removeEducationAction.bind(null, edu.id)}>
                        <button
                          type="submit"
                          className="text-lg text-text-muted"
                          aria-label="Remover"
                        >
                          ×
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>

              <form
                action={addEducationAction}
                className="space-y-2.5 rounded-xl border border-dashed border-border p-3"
              >
                <Input name="institution" placeholder="Instituição" required className="mb-0" />
                <Input name="course" placeholder="Curso" required className="mb-0" />
                <Select name="level" defaultValue="" required className="mb-0">
                  <option value="" disabled>
                    Nível
                  </option>
                  <option value="Ensino Médio">Ensino Médio</option>
                  <option value="Graduação">Graduação</option>
                  <option value="Pós-graduação">Pós-graduação</option>
                  <option value="Mestrado">Mestrado</option>
                  <option value="Doutorado">Doutorado</option>
                </Select>
                <div className="flex gap-2.5">
                  <Input type="date" name="startDate" label="Início" required className="mb-0 flex-1" />
                  <Input type="date" name="endDate" label="Fim" className="mb-0 flex-1" />
                </div>
                <label className="flex items-center gap-2 text-xs text-text-secondary">
                  <input type="checkbox" name="isCurrent" />
                  Cursando atualmente
                </label>
                <Button type="submit" variant="secondary" size="sm" className="w-full">
                  + Adicionar formação
                </Button>
              </form>
            </div>

            <div className={cardClass()}>
              <h3 className="mb-3.5 text-sm font-bold">Habilidades</h3>

              <ul className="mb-3 flex flex-wrap gap-2">
                {resume.skills.map((skill) => (
                  <li
                    key={skill.id}
                    className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold"
                  >
                    {skill.name}
                    <form action={removeSkillAction.bind(null, skill.id)}>
                      <button type="submit" className="text-text-muted" aria-label="Remover">
                        ×
                      </button>
                    </form>
                  </li>
                ))}
              </ul>

              <form action={addSkillAction} className="flex gap-2.5">
                <input
                  type="text"
                  name="name"
                  placeholder="Ex: TypeScript"
                  required
                  className="h-10 flex-1 rounded-lg border border-border px-3 text-sm outline-none focus:border-primary"
                />
                <Button type="submit" variant="secondary" size="sm">
                  Adicionar
                </Button>
              </form>
            </div>

            <div className={cardClass()}>
              <h3 className="mb-3.5 text-sm font-bold">Idiomas</h3>

              <ul className="mb-3 space-y-2.5">
                {resume.languages.map((language) => (
                  <li
                    key={language.id}
                    className="flex items-center justify-between gap-2.5 rounded-xl border border-border p-2.5"
                  >
                    <div className="text-[13.5px] font-semibold">
                      {language.name}{" "}
                      <span className="font-normal text-text-muted">
                        ({proficiencyLabel[language.proficiency]})
                      </span>
                    </div>
                    <form action={removeLanguageAction.bind(null, language.id)}>
                      <button type="submit" className="text-lg text-text-muted" aria-label="Remover">
                        ×
                      </button>
                    </form>
                  </li>
                ))}
              </ul>

              <form
                action={addLanguageAction}
                className="space-y-2.5 rounded-xl border border-dashed border-border p-3"
              >
                <input
                  type="text"
                  name="name"
                  placeholder="Ex: Inglês"
                  required
                  className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary"
                />
                <Select name="proficiency" defaultValue="INTERMEDIATE">
                  <option value="BASIC">Básico</option>
                  <option value="INTERMEDIATE">Intermediário</option>
                  <option value="ADVANCED">Avançado</option>
                  <option value="FLUENT">Fluente</option>
                  <option value="NATIVE">Nativo</option>
                </Select>
                <Button type="submit" variant="secondary" size="sm" className="w-full">
                  + Adicionar idioma
                </Button>
              </form>
            </div>
          </CandidateShell>
        );
      }}
    </CandidatePage>
  );
}
