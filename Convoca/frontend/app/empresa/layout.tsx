import { verifyCompanySession } from "@/app/_lib/auth/session";

export default async function EmpresaLayout({ children }: { children: React.ReactNode }) {
  await verifyCompanySession();
  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
