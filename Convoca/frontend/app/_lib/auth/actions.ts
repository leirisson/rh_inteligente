"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { loginCompany, signupCandidate, loginCandidate } from "@/app/_lib/api/endpoints/auth";
import { setCompanySession, setCandidateSession, clearCompanySession, clearCandidateSession } from "./session";
import { ApiError } from "@/app/_lib/api/client";

export interface CompanyLoginState {
  error?: string;
}

const companyLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginCompanyAction(
  _prevState: CompanyLoginState,
  formData: FormData,
): Promise<CompanyLoginState> {
  const parsed = companyLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Preencha e-mail e senha válidos." };
  }

  try {
    const result = await loginCompany(parsed.data.email, parsed.data.password);
    await setCompanySession(result);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return { error: "E-mail ou senha inválidos." };
    }
    return { error: "Não foi possível entrar agora. Tente novamente em instantes." };
  }

  redirect("/empresa/vagas");
}

export async function logoutCompanyAction() {
  await clearCompanySession();
  redirect("/empresa/login");
}

export interface CandidateAuthState {
  error?: string;
}

const candidateSignupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  resumeText: z.string().optional(),
});

export async function signupCandidateAction(
  _prevState: CandidateAuthState,
  formData: FormData,
): Promise<CandidateAuthState> {
  const parsed = candidateSignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    resumeText: formData.get("resumeText") || undefined,
  });
  if (!parsed.success) {
    return { error: "Verifique os campos: nome, e-mail e senha (mín. 8 caracteres)." };
  }

  try {
    const result = await signupCandidate(parsed.data);
    await setCandidateSession(result);
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      return { error: "Já existe uma conta com este e-mail." };
    }
    return { error: "Não foi possível criar sua conta agora. Tente novamente." };
  }

  redirect("/candidato/candidaturas");
}

const candidateLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginCandidateAction(
  _prevState: CandidateAuthState,
  formData: FormData,
): Promise<CandidateAuthState> {
  const parsed = candidateLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Preencha e-mail e senha válidos." };
  }

  try {
    const result = await loginCandidate(parsed.data.email, parsed.data.password);
    await setCandidateSession(result);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return { error: "E-mail ou senha inválidos." };
    }
    return { error: "Não foi possível entrar agora. Tente novamente em instantes." };
  }

  redirect("/candidato/candidaturas");
}

export async function logoutCandidateAction() {
  await clearCandidateSession();
  redirect("/candidato/entrar");
}
