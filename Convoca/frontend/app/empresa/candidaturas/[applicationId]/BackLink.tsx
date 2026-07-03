"use client";

import { useRouter } from "next/navigation";

export function BackLink() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="mb-2 block text-[13px] font-semibold text-text-muted"
    >
      ← Funil
    </button>
  );
}
