// app/api/evaluate/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  evaluateRulesServer,
  type Scenario as RuleScenario, // just to align types locally
} from "@/lib/rules";

export async function POST(req: Request) {
  try {
    const { scenarioCode, studentVisible } = await req.json();

    if (!scenarioCode || typeof studentVisible !== "string") {
      return NextResponse.json(
        { ok: false, reason: "Bad request." },
        { status: 400 }
      );
    }

    const scen = await prisma.scenario.findUnique({
      where: { code: scenarioCode },
    });

    if (!scen) {
      return NextResponse.json(
        { ok: false, reason: "Scenario not found." },
        { status: 404 }
      );
    }

    // Map DB record to the minimal shape evaluator expects
    const ruleScenario: RuleScenario = {
      code: scen.code,
      name: scen.name,
      description: scen.description,
      sessionDurationSec: scen.sessionDurationSec,
      task: scen.task,
      rulesText: scen.rulesText ?? undefined,
      ambient: (scen.ambient as any) ?? undefined,
      customRules: (scen.customRules as any) ?? undefined,
    };

    const result = evaluateRulesServer(ruleScenario, studentVisible);
    return NextResponse.json(
      { ok: result.passed, reason: result.passed ? undefined : result.reason },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, reason: "Internal error: " + String(e?.message || e) },
      { status: 500 }
    );
  }
}
