import Link from "next/link";
import type { CompanyUser } from "@/app/_lib/api/types";

type Section = "vagas" | "candidatos" | "entrevistas" | "config";

const items: { id: Section; label: string; href: string }[] = [
  { id: "vagas", label: "Vagas", href: "/empresa/vagas" },
  { id: "candidatos", label: "Candidatos", href: "/empresa/vagas" },
  { id: "entrevistas", label: "Entrevistas", href: "/empresa/entrevistas" },
  { id: "config", label: "Configurações", href: "/empresa/config/whatsapp" },
];

export function TopNav({ active, user }: { active: Section; user: CompanyUser }) {
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-16 items-center justify-between border-b border-border bg-white px-7">
      <div className="flex items-center gap-10">
        <Link href="/empresa/vagas" className="flex items-center gap-2.5">
          <div className="flex h-7.5 w-7.5 items-center justify-center rounded-[9px] bg-primary text-[16px] font-extrabold text-white shadow-[0_2px_6px_rgba(79,70,229,0.35)]">
            C
          </div>
          <span className="text-lg font-extrabold tracking-tight">Convoca</span>
        </Link>
        <nav className="flex items-center gap-1.5">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`relative px-3 py-1.5 text-sm ${
                item.id === active ? "font-bold text-primary" : "font-medium text-text-secondary"
              }`}
            >
              {item.label}
              {item.id === active && (
                <span className="absolute -bottom-5 left-3 right-3 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3.5">
        <div className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-[#EEF2FF] text-[13px] font-bold text-primary">
          {initials}
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-semibold">{user.name}</span>
          <span className="text-[11px] text-text-muted">
            {user.role === "TENANT_ADMIN" ? "Admin" : "Recrutador"}
          </span>
        </div>
      </div>
    </div>
  );
}
