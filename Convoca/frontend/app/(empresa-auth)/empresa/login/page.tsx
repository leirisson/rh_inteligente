"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginCompanyAction, type CompanyLoginState } from "@/app/_lib/auth/actions";
import { Input } from "@/app/_lib/design-system/Input";
import { Button } from "@/app/_lib/design-system/Button";

const initialState: CompanyLoginState = {};

export default function EmpresaLoginPage() {
  const [state, formAction, pending] = useActionState(loginCompanyAction, initialState);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-[radial-gradient(120%_90%_at_80%_-10%,#EEF2FF_0%,#F8FAFC_45%)] px-6 py-10">
      <div className="w-full max-w-[420px]">
        <div className="rounded-[20px] border border-border bg-white p-9 shadow-[0_12px_40px_rgba(15,23,42,0.1)]">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[13px] bg-[#EEF2FF]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4F46E5"
              strokeWidth="1.8"
            >
              <rect x="3" y="8" width="18" height="12" rx="2" />
              <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <h2 className="mb-1.5 text-[23px] font-extrabold tracking-tight">
            Entrar como empresa
          </h2>
          <p className="mb-6 text-sm text-text-secondary">
            Acesse o painel da sua equipe de recrutamento.
          </p>

          <form action={formAction} className="space-y-4">
            <Input
              id="email"
              name="email"
              type="email"
              label="E-mail corporativo"
              placeholder="voce@empresa.com.br"
              required
            />
            <Input
              id="password"
              name="password"
              type="password"
              label="Senha"
              placeholder="••••••••"
              required
            />

            {state.error && (
              <p className="text-[13px] font-medium text-danger">{state.error}</p>
            )}

            <Button type="submit" className="w-full" loading={pending}>
              Entrar
            </Button>
          </form>

          <div className="mt-4.5 text-center">
            <Link href="/" className="text-[13.5px] font-semibold text-text-secondary">
              ← Voltar
            </Link>
          </div>
        </div>
        <p className="mt-4.5 text-center text-[12.5px] leading-relaxed text-text-muted">
          Contas de empresa são criadas apenas via onboarding.
          <br />
          Não há auto-cadastro nesta tela.
        </p>
      </div>
    </div>
  );
}
