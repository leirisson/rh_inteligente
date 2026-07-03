import { verifyCompanySession } from "@/app/_lib/auth/session";
import { TopNav } from "./TopNav";

type Section = "vagas" | "candidatos" | "entrevistas" | "config";

/**
 * Wrapper server component: valida a sessão (redundante com o layout, mas barato
 * via cache()) e renderiza a TopNav com a seção correta destacada, evitando que
 * cada page.tsx precise repetir essa lógica.
 */
export async function CompanyPage({
  active,
  children,
}: {
  active: Section;
  children: React.ReactNode;
}) {
  const session = await verifyCompanySession();
  return (
    <>
      <TopNav active={active} user={session.user} />
      {children}
    </>
  );
}
