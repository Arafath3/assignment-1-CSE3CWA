// app/api/sessions/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: params.id },
      select: { id: true, status: true, createdAt: true },
    });
    if (!session)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const latest = await prisma.snapshot.findFirst({
      where: { sessionId: session.id },
      orderBy: { createdAt: "desc" },
      select: { data: true, createdAt: true },
    });

    return NextResponse.json({
      ...session,
      latest: latest?.data ?? null,
      latestAt: latest?.createdAt ?? null,
    });
  } catch (e) {
    console.error("GET /api/sessions/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!session)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    // You can send either the whole `data` object or only the changed keys
    // If `data` key exists, we store that verbatim; else we merge with the latest.
    const latest = await prisma.snapshot.findFirst({
      where: { sessionId: session.id },
      orderBy: { createdAt: "desc" },
      select: { data: true },
    });

    let nextData: any;
    if (body?.data && typeof body.data === "object") {
      nextData = body.data;
    } else {
      // shallow merge changed fields
      nextData = { ...(latest?.data || {}), ...(body || {}) };
    }
    nextData.lastSavedAt = new Date().toISOString();

    const snap = await prisma.snapshot.create({
      data: { sessionId: session.id, data: nextData },
      select: { id: true, createdAt: true, data: true },
    });

    return NextResponse.json({ ok: true, snapshot: snap });
  } catch (e) {
    console.error("PATCH /api/sessions/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
