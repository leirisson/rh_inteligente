import "server-only";
import { apiFetch, ApiError, type ApiFetchOptions } from "./client";
import {
  getCompanySession,
  getCandidateSession,
  setCompanySession,
  clearCompanySession,
  clearCandidateSession,
} from "@/app/_lib/auth/session";
import { refreshCompanyToken } from "./endpoints/auth";

/**
 * Executa uma chamada autenticada como empresa. Em caso de 401, tenta um refresh
 * único do token e repete a chamada antes de propagar o erro.
 */
export async function companyFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const session = await getCompanySession();
  if (!session) throw new ApiError(401, "UNAUTHENTICATED", "Sessão não encontrada");

  try {
    return await apiFetch<T>(path, { ...opts, token: session.accessToken });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      try {
        const refreshed = await refreshCompanyToken(session.refreshToken);
        await setCompanySession({ ...session, ...refreshed });
        return await apiFetch<T>(path, { ...opts, token: refreshed.accessToken });
      } catch {
        await clearCompanySession();
        throw err;
      }
    }
    throw err;
  }
}

/**
 * Executa uma chamada autenticada como candidato. A API não expõe endpoint de
 * refresh específico para candidato — em caso de 401, a sessão é limpa e o erro
 * propagado (força novo login). TODO: revisar se um refresh de candidato for
 * adicionado à API no futuro.
 */
export async function candidateFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const session = await getCandidateSession();
  if (!session) throw new ApiError(401, "UNAUTHENTICATED", "Sessão não encontrada");

  try {
    return await apiFetch<T>(path, { ...opts, token: session.accessToken });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      await clearCandidateSession();
    }
    throw err;
  }
}
