import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { CompanySessionPayload, CandidateSessionPayload } from "./types";

const secretKey = process.env.SESSION_SECRET ?? "convoca-dev-secret-change-me-please-32ch";
const encodedKey = new TextEncoder().encode(secretKey);

const COMPANY_COOKIE = "convoca_company_session";
const CANDIDATE_COOKIE = "convoca_candidate_session";
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

async function encryptSession(payload: object) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

async function decryptSession<T>(session: string | undefined): Promise<T | null> {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey, { algorithms: ["HS256"] });
    return payload as unknown as T;
  } catch {
    return null;
  }
}

// ---- company session ----

export async function setCompanySession(payload: CompanySessionPayload) {
  const session = await encryptSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(COMPANY_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearCompanySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COMPANY_COOKIE);
}

export const getCompanySession = cache(async (): Promise<CompanySessionPayload | null> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COMPANY_COOKIE)?.value;
  return decryptSession<CompanySessionPayload>(raw);
});

export async function verifyCompanySession(): Promise<CompanySessionPayload> {
  const session = await getCompanySession();
  if (!session) redirect("/empresa/login");
  return session;
}

// ---- candidate session ----

export async function setCandidateSession(payload: CandidateSessionPayload) {
  const session = await encryptSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(CANDIDATE_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearCandidateSession() {
  const cookieStore = await cookies();
  cookieStore.delete(CANDIDATE_COOKIE);
}

export const getCandidateSession = cache(async (): Promise<CandidateSessionPayload | null> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CANDIDATE_COOKIE)?.value;
  return decryptSession<CandidateSessionPayload>(raw);
});

export async function verifyCandidateSession(): Promise<CandidateSessionPayload> {
  const session = await getCandidateSession();
  if (!session) redirect("/candidato/entrar");
  return session;
}

export { COMPANY_COOKIE, CANDIDATE_COOKIE };
