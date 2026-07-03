"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/app/_lib/design-system/Button";
import type { IntegrationStatus, CompanyUser } from "@/app/_lib/api/types";
import { connectWhatsAppAction, disconnectWhatsAppAction } from "./actions";

interface Props {
  initialStatus: IntegrationStatus;
  initialPhone: string | null;
  user: CompanyUser;
}

export function WhatsAppPanel({ initialStatus, initialPhone, user }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [phone, setPhone] = useState(initialPhone);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const canManage = user.role === "TENANT_ADMIN";

  useEffect(() => {
    if (status !== "CONNECTING") return;
    const interval = setInterval(async () => {
      const res = await fetch("/api/whatsapp-status", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { status: IntegrationStatus; connectedPhoneNumber: string | null };
      setStatus(data.status);
      setPhone(data.connectedPhoneNumber);
    }, 3000);
    return () => clearInterval(interval);
  }, [status]);

  function handleConnect() {
    startTransition(async () => {
      const result = await connectWhatsAppAction();
      setStatus(result.status);
      setQrCode(result.qrCode);
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      await disconnectWhatsAppAction();
      setStatus("DISCONNECTED");
      setPhone(null);
      setQrCode(null);
    });
  }

  if (status === "CONNECTED") {
    return (
      <div className="mb-5 flex items-center justify-between rounded-2xl border border-border bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-4">
          <div className="flex h-13 w-13 items-center justify-center rounded-full bg-success-bg">
            <span className="h-4 w-4 rounded-full bg-success" />
          </div>
          <div>
            <span className="text-[17px] font-extrabold">Conectado</span>
            <div className="mt-0.5 text-[13.5px] text-text-secondary">
              Número: <strong className="text-text">{phone ?? "—"}</strong>
            </div>
          </div>
        </div>
        {canManage && (
          <Button variant="danger" size="sm" onClick={handleDisconnect} loading={pending}>
            Desconectar
          </Button>
        )}
      </div>
    );
  }

  if (status === "CONNECTING") {
    return (
      <div className="mb-5 flex flex-col items-center rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-[0_8px_30px_rgba(245,158,11,0.12)]">
        <div className="mb-4.5 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-warning" />
          <span className="text-base font-extrabold text-amber-700">Aguardando conexão</span>
        </div>
        {qrCode ? (
          <img src={qrCode} alt="QR Code do WhatsApp" className="mb-4.5 h-45 w-45 rounded-xl" />
        ) : (
          <div className="mb-4.5 flex h-45 w-45 items-center justify-center rounded-xl bg-slate-100 text-xs text-text-muted">
            Gerando QR code…
          </div>
        )}
        <p className="mb-1.5 max-w-xs text-sm font-semibold leading-relaxed">
          Abra o WhatsApp no celular da empresa → Aparelhos conectados → Escanear código
        </p>
        <p className="max-w-xs text-[12.5px] text-text-muted">
          Isso pode levar alguns instantes para refletir após escanear.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-5 flex flex-col items-center rounded-2xl border border-border bg-white p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="mb-3.5 flex h-13 w-13 items-center justify-center rounded-full bg-slate-100">
        <span className="h-4 w-4 rounded-full bg-slate-400" />
      </div>
      {status === "ERROR" ? (
        <>
          <div className="mb-1 text-base font-extrabold text-danger">Conexão perdida</div>
          <p className="mb-4.5 max-w-sm text-[13.5px] text-red-700">
            A sessão caiu de forma anômala. Reinicie o fluxo de conexão para retomar a triagem
            automática.
          </p>
        </>
      ) : (
        <>
          <div className="mb-1 text-base font-extrabold">Nenhuma conexão ativa</div>
          <p className="mb-4.5 max-w-sm text-[13.5px] text-text-secondary">
            Conecte um número de WhatsApp para que o agente de IA comece a triar candidatos.
          </p>
        </>
      )}
      {canManage && (
        <Button onClick={handleConnect} loading={pending}>
          Conectar WhatsApp
        </Button>
      )}
    </div>
  );
}
