// app/api/scenarios/[code]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const scen = await prisma.scenario.findUnique({
    where: { code },
  });

  if (!scen) {
    return NextResponse.json({ error: "Scenario not found." }, { status: 404 });
  }
  return NextResponse.json(scen);
}
