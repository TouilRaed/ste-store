import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin/api";
import { listCollections } from "@/lib/admin/repo";

export const GET = withAdmin(async () => NextResponse.json({ collections: await listCollections() }));
