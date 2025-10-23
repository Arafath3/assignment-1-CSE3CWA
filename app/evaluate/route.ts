// app/api/evaluate/route.ts
import { NextResponse } from "next/server";
import { Scenario, evaluateRulesServer } from "@/lib/rules";

// --- Replace this with your real data access ---
async function loadScenarioByCode(code: string): Promise<Scenario | null> {
  // Example only: fetch from your existing endpoint or DB
  // const r = await fetch(process.env.INTERNAL_BASE_URL + `/api/scenarios/${code}`, { cache: "no-store" });
  // if (!r.ok) return null;
  // return (await r.json()) as Scenario;

  return null; // fallback
}

export async function POST(req: Request) {
  try {
    const { scenarioCode, studentVisible } = await req.json();

    if (!scenarioCode || typeof studentVisible !== "string") {
      return NextResponse.json(
        { ok: false, reason: "Bad request." },
        { status: 400 }
      );
    }

    const scen =
      (await loadScenarioByCode(scenarioCode)) ||
      // If you prefer, accept full scenario in body for now:
      (await (async () => {
        const body = await req.json().catch(() => ({}));
        return (body?.scenario as Scenario) || null;
      })());

    if (!scen) {
      return NextResponse.json(
        { ok: false, reason: "Scenario not found." },
        { status: 404 }
      );
    }

    const res = evaluateRulesServer(scen, studentVisible);
    return NextResponse.json({
      ok: res.passed,
      reason: res.passed ? undefined : res.reason,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, reason: "Internal error: " + String(e?.message || e) },
      { status: 500 }
    );
  }
}
