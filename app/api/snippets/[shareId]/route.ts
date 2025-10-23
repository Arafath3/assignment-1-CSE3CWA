// app/api/snippets/[shareId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

type Params = { shareId: string };

export async function GET(_req: NextRequest, ctx: { params: Promise<Params> }) {
  const prisma = getPrisma(); // call this inside the handler/function

  const { shareId } = await ctx.params; // <-- await the Promise in Next 15

  const s = await prisma.snippet.findUnique({
    where: { shareId },
    select: { title: true, code: true, visibility: true },
  });

  if (!s || s.visibility === "PRIVATE") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(s);
}
