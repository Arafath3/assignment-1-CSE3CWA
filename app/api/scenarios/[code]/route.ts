// app/api/scenarios/[code]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const scenario = await prisma.scenario.findUnique({
      where: { code: params.code },
    });
    if (!scenario)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(scenario);
  } catch (e) {
    console.error("GET /api/scenarios/[code] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
