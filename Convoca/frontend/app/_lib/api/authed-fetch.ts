import "server-only";
import { redirect } from "next/navigation";
import { apiFetch, ApiError, type ApiFetchOptions } from "./client";
import { getCompanySession, getCandidateSession, setCompanySession } from "@/app/_lib/auth/session";
import { refreshCompanyToken } from "./endpoints/auth";

/**
 * Executa uma chamada autenticada como empresa. Em caso de 401, tenta um refresh
 * único do token e repete a chamada antes de desistir.
 *
 * Cookies só podem ser escritos/apagados em Server Actions ou Route Handlers
 * (nunca durante a renderização de uma página, mesmo em Server Component async —
 * ver https://nextjs.org/docs/app/api-reference/functions/cookies#options).
 * Como este fetch roda tipicamente dentro de um page.tsx, uma sessão irrecuperável
 * aqui é resolvida via redirect() para o login (permitido durante o render) em vez
 * de tentar limpar o cookie — o cookie antigo é sobrescrito no próximo login bem-sucedido.
 */
export async function companyFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const session = await getCompanySession();
  if (!session) redirect("/empresa/login");

  try {
    return await apiFetch<T>(path, { ...opts, token: session.accessToken });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      try {
        const refreshed = await refreshCompanyToken(session.refreshToken);
        await setCompanySession({ ...session, ...refreshed });
        return await apiFetch<T>(path, { ...opts, token: refreshed.accessToken });
      } catch {
        redirect("/empresa/login");
      }
    }
    throw err;
  }
}

/**
 * Executa uma chamada autenticada como candidato. A API não expõe endpoint de
 * refresh específico para candidato — em caso de 401, redireciona para o login
 * (mesma justificativa de companyFetch: não é seguro apagar o cookie aqui).
 * TODO: revisar se um refresh de candidato for adicionado à API no futuro.
 */
export async function candidateFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const session = await getCandidateSession();
  if (!session) redirect("/candidato/entrar");

  try {
    return await apiFetch<T>(path, { ...opts, token: session.accessToken });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect("/candidato/entrar");
    }
    throw err;
  }
}
