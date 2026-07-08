"use client";

import { useState, useTransition } from "react";
import { Button } from "@/app/_lib/design-system/Button";
import { Badge } from "@/app/_lib/design-system/Badge";
import { Modal } from "@/app/_lib/design-system/Modal";
import { Input, Select } from "@/app/_lib/design-system/Input";
import type { TeamMember, UserRole } from "@/app/_lib/api/types";
import { inviteTeamMemberAction, updateTeamMemberRoleAction } from "./actions";

const roleColors: Record<UserRole, { bg: string; color: string }> = {
  SUPER_ADMIN: { bg: "#F5F3FF", color: "#7C3AED" },
  TENANT_ADMIN: { bg: "#EEF2FF", color: "#4F46E5" },
  RECRUITER: { bg: "#EFF6FF", color: "#2563EB" },
  DEPARTMENT_LEAD: { bg: "#F1F5F9", color: "#475569" },
};

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  TENANT_ADMIN: "Admin",
  RECRUITER: "Recrutador(a)",
  DEPARTMENT_LEAD: "Líder de Setor",
};

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface Props {
  initialTeam: TeamMember[];
  canManage: boolean;
}

export function TeamPanel({ initialTeam, canManage }: Props) {
  const [team, setTeam] = useState(initialTeam);
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleInvite(formData: FormData) {
    setFormError(null);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const role = String(formData.get("role") ?? "RECRUITER") as UserRole;

    startTransition(async () => {
      try {
        const member = await inviteTeamMemberAction({ name, email, password, role });
        setTeam((prev) => [...prev, member]);
        setModalOpen(false);
      } catch {
        setFormError("Não foi possível convidar este membro. Verifique os dados e tente novamente.");
      }
    });
  }

  function handleRoleChange(userId: string, role: UserRole) {
    startTransition(async () => {
      const updated = await updateTeamMemberRoleAction(userId, role);
      setTeam((prev) => prev.map((m) => (m.id === userId ? updated : m)));
    });
  }

  return (
    <>
      <div className="mb-4.5 flex items-center justify-between">
        <div>
          <div className="mb-1 text-[13px] font-semibold text-text-muted">
            Configurações / Equipe
          </div>
          <h1 className="text-[22px] font-extrabold tracking-tight">Equipe</h1>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setModalOpen(true)}>
            + Convidar membro
          </Button>
        )}
      </div>

      {!canManage ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-[13.5px] text-text-secondary shadow-[0_4px_16px_rgba(15,23,42,0.08)]">
          Apenas administradores da empresa podem ver e gerenciar a equipe.
        </div>
      ) : (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.08)]">
        <div
          className="grid grid-cols-[2fr_1.4fr_1.3fr_1fr] bg-surface px-5 py-3.5 text-[11.5px] font-bold uppercase tracking-wide text-text-muted"
        >
          <span>Nome</span>
          <span>Papel</span>
          <span>Telefone</span>
          <span>Alterar papel</span>
        </div>
        {team.map((member) => {
          const style = roleColors[member.role];
          return (
            <div
              key={member.id}
              className="grid grid-cols-[2fr_1.4fr_1.3fr_1fr] items-center border-b border-slate-100 px-5 py-3.5 last:border-0"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-[#EEF2FF] text-xs font-bold text-primary">
                  {initialsFor(member.name)}
                </div>
                <div>
                  <div className="text-[13.5px] font-semibold">{member.name}</div>
                  <div className="text-xs text-text-muted">{member.email}</div>
                </div>
              </div>
              <span>
                <Badge label={roleLabels[member.role]} bg={style.bg} color={style.color} />
              </span>
              <span className="text-[13px] text-text-secondary">{member.phone ?? "—"}</span>
              <Select
                value={member.role}
                disabled={pending}
                onChange={(e) => handleRoleChange(member.id, e.target.value as UserRole)}
                className="h-9"
              >
                {Object.keys(roleLabels).map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role as UserRole]}
                  </option>
                ))}
              </Select>
            </div>
          );
        })}
      </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Convidar membro"
        subtitle="Crie um acesso para um novo integrante da equipe."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" type="submit" form="invite-form" loading={pending}>
              Convidar
            </Button>
          </>
        }
      >
        <form id="invite-form" action={handleInvite} className="flex flex-col gap-3.5">
          <Input label="Nome" name="name" required />
          <Input label="E-mail" name="email" type="email" required />
          <Input label="Senha provisória" name="password" type="password" minLength={8} required />
          <Select label="Papel" name="role" defaultValue="RECRUITER">
            {Object.keys(roleLabels).map((role) => (
              <option key={role} value={role}>
                {roleLabels[role as UserRole]}
              </option>
            ))}
          </Select>
          {formError && <span className="text-[12.5px] font-medium text-danger">{formError}</span>}
        </form>
      </Modal>
    </>
  );
}
