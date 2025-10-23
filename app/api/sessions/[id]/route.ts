// app/api/sessions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

import type { Prisma, Session } from "@prisma/client";

type Params = { id: string };

function hasAnyProgress(
  s: Pick<Session, "scenarioCode" | "elapsedSec" | "work">
): boolean {
  return (
    Boolean(s.scenarioCode) || (s.work ?? "") !== "" || (s.elapsedSec ?? 0) > 0
  );
}

export async function GET(_req: NextRequest, ctx: { params: Promise<Params> }) {
  const prisma = getPrisma(); // call this inside the handler/function
  const { id } = await ctx.params; // <- typed routes: await params

  const s = await prisma.session.findUnique({
    where: { id },
    select: {
      id: true,
      scenarioCode: true,
      elapsedSec: true,
      work: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const latest = hasAnyProgress(s)
    ? {
        scenarioCode: s.scenarioCode ?? null,
        elapsedSec: s.elapsedSec ?? 0,
        work: s.work ?? "",
      }
    : null;

  return NextResponse.json({ id: s.id, latest });
}

type PatchBody = {
  scenarioCode?: unknown;
  elapsedSec?: unknown;
  work?: unknown;
  data?: Prisma.InputJsonValue; // for snapshot JSON
};

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<Params> }
) {
  const prisma = getPrisma(); // call this inside the handler/function
  const { id } = await ctx.params; // <- await params
  const body = (await req.json().catch(() => ({}))) as PatchBody;

  const updateData: Partial<
    Pick<Session, "scenarioCode" | "elapsedSec" | "work">
  > = {};
  if ("scenarioCode" in body)
    updateData.scenarioCode = String(body.scenarioCode ?? "");
  if ("elapsedSec" in body)
    updateData.elapsedSec = Number(body.elapsedSec ?? 0);
  if ("work" in body) updateData.work = String(body.work ?? "");

  const doSnapshot = typeof body.data !== "undefined";

  const [updated] = await prisma.$transaction([
    prisma.session.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        scenarioCode: true,
        elapsedSec: true,
        work: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    ...(doSnapshot
      ? [
          prisma.snapshot.create({
            data: { sessionId: id, data: body.data as Prisma.InputJsonValue },
          }),
        ]
      : []),
  ]);

  const latest = {
    scenarioCode: updated.scenarioCode ?? null,
    elapsedSec: updated.elapsedSec ?? 0,
    work: updated.work ?? "",
  };

  return NextResponse.json({ id: updated.id, latest });
}
