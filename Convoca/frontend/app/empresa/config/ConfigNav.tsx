import Link from "next/link";

const items = [
  { href: "/empresa/config/geral", label: "Geral" },
  { href: "/empresa/config/whatsapp", label: "WhatsApp Institucional" },
  { href: "/empresa/config/email", label: "E-mail (SMTP)" },
  { href: "/empresa/config/equipe", label: "Equipe" },
  { href: "/empresa/config/seguranca", label: "Segurança" },
];

export function ConfigNav({ active }: { active: string }) {
  return (
    <aside className="w-[210px] flex-shrink-0">
      <h2 className="mb-4 text-[19px] font-extrabold tracking-tight">Configurações</h2>
      <nav className="space-y-0.5">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-[10px] px-3 py-2.5 text-[13.5px] ${
              item.href === active
                ? "bg-primary font-bold text-white"
                : "font-medium text-text-secondary hover:bg-slate-50"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
