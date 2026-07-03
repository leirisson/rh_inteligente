"use server";

import { redirect } from "next/navigation";
import { createJob } from "@/app/_lib/api/endpoints/jobs";

export async function createJobAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title || !description) return;

  const job = await createJob({ title, description });
  redirect(`/empresa/vagas/${job.id}`);
}
