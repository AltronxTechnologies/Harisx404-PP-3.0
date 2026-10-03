import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-auth";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const supabase = auth.client;

    const { searchParams } = new URL(request.url);
    const requestedLimit = Number(searchParams.get("limit") ?? 50);
    const requestedOffset = Number(searchParams.get("offset") ?? 0);
    if (!Number.isSafeInteger(requestedLimit) || requestedLimit < 1 || !Number.isSafeInteger(requestedOffset) || requestedOffset < 0) {
      return NextResponse.json({ error: "Invalid pagination" }, { status: 400 });
    }
    const limit = Math.min(requestedLimit, 100);
    const offset = requestedOffset;

    const { data, error, count } = await supabase
      .from("media")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data, count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
