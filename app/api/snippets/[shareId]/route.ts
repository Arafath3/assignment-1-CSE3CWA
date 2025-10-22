import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { shareId: string } }
) {
  const s = await prisma.snippet.findUnique({
    where: { shareId: params.shareId },
  });
  if (!s || s.visibility === "PRIVATE")
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    title: s.title,
    code: s.code,
    visibility: s.visibility,
  });
}
