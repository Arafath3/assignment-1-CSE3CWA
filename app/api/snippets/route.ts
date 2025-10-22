import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { customAlphabet } from "nanoid";

const nano = customAlphabet("abcdef1234567890", 10);

const CreateSchema = z.object({
  title: z.string().optional(),
  code: z.string().min(1),
  visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]).optional(),
  ownerSessionId: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const shareId = nano();
  const snip = await prisma.snippet.create({
    data: {
      shareId,
      title: parsed.data.title,
      code: parsed.data.code,
      visibility: parsed.data.visibility ?? "PUBLIC",
      ownerSessionId: parsed.data.ownerSessionId,
    },
    select: { shareId: true },
  });

  return NextResponse.json(snip);
}
