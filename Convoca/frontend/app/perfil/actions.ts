"use server";

import { revalidatePath } from "next/cache";
import { updateMyUserProfile } from "@/app/_lib/api/endpoints/users";

export async function updateMyProfileAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name) return;

  await updateMyUserProfile({ name, phone: phone || null });
  revalidatePath("/perfil");
}
