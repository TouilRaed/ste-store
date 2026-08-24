import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin/api";
import { getStats } from "@/lib/admin/repo";

export const GET = withAdmin(async () => NextResponse.json(await getStats()));
