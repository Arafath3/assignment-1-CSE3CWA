// app/api/scenarios/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function alphaCode(len = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < len; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function uniqueAlphaCode() {
  // loop until unique
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const code = alphaCode(6);
    const exists = await prisma.scenario.findUnique({ where: { code } });
    if (!exists) return code;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name, // string
      description, // string
      sessionDurationSec, // number (seconds)
      task, // string (code / quiz / anything)
      rulesText, // string (from your "Rules" textarea)
      ambientMessages, // string (from your "Ambient messages" textarea)
    } = body ?? {};

    if (!name || !description || !task) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const dur = Number(sessionDurationSec ?? 0);
    if (!Number.isFinite(dur) || dur < 60) {
      return NextResponse.json(
        { error: "sessionDurationSec must be >= 60 seconds." },
        { status: 400 }
      );
    }

    const code = await uniqueAlphaCode();

    const scenario = await prisma.scenario.create({
      data: {
        name,
        description,
        sessionDurationSec: dur,
        task,
        // pack free-text into Json columns so you didn’t need to change schema
        customRules: {
          rulesText: String(rulesText ?? ""),
          ambientMessages: String(ambientMessages ?? ""),
        },
        penalties: "",
        code,
      },
    });

    return NextResponse.json(
      { id: scenario.id, code: scenario.code },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create scenario error:", err);
    return NextResponse.json(
      { error: "Failed to create scenario" },
      { status: 500 }
    );
  }
}
