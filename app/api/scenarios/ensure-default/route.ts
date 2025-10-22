// app/api/scenarios/ensure-default/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_CODE = "DEFAULT"; // fixed, easy to share

export async function POST() {
  try {
    const existing = await prisma.scenario.findUnique({
      where: { code: DEFAULT_CODE },
    });
    if (existing)
      return NextResponse.json({ ensured: true, code: DEFAULT_CODE });

    const scenario = await prisma.scenario.create({
      data: {
        name: "Input Sanitization 101",
        description:
          "Fix the input sanitization issues in the provided handler within the time limit.",
        sessionDurationSec: 5 * 60,
        task: `// Example: sanitize the 'name' field safely before using it
export function handler(req, res) {
  const name = req.body.name; // UNSAFE
  // TODO: sanitize/escape name and validate length
  res.end("Hello " + name);
}`,
        customRules: {
          rulesText:
            "- Ensure no direct string concatenation into HTML.\n- Validate 'name' length (1..50).\n- Escape/encode output.",
          ambientMessages:
            "Boss: are you done with sprint 1?\nAgile: 'fix input validation'\nFamily: pick up the kids?",
        },
        penalties: { onFail: "Court: Laws of Tort & Disability Act" },
        code: DEFAULT_CODE,
      },
    });

    return NextResponse.json({ ensured: true, code: scenario.code });
  } catch (err) {
    console.error("ensure-default error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
