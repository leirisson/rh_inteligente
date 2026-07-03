"use server";

import { revalidatePath } from "next/cache";
import { updateMe, createContactMethod, deleteContactMethod } from "@/app/_lib/api/endpoints/candidates";
import type { Channel } from "@/app/_lib/api/types";

export async function updateProfileAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const resumeText = String(formData.get("resumeText") ?? "").trim();
  if (!name) return;

  await updateMe({ name, resumeText });
  revalidatePath("/candidato/perfil");
}

export async function addContactMethodAction(formData: FormData) {
  const channel = formData.get("channel") as Channel;
  const value = String(formData.get("value") ?? "").trim();
  if (!value) return;

  await createContactMethod(channel, value);
  revalidatePath("/candidato/perfil");
}

export async function removeContactMethodAction(contactMethodId: string) {
  await deleteContactMethod(contactMethodId);
  revalidatePath("/candidato/perfil");
}
