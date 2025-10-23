// app/api/sessions/route.ts
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const prisma = getPrisma(); // call this inside the handler/function
  // (body is currently unused but keep it for future)
  const session = await prisma.session.create({
    data: {}, // defaults from schema
    select: { id: true, createdAt: true },
  });
  return NextResponse.json(session, { status: 201 });
}
