// app/api/scenarios/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function genCode(len = 7) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++)
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function normalizeAmbient(...candidates: unknown[]): string[] {
  const toList = (v: any): string[] => {
    if (Array.isArray(v))
      return v
        .map(String)
        .map((s) => s.trim())
        .filter(Boolean);
    if (typeof v === "string")
      return v
        .split(/\r?\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);
    if (v && typeof v === "object")
      return toList(v.messages ?? v.ambientMessages ?? v.msgs ?? v.ambient);
    return [];
  };
  const merged = candidates.flatMap(toList);
  return Array.from(new Set(merged));
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const ambientArr = normalizeAmbient(
      body?.customRules?.ambientMessages,
      body?.ambient?.messages,
      body?.ambientMessages // legacy
    );

    // IMPORTANT: use undefined (not null) when empty; type as InputJsonValue when present
    const ambientJson: Prisma.InputJsonValue | undefined = ambientArr.length
      ? ({ messages: ambientArr } as Prisma.InputJsonValue)
      : undefined;

    const customRulesJson: Prisma.InputJsonValue | undefined = ambientArr.length
      ? ({ ambientMessages: ambientArr } as Prisma.InputJsonValue)
      : undefined;

    const penaltiesJson: Prisma.InputJsonValue | undefined =
      body?.penalties !== undefined
        ? (body.penalties as Prisma.InputJsonValue)
        : undefined;

    const created = await prisma.scenario.create({
      data: {
        code: genCode(7),
        name: String(body.name),
        description: String(body.description),
        sessionDurationSec: Number(body.sessionDurationSec) || 600,
        task: String(body.task),
        // Add this column in Prisma schema: rulesText String?
        rulesText:
          typeof body.rulesText === "string" ? body.rulesText : undefined,
        // Add this column in Prisma schema: ambient Json?
        ambient: ambientJson,
        customRules: customRulesJson,
        penalties: penaltiesJson,
      },
      select: { code: true },
    });

    return NextResponse.json({ code: created.code }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal error: " + String(e?.message || e) },
      { status: 500 }
    );
  }
}
