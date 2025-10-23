"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  stripPatchMarkers,
  locateEditableRanges,
  type EditableRange,
  extractStudentPatchesFromVisible,
  reconstructUserCode,
  runTestInSandbox,
} from "@/lib/rules";

const COURT_BG = "/court.png";
const DESK_BG = "/desk.png";

// ---- Penalties config/types ----
type PenaltyRule = {
  id: string;
  normal: string;
  urgent: string;
  title: string;
  law: string;
  consequence: string;
  escalateMs?: number;
  target?: "full" | "visible";
  require?: string;
  forbid?: string;
  test?: { call: string; expect: any };
};

type IssueState = {
  cfg: PenaltyRule;
  stage: 0 | 1; // 0 = normal, 1 = urgent (next = court)
  nextAt: number | null;
  punished: boolean;
};

// This is the only shape CourtModal needs:
type CourtPenalty = Pick<PenaltyRule, "title" | "law" | "consequence">;

// ---- Scenario type for this page ----
type Scenario = {
  code: string;
  name: string;
  description: string;
  sessionDurationSec: number;
  task: string; // includes #patch markers (hidden in UI)
  rulesText?: string;
  ambient?: { messages?: string[] } | string;
  customRules?: { ambientMessages?: string[] | string } | string | null;
  penalties?: any; // JSON from DB; parsed by readPenaltyRules
};

type EvalResult = { ok: boolean; reason?: string };

const DEFAULT_AMBIENT = [
  "Boss: status on sprint 1?",
  "Family: can you pick up the kids?",
  "Agile: change title colour to red",
];

function fmtMMSS(totalSeconds: number) {
  const sec = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function toRegex(s?: string): RegExp | null {
  if (!s) return null;
  const m = s.match(/^\/(.+)\/([a-z]*)$/i);
  if (m) return new RegExp(m[1], m[2] || "");
  return new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

function checkIssueResolved(
  cfg: PenaltyRule,
  fullCode: string,
  visibleCode: string
): boolean {
  const target = cfg.target === "visible" ? visibleCode : fullCode;
  if (cfg.require) {
    const re = toRegex(cfg.require)!;
    return re.test(target);
  }
  if (cfg.forbid) {
    const re = toRegex(cfg.forbid)!;
    return !re.test(target);
  }
  if (cfg.test) {
    try {
      const got = runTestInSandbox(fullCode, cfg.test.call);
      return JSON.stringify(got) === JSON.stringify(cfg.test.expect);
    } catch {
      return false;
    }
  }
  return false;
}

// Parse Scenario.penalties JSON into PenaltyRule[]
function readPenaltyRules(s: Scenario | null): PenaltyRule[] {
  const raw = (s as any)?.penalties;
  if (Array.isArray(raw)) {
    return raw
      .map((x) => ({
        escalateMs: 120_000,
        target: "full",
        ...x,
      }))
      .filter((x) => x && x.id && (x.require || x.forbid || x.test));
  }
  // Fallback examples
  return [
    {
      id: "alt",
      normal: "fix alt in img1",
      urgent: "urgent: fix alt in img1",
      title: "Accessibility violation",
      law: "Disability Act",
      consequence: "Ignored repeated accessibility warnings.",
      escalateMs: 120_000,
      target: "visible",
      require: "/<img[^>]*\\salt=/i",
    },
    {
      id: "sanitize",
      normal: "fix input validation",
      urgent: "urgent: fix input validation",
      title: "Negligence",
      law: "Laws of Tort",
      consequence:
        "You knew about the input sanitization issue and didn’t fix it.",
      escalateMs: 120_000,
      target: "full",
      test: {
        call: 'inputSanitization("<script>alert(1)</script>Hello <b>Bob</b> & \\"friends\\"")',
        expect: "Hello &lt;b&gt;Bob&lt;/b&gt; &amp; &quot;friends&quot;",
      },
    },
    {
      id: "login",
      normal: "Fix User login",
      urgent: "urgent: Fix User login",
      title: "Login broken",
      law: "Bankruptcy",
      consequence: "No one can use your app — you go bankrupt.",
      escalateMs: 120_000,
      target: "full",
      require: "/function\\s+login\\s*\\(/i",
    },
    {
      id: "secure-db",
      normal: "Fix Secure Database",
      urgent: "urgent: Fix Secure Database",
      title: "Data breach",
      law: "Security",
      consequence: "You got hacked due to insecure DB usage.",
      escalateMs: 120_000,
      target: "full",
      forbid: "/SELECT\\s+\\*.*\\+\\s*input/i",
    },
  ];
}

export default function PlayClient() {
  const search = useSearchParams();
  const sid = search.get("sid");
  const scenarioCodeFromURL = search.get("code") || undefined;

  // ------------------- state -------------------
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [work, setWork] = useState(""); // student-visible (no markers)
  const [elapsed, setElapsed] = useState(0);
  const [court, setCourt] = useState<CourtPenalty | null>(null);
  const [running, setRunning] = useState(false);
  const [issues, setIssues] = useState<IssueState[]>([]);

  const target = useMemo(() => scenario?.sessionDurationSec ?? 600, [scenario]);
  const bg = court ? COURT_BG : DESK_BG;

  useEffect(() => {
    if (!scenario) return;
    const rules = readPenaltyRules(scenario);
    setIssues(
      rules.map((cfg) => ({ cfg, stage: 0, nextAt: null, punished: false }))
    );
  }, [scenario]);

  // ------------------- refs --------------------
  const startAtRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const ambientRef = useRef<number | null>(null);
  const scenarioRef = useRef<Scenario | null>(null);
  const workInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    scenarioRef.current = scenario;
  }, [scenario]);

  // ------------------- helpers -----------------
  const editableRanges = useMemo<EditableRange[] | null>(() => {
    if (!scenario) return null;
    return locateEditableRanges(scenario.task, work);
  }, [scenario, work]);

  function jumpToRange(r: EditableRange) {
    const el = workInputRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(r.start, r.end);
    toast.info(
      `Editing block "${r.name}" (lines ${r.lineStart}–${r.lineEnd})`,
      { theme: "dark", autoClose: 2500 }
    );
  }

  function nowSec() {
    return Math.floor(Date.now() / 1000);
  }

  // ----- Ambient messages (robust) -----
  function getAmbientMessages(s: Scenario | null): string[] {
    if (!s) return DEFAULT_AMBIENT;

    const maybeParse = (v: any) => {
      if (typeof v !== "string") return v;
      try {
        return JSON.parse(v);
      } catch {
        return v;
      }
    };
    const toList = (v: any): string[] => {
      v = maybeParse(v);
      if (Array.isArray(v)) return v.map(String).map((x) => x.trim());
      if (v && typeof v === "object") {
        const obj = v as Record<string, any>;
        const cand =
          obj.ambientMessages ??
          obj.messages ??
          obj.msgs ??
          obj.ambient_msgs ??
          obj.ambient;
        return toList(cand);
      }
      if (typeof v === "string") {
        return v.split(/\r?\n|,/).map((x) => x.trim());
      }
      return [];
    };

    const custom = toList(maybeParse((s as any).customRules)?.ambientMessages);
    const amb = toList(
      maybeParse((s as any).ambient)?.messages ?? (s as any).ambient
    );
    const merged = [...custom, ...amb].map((x) => x.trim()).filter(Boolean);
    return merged.length ? Array.from(new Set(merged)) : DEFAULT_AMBIENT;
  }

  async function evaluateRemote(): Promise<EvalResult> {
    const sc = scenarioRef.current;
    if (!sc) return { ok: false, reason: "Scenario not loaded." };
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioCode: sc.code,
          studentVisible: work, // no markers; backend reconstructs
        }),
      });
      return (await res.json()) as { ok: boolean; reason?: string };
    } catch {
      return { ok: false, reason: "Network error." };
    }
  }

  // ------------------- ambient & timers ------------------
  function clearAmbient() {
    if (ambientRef.current) clearInterval(ambientRef.current);
    ambientRef.current = null;
  }
  function stopAllTimers() {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    clearAmbient();
    setRunning(false);
  }

  async function ambientTick() {
    const s = scenarioRef.current;
    if (!s) return;

    // Reconstruct full code from visible text for accurate checks
    let fullCode = stripPatchMarkers(s.task);
    const ex = extractStudentPatchesFromVisible(s.task, work);
    if (ex.ok) fullCode = reconstructUserCode(s.task, ex.bodies);

    // ---- Issue engine: compute next state synchronously
    const now = Date.now();
    let punishedNow = false;

    const nextIssues: IssueState[] = issues.map((iss) => {
      if (iss.punished) return iss;

      const fixed = checkIssueResolved(iss.cfg, fullCode, work);
      const delay = iss.cfg.escalateMs ?? 120_000;

      if (fixed) {
        return { ...iss, stage: 0, nextAt: null };
      }

      if (iss.nextAt == null) {
        // start escalation window
        return { ...iss, nextAt: now + delay };
      }

      if (now >= iss.nextAt) {
        if (iss.stage === 0) {
          toast.warn(iss.cfg.urgent, { theme: "dark", autoClose: 6000 });
          return { ...iss, stage: 1, nextAt: now + delay };
        } else {
          // Court time
          punishedNow = true;
          stopAllTimers();
          setCourt({
            title: iss.cfg.title,
            law: iss.cfg.law,
            consequence: iss.cfg.consequence,
          });
          return { ...iss, punished: true, nextAt: null };
        }
      }

      return iss;
    });

    setIssues(nextIssues);
    if (punishedNow) return;

    // ---- Ambient rotation (every ~30s)
    const general = getAmbientMessages(s);
    const openIssueMsgs = nextIssues
      .filter((iss) => !iss.punished && iss.nextAt !== null)
      .map((iss) => (iss.stage === 0 ? iss.cfg.normal : iss.cfg.urgent));

    const pool = [...new Set([...openIssueMsgs, ...general])];
    if (pool.length) {
      const msg = pool[nowSec() % pool.length];
      toast.info(msg, { autoClose: 8000, theme: "dark" });
    }
  }

  function startTimer(alreadySec = 0) {
    startAtRef.current = Date.now() - alreadySec * 1000;

    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      const s = getElapsedSec();
      setElapsed(s);
      const tgt = target;
      if (s >= tgt) {
        stopAllTimers();
        setCourt({
          title: "Violation",
          law: "General",
          consequence: "Time’s up. You didn’t complete the task.",
        });
      }
    }, 1000);

    clearAmbient();
    void ambientTick(); // fire immediately
    ambientRef.current = window.setInterval(() => void ambientTick(), 30_000);

    setRunning(true);
  }

  // Cancel escalation as soon as player fixes code (server checks)
  useEffect(() => {
    if (!scenario) return;
    let alive = true;
    (async () => {
      const res = await evaluateRemote();
      if (!alive) return;
      if (res.ok) {
        // nothing extra to clear now (issue timers are local), but this keeps parity with old logic
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [work, scenario]);

  // Persist progress every 5s (optional)
  const getElapsedSec = () =>
    Math.max(
      0,
      Math.floor(
        ((Date.now() as number) - (startAtRef.current ?? Date.now())) / 1000
      )
    );

  useEffect(() => {
    if (!sid) return;
    const h = setInterval(() => {
      fetch(`/api/sessions/${sid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elapsedSec: elapsed, work }),
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(h);
  }, [sid, elapsed, work]);

  // Initial: restore + fetch scenario
  useEffect(() => {
    (async () => {
      let scode = scenarioCodeFromURL || undefined;
      let restoredElapsed = 0;
      let restoredWork = "";

      if (sid) {
        const sres = await fetch(`/api/sessions/${sid}`);
        if (sres.ok) {
          const sj = await sres.json();
          const latest = sj.latest ?? null;
          if (latest) {
            restoredElapsed = latest.elapsedSec ?? 0;
            restoredWork = latest.work ?? "";
            if (!scode) scode = latest.scenarioCode ?? undefined;
          }
        }
      }

      if (!scode) {
        toast.error("No scenario found for this session.", { theme: "dark" });
        return;
      }

      const r = await fetch(`/api/scenarios/${scode}`);
      if (!r.ok) {
        toast.error("Failed to load scenario.", { theme: "dark" });
        return;
      }
      const scen: Scenario = await r.json();

      setScenario(scen);
      const starterVisible = stripPatchMarkers(scen.task);
      setWork(restoredWork || starterVisible);
      setElapsed(restoredElapsed);
    })();

    return () => stopAllTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start timers once the scenario arrives
  useEffect(() => {
    if (scenario && !running && !tickRef.current) {
      startTimer(elapsed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  return (
    <main
      className="relative min-h-screen"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <ToastContainer position="top-center" theme="dark" />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6 text-white">
        <header className="flex items-center justify-between">
          <Link
            href="/court-room"
            className="rounded bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
          >
            ← Menu
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded bg-white/10 px-3 py-2 text-sm">
              {fmtMMSS(elapsed)} / {fmtMMSS(target)}
            </div>
            {running && !court ? (
              <button
                className="rounded bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
                onClick={stopAllTimers}
              >
                Pause
              </button>
            ) : (
              <button
                className="rounded bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
                onClick={() => startTimer(elapsed)}
              >
                {elapsed === 0 ? "Start" : "Resume"}
              </button>
            )}
          </div>
        </header>

        <div className="rounded-2xl bg-black/35 p-5 shadow-2xl backdrop-blur">
          <h2 className="mb-2 text-xl font-bold">
            {scenario?.name ?? "No scenario loaded"}
          </h2>
          <p className="opacity-90">{scenario?.description}</p>
          <pre className="mt-3 max-h-[40vh] overflow-auto whitespace-pre-wrap break-words">
            {scenario ? stripPatchMarkers(scenario.task) : ""}
          </pre>
        </div>

        <div className="rounded-2xl bg-black/35 p-5 shadow-2xl backdrop-blur">
          <h2 className="mb-2 text-xl font-bold">Your Work</h2>

          {/* Editable Areas helper */}
          {scenario && (
            <div className="rounded-2xl bg-black/35 p-4 shadow-2xl backdrop-blur mb-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-bold">Editable Areas</h3>
                <span className="text-xs text-neutral-300">
                  Only edits inside these blocks will be accepted
                </span>
              </div>

              {editableRanges === null ? (
                <div className="text-sm text-red-300">
                  We can’t locate the editable blocks. You may have changed text
                  outside the allowed areas. Try reloading or undoing changes
                  outside the intended block.
                </div>
              ) : (
                <ul className="space-y-2">
                  {editableRanges.map((r, i) => (
                    <li
                      key={`${r.name}-${i}`}
                      className="flex items-start justify-between rounded border border-white/10 bg-black/25 p-2"
                    >
                      <div className="pr-2">
                        <div className="text-sm font-semibold">
                          {r.name ? `Block: ${r.name}` : `Block ${i + 1}`}
                          <span className="ml-2 text-xs text-neutral-300">
                            (lines {r.lineStart}–{r.lineEnd})
                          </span>
                        </div>
                        {r.preview && (
                          <div className="mt-1 text-xs text-neutral-300">
                            <span className="opacity-70">Preview:</span>{" "}
                            <code>{r.preview}</code>
                          </div>
                        )}
                      </div>
                      <button
                        className="rounded bg-white/10 px-2 py-1 text-xs text-white hover:bg-white/20"
                        onClick={() => jumpToRange(r)}
                        type="button"
                      >
                        Jump to edit
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <textarea
            ref={workInputRef}
            value={work}
            onChange={(e) => setWork(e.target.value)}
            className="h-56 w-full rounded border border-white/20 bg-black/30 p-3 font-mono text-sm outline-none"
            disabled={court !== null}
          />

          <div className="mt-3 flex justify-end">
            <button
              onClick={async () => {
                const res = await evaluateRemote();
                if (res.ok)
                  toast.success("All checks passed!", { theme: "dark" });
                else
                  toast.error(res.reason || "Failed checks.", {
                    theme: "dark",
                  });
              }}
              className="rounded bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
            >
              Run Checks
            </button>
          </div>
        </div>

        {court && <CourtModal penalty={court} />}
      </section>
    </main>
  );
}

function CourtModal({ penalty }: { penalty: CourtPenalty }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" />
      <div className="relative z-10 w-[min(92vw,720px)] rounded-2xl border border-white/10 bg-neutral-950/95 p-6 text-white shadow-xl">
        <h3 className="mb-2 text-2xl font-extrabold tracking-wide">
          ⚖️ Court Room
        </h3>
        <div>
          <span className="opacity-70">Charge:</span> {penalty.title}
        </div>
        <div>
          <span className="opacity-70">Law:</span> {penalty.law}
        </div>
        <div>
          <span className="opacity-70">Outcome:</span> {penalty.consequence}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Link
            href="/court-room"
            className="rounded bg-white/10 px-4 py-2 hover:bg-white/20"
          >
            Return to Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
