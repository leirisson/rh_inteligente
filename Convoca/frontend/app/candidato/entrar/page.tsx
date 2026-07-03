"use client";

import { useActionState, useState } from "react";
import {
  signupCandidateAction,
  loginCandidateAction,
  type CandidateAuthState,
} from "@/app/_lib/auth/actions";
import { Input, Textarea } from "@/app/_lib/design-system/Input";
import { Button } from "@/app/_lib/design-system/Button";

const initialState: CandidateAuthState = {};

export default function CandidatoEntrarPage() {
  const [tab, setTab] = useState<"signup" | "login">("signup");
  const [signupState, signupAction, signupPending] = useActionState(
    signupCandidateAction,
    initialState,
  );
  const [loginState, loginAction, loginPending] = useActionState(
    loginCandidateAction,
    initialState,
  );

  return (
    <div className="flex min-h-full flex-1 justify-center bg-[radial-gradient(120%_80%_at_50%_-10%,#F5F3FF_0%,#EEF1F6_55%)] px-4 py-9">
      <div className="w-full max-w-[420px]">
        <div className="mb-5.5 flex flex-col items-center text-center">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-7.5 w-7.5 items-center justify-center rounded-[9px] bg-primary text-[15px] font-extrabold text-white">
              C
            </div>
            <span className="text-[19px] font-extrabold tracking-tight">Convoca</span>
          </div>
          <h1 className="mb-2.5 text-2xl font-extrabold leading-tight tracking-tight">
            Encontre a vaga certa, sem enviar um currículo sequer
          </h1>
          <p className="text-[13.5px] leading-relaxed text-text-secondary">
            Cadastre-se uma vez. Nosso agente de IA conversa com você pelo WhatsApp quando
            surgir um match.
          </p>
        </div>

        <div className="rounded-[20px] border border-border bg-white p-2 shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex rounded-[13px] bg-slate-100 p-0.75">
            <button
              onClick={() => setTab("signup")}
              className={`flex-1 rounded-[10px] py-2.5 text-[13.5px] font-bold ${
                tab === "signup" ? "bg-white text-text shadow-sm" : "text-text-secondary"
              }`}
            >
              Criar conta
            </button>
            <button
              onClick={() => setTab("login")}
              className={`flex-1 rounded-[10px] py-2.5 text-[13.5px] font-bold ${
                tab === "login" ? "bg-white text-text shadow-sm" : "text-text-secondary"
              }`}
            >
              Entrar
            </button>
          </div>

          <div className="px-3 pb-3.5 pt-1.5">
            {tab === "signup" ? (
              <form action={signupAction} className="space-y-3.5">
                <Input id="name" name="name" label="Nome completo" required />
                <Input id="email" name="email" type="email" label="E-mail" required />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  label="Senha"
                  minLength={8}
                  required
                />
                <Textarea
                  id="resumeText"
                  name="resumeText"
                  label="Cole seu currículo ou experiência"
                  className="h-24"
                  placeholder="Desenvolvedora backend com 5 anos de experiência em..."
                />
                {signupState.error && (
                  <p className="text-[13px] font-medium text-danger">{signupState.error}</p>
                )}
                <Button type="submit" className="mt-2 w-full" loading={signupPending}>
                  Criar minha conta
                </Button>
              </form>
            ) : (
              <form action={loginAction} className="space-y-3.5">
                <Input id="login-email" name="email" type="email" label="E-mail" required />
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  label="Senha"
                  required
                />
                {loginState.error && (
                  <p className="text-[13px] font-medium text-danger">{loginState.error}</p>
                )}
                <Button type="submit" className="w-full" loading={loginPending}>
                  Entrar
                </Button>
              </form>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-[11.5px] text-text-muted">
          Termos de Uso · Privacidade
        </p>
      </div>
    </div>
  );
}
