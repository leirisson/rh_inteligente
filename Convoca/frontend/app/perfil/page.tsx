import { verifyCompanySession } from "@/app/_lib/auth/session";
import { TopNav } from "@/app/_lib/layout/TopNav";
import { getMyUserProfile } from "@/app/_lib/api/endpoints/users";
import { Input } from "@/app/_lib/design-system/Input";
import { Button } from "@/app/_lib/design-system/Button";
import { updateMyProfileAction } from "./actions";

export default async function MeuPerfilPage() {
  const session = await verifyCompanySession();
  const profile = await getMyUserProfile();
  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <TopNav active="config" user={session.user} />
      <div className="mx-auto max-w-[620px] px-8 pb-14 pt-8">
        <div className="mb-1 text-[13px] font-semibold text-text-muted">Meu Perfil</div>
        <h1 className="mb-5 text-[22px] font-extrabold tracking-tight">Contato pessoal</h1>

        <form
          action={updateMyProfileAction}
          className="rounded-2xl border border-border bg-white p-6.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        >
          <div className="mb-5 flex items-center gap-3.5 border-b border-slate-100 pb-5">
            <div className="flex h-13 w-13 items-center justify-center rounded-full bg-[#EEF2FF] text-[17px] font-bold text-primary">
              {initials}
            </div>
            <div>
              <div className="text-base font-bold">{profile.name}</div>
              <div className="text-[13px] text-text-secondary">{profile.email}</div>
            </div>
          </div>

          <input type="hidden" name="name" value={profile.name} />
          <Input
            id="phone"
            name="phone"
            label="WhatsApp pessoal (opcional)"
            defaultValue={profile.phone ?? ""}
            placeholder="+55 11 99123-4567"
            className="mb-2"
          />
          <p className="mb-5 text-[12.5px] leading-relaxed text-text-muted">
            Exibido para candidatos aprovados como contato direto — não é usado pelo agente de
            IA nem requer conexão.
          </p>

          <div className="mb-1.5 text-xs font-semibold text-text-secondary">
            Prévia para o candidato
          </div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-success-bg px-4 py-2.5 text-[13.5px] font-bold text-emerald-700">
            <span className="text-[15px]">💬</span>
            Falar com {profile.name.split(" ")[0]} no WhatsApp
          </div>

          <div className="flex justify-end">
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </div>
    </>
  );
}
