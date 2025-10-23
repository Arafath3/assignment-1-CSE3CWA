// app/api/scenarios/ensure-default/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // avoid any static eval

export async function POST(_req: NextRequest) {
  const prisma = getPrisma(); // <-- only inside handler

  // example logic; replace with your real “ensure default” work
  const code = "default";
  const exists = await prisma.scenario.findUnique({ where: { code } });
  if (!exists) {
    await prisma.scenario.create({
      data: {
        code,
        name: "Default Scenario",
        description: "Autocreated default",
        sessionDurationSec: 600,
        task: "// #patch main\n// #endpatch\n",
      },
    });
  }

  return NextResponse.json({ ok: true });
}
