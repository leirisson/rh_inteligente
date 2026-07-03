import { verifyCandidateSession } from "@/app/_lib/auth/session";
import type { CandidateSessionPayload } from "@/app/_lib/auth/types";

/**
 * Valida a sessão de candidato (DAL) e repassa para o children via render prop,
 * evitando que cada page.tsx repita a checagem.
 */
export async function CandidatePage({
  children,
}: {
  children: (session: CandidateSessionPayload) => React.ReactNode;
}) {
  const session = await verifyCandidateSession();
  return <>{children(session)}</>;
}
