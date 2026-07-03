import Link from "next/link";

export function CandidateShell({
  title,
  backHref,
  children,
}: {
  title: string;
  backHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col bg-surface">
      <header className="flex flex-shrink-0 items-center gap-3 border-b border-border bg-white px-5 py-3.5">
        {backHref && (
          <Link
            href={backHref}
            className="flex h-8.5 w-8.5 items-center justify-center rounded-[10px] bg-slate-100 text-text"
            aria-label="Voltar"
          >
            ←
          </Link>
        )}
        <span className="text-[16px] font-extrabold tracking-tight">{title}</span>
      </header>
      <main className="flex-1 px-5 py-4.5">{children}</main>
    </div>
  );
}
