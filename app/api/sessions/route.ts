// app/api/sessions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Body = {
  scenarioCode?: string | null;
  seedWork?: string;
};

export async function POST(req: Request) {
  try {
    const { scenarioCode, seedWork }: Body = await req
      .json()
      .catch(() => ({} as any));

    // Optional: if scenarioCode provided, make sure it exists
    let scenario = null as null | { code: string };
    if (scenarioCode) {
      scenario = await prisma.scenario.findUnique({
        where: { code: scenarioCode },
        select: { code: true },
      });
      if (!scenario) {
        return NextResponse.json(
          { error: "Unknown scenario code" },
          { status: 400 }
        );
      }
    }

    // Create session
    const session = await prisma.session.create({
      data: { status: "active" },
      select: { id: true, createdAt: true },
    });

    // Snapshot is where we store the actual progress
    const initial = {
      scenarioCode: scenarioCode ?? null,
      work: seedWork ?? "",
      elapsedSec: 0,
      // place for anything else you want to persist:
      flags: {},
      lastSavedAt: new Date().toISOString(),
    };

    await prisma.snapshot.create({
      data: {
        sessionId: session.id,
        data: initial as any,
      },
    });

    return NextResponse.json({ id: session.id });
  } catch (e) {
    console.error("POST /api/sessions error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
