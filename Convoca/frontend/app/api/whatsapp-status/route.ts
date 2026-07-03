import { NextResponse } from "next/server";
import { getCompanySession } from "@/app/_lib/auth/session";
import { getWhatsAppStatus } from "@/app/_lib/api/endpoints/tenant-integration";
import { ApiError } from "@/app/_lib/api/client";

export async function GET() {
  const session = await getCompanySession();
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, { status: 401 });
  }

  try {
    const status = await getWhatsAppStatus(session.user.tenantId);
    return NextResponse.json(status);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: { message: err.message, code: err.code } }, { status: err.status });
    }
    throw err;
  }
}
