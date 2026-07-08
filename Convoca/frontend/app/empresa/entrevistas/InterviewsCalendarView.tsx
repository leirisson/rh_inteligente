"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/app/_lib/design-system/Badge";
import { getInterviewStatusStyle } from "@/app/_lib/design-system/status-map";
import type { InterviewListItem } from "@/app/_lib/mock/interviews-list";

const WEEKDAY_LABELS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Grade sempre com semanas completas (dom–sáb), incluindo dias de meses vizinhos. */
function buildCalendarGrid(year: number, month: number) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }
  return days;
}

interface Props {
  interviews: InterviewListItem[];
}

export function InterviewsCalendarView({ interviews }: Props) {
  const parsed = useMemo(
    () => interviews.map((iv) => ({ ...iv, dateObj: new Date(iv.date) })),
    [interviews],
  );

  const initialMonthDate = parsed[0]?.dateObj ?? new Date();
  const [cursor, setCursor] = useState({
    year: initialMonthDate.getFullYear(),
    month: initialMonthDate.getMonth(),
  });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, typeof parsed>();
    for (const iv of parsed) {
      const key = dateKey(iv.dateObj.getFullYear(), iv.dateObj.getMonth(), iv.dateObj.getDate());
      const bucket = map.get(key);
      if (bucket) {
        bucket.push(iv);
      } else {
        map.set(key, [iv]);
      }
    }
    for (const bucket of map.values()) {
      bucket.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    }
    return map;
  }, [parsed]);

  const grid = useMemo(() => buildCalendarGrid(cursor.year, cursor.month), [cursor]);
  const today = new Date();

  const selectedInterviews = selectedKey ? (byDay.get(selectedKey) ?? []) : [];
  const selectedDateLabel = selectedKey
    ? new Date(`${selectedKey}T00:00:00`).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      })
    : null;

  function goToMonth(delta: number) {
    setCursor((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
    setSelectedKey(null);
  }

  return (
    <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
      {/* Grade do calendário — lado esquerdo */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15.5px] font-extrabold tracking-tight">
            {MONTH_LABELS[cursor.month]} {cursor.year}
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => goToMonth(-1)}
              aria-label="Mês anterior"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-slate-100"
            >
              ‹
            </button>
            <button
              onClick={() => goToMonth(1)}
              aria-label="Próximo mês"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-slate-100"
            >
              ›
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="pb-1 text-center text-[10.5px] font-bold uppercase tracking-wide text-text-muted"
            >
              {label}
            </div>
          ))}

          {grid.map((date) => {
            const key = dateKey(date.getFullYear(), date.getMonth(), date.getDate());
            const dayInterviews = byDay.get(key) ?? [];
            const inCurrentMonth = date.getMonth() === cursor.month;
            const isToday = isSameDay(date, today);
            const isSelected = key === selectedKey;
            const visible = dayInterviews.slice(0, 2);
            const overflow = dayInterviews.length - visible.length;

            return (
              <button
                key={key}
                onClick={() => setSelectedKey(dayInterviews.length > 0 ? key : null)}
                disabled={dayInterviews.length === 0}
                className={`flex min-h-[84px] flex-col items-stretch rounded-xl border p-1.5 text-left transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-transparent hover:border-border hover:bg-slate-50"
                } ${dayInterviews.length === 0 ? "cursor-default" : "cursor-pointer"}`}
              >
                <span
                  className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold ${
                    isToday
                      ? "bg-primary text-white"
                      : inCurrentMonth
                        ? "text-text"
                        : "text-text-muted/50"
                  }`}
                >
                  {date.getDate()}
                </span>

                <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                  {visible.map((iv) => {
                    const style = getInterviewStatusStyle(iv.status);
                    return (
                      <span
                        key={iv.id}
                        className="truncate rounded-md px-1 py-0.5 text-[10px] font-semibold leading-tight"
                        style={{ backgroundColor: style.bg, color: style.color }}
                      >
                        {iv.hour} {iv.candidateName}
                      </span>
                    );
                  })}
                  {overflow > 0 && (
                    <span className="px-1 text-[10px] font-bold text-text-muted">
                      +{overflow} mais
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista do dia selecionado — lado direito */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {!selectedKey && (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
            <span className="mb-2 text-2xl">🗓️</span>
            <p className="text-[13px] font-semibold text-text-secondary">
              Selecione um dia com entrevista
            </p>
            <p className="mt-1 text-[12px] text-text-muted">
              Dias com entrevistas agendadas aparecem destacados na grade.
            </p>
          </div>
        )}

        {selectedKey && (
          <>
            <h3 className="mb-4 text-[15px] font-extrabold capitalize tracking-tight">
              {selectedDateLabel}
            </h3>
            <div className="space-y-3">
              {selectedInterviews.map((iv) => {
                const style = getInterviewStatusStyle(iv.status);
                const strike = iv.status === "CANCELLED";
                return (
                  <div
                    key={iv.id}
                    className="rounded-xl border border-border bg-slate-50/60 p-3.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[11.5px] font-bold text-text-secondary">
                          {iv.hour}
                        </div>
                        <div
                          className={`mt-0.5 text-[14.5px] font-bold tracking-tight ${strike ? "line-through" : ""}`}
                        >
                          {iv.candidateName}
                        </div>
                        <div className="mt-0.5 text-[12.5px] text-text-secondary">
                          {iv.jobTitle} · {iv.interviewer}
                        </div>
                        <div className="mt-1 text-[12px] font-semibold text-primary">
                          {iv.place}
                        </div>
                      </div>
                      <Badge {...style} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
