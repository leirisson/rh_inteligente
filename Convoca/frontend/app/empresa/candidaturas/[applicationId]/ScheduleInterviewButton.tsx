"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/app/_lib/design-system/Modal";
import { Button } from "@/app/_lib/design-system/Button";
import { Input, Select, Textarea } from "@/app/_lib/design-system/Input";
import { scheduleInterviewAction } from "./actions";

export function ScheduleInterviewButton({
  applicationId,
  candidateName,
  jobTitle,
  matchScore,
  channel,
}: {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  matchScore: number;
  channel: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const date = String(formData.get("date"));
      const time = String(formData.get("time"));
      const location = String(formData.get("location") ?? "").trim();
      const notes = String(formData.get("notes") ?? "").trim();

      if (!location) {
        setError("Informe o local ou link da entrevista.");
        return;
      }

      try {
        await scheduleInterviewAction(applicationId, {
          scheduledAt: new Date(`${date}T${time}`).toISOString(),
          location,
          notes: notes || undefined,
        });
        setSuccess(true);
        setTimeout(() => setOpen(false), 1200);
      } catch {
        setError(
          "Não foi possível agendar (esta candidatura é um exemplo e pode não existir no backend).",
        );
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Agendar entrevista</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Agendar entrevista"
        subtitle={candidateName}
      >
        <div className="mb-4.5 flex gap-5.5 rounded-xl bg-surface p-3.5">
          <div>
            <div className="text-[11px] font-semibold text-text-muted">Vaga</div>
            <div className="text-[13px] font-bold">{jobTitle}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-text-muted">Match</div>
            <div className="text-[13px] font-bold text-primary">{matchScore}%</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-text-muted">Canal preferido</div>
            <div className="text-[13px] font-bold text-success">{channel}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3.5">
            <Input id="date" name="date" type="date" label="Data" required />
            <Input id="time" name="time" type="time" label="Horário" required />
          </div>
          <Select id="interviewer" name="interviewer" label="Entrevistador responsável">
            <option>Rafael Alves</option>
            <option>Juliana Mendes</option>
          </Select>
          <Input
            id="location"
            name="location"
            label="Local / link da videochamada"
            placeholder="https://meet.google.com/..."
          />
          <Textarea
            id="notes"
            name="notes"
            label="Observações (opcional)"
            className="h-20"
          />
          {error && <p className="text-[12.5px] font-medium text-danger">{error}</p>}
          {success && (
            <p className="text-[12.5px] font-medium text-success">Entrevista agendada!</p>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={pending}>
              Confirmar agendamento
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
