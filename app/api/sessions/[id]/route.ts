// app/api/sessions/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/sessions/:id
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await prisma.session.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      scenarioCode: true,
      startAt: true,
      elapsedSec: true,
      work: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
  return NextResponse.json(session);
}

// PATCH /api/sessions/:id
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: Record<string, any> = {};
  if (typeof body.elapsedSec === "number")
    data.elapsedSec = Math.max(0, Math.floor(body.elapsedSec));
  if (typeof body.work === "string") data.work = body.work;
  if (typeof body.status === "string") data.status = body.status;
  if (typeof body.scenarioCode === "string")
    data.scenarioCode = body.scenarioCode;
  if (body.startAt) data.startAt = new Date(body.startAt);

  try {
    const updated = await prisma.session.update({
      where: { id },
      data,
      select: {
        id: true,
        elapsedSec: true,
        work: true,
        scenarioCode: true,
        status: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }
}
