"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const COURT_BG = "/court.png";
const DESK_BG = "/desk.png";

type Penalty = { title: string; law: string; consequence: string };
type Scenario = {
  name: string;
  description: string;
  sessionDurationSec: number;
  task: string;
  penalties: Penalty[];
};

export default function PagePlay() {
  const params = useSearchParams();
  const sid = params.get("sid");
  const codeQ = params.get("code");

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [work, setWork] = useState("");
  const [elapsed, setElapsed] = useState(0); // restored
  const [court, setCourt] = useState<Penalty | null>(null);
  const [running, setRunning] = useState(false);

  const target = useMemo(() => scenario?.sessionDurationSec ?? 600, [scenario]);
  const timerRef = useRef<number | null>(null);
  const startAtRef = useRef<number | null>(null);

  const bg = court ? COURT_BG : DESK_BG;

  // Load snapshot + scenario, then auto-start
  useEffect(() => {
    (async () => {
      let scode = codeQ;

      // If we have a session, pull latest snapshot for work/elapsed/scenarioCode
      if (sid) {
        const sres = await fetch(`/api/sessions/${sid}`);
        if (sres.ok) {
          const sj = await sres.json();
          const latest = sj.latest ?? null;
          if (latest?.work) setWork(latest.work);
          if (typeof latest?.elapsedSec === "number")
            setElapsed(latest.elapsedSec);
          if (!scode) scode = latest?.scenarioCode ?? undefined;
        }
      }

      if (!scode) {
        // no scenario to load
        return;
      }

      const r = await fetch(`/api/scenarios/${scode}`);
      if (!r.ok) return;
      const scen = await r.json();
      setScenario(scen);

      // auto start with restored elapsed
      startTimer(elapsed);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  function startTimer(alreadySec = 0) {
    const now = Date.now();
    startAtRef.current = now - alreadySec * 1000;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      const t = Math.floor(
        (Date.now() - (startAtRef.current || Date.now())) / 1000
      );
      setElapsed(t);
      if (t >= target) {
        clearInterval(timerRef.current!);
        if (scenario?.penalties?.length) setCourt(scenario.penalties[0]);
        setRunning(false);
      }
    }, 1000);
    setRunning(true);
  }

  // Persist progress every 5s
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

      <section className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6 text-white">
        <header className="flex items-center justify-between">
          <Link
            href="/court-room"
            className="rounded bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
          >
            ← Menu
          </Link>
          <div className="rounded bg-white/10 px-3 py-2 text-sm">
            {elapsed}s / {target}s
          </div>
        </header>

        <div className="rounded-2xl bg-black/35 p-5 shadow-2xl backdrop-blur">
          <h2 className="mb-2 text-xl font-bold">
            {scenario?.name ?? "No scenario loaded"}
          </h2>
          <p>{scenario?.description}</p>
          <pre className="max-h-[40vh] overflow-auto whitespace-pre-wrap break-words">
            {scenario?.task}
          </pre>
        </div>

        <div className="rounded-2xl bg-black/35 p-5 shadow-2xl backdrop-blur">
          <h2 className="mb-2 text-xl font-bold">Your Work</h2>
          <textarea
            value={work}
            onChange={(e) => setWork(e.target.value)}
            className="h-56 w-full rounded border border-white/20 bg-black/30 p-3 font-mono text-sm outline-none"
            disabled={court !== null}
          />
        </div>

        {court && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/80" />
            <div className="relative z-10 w-[min(92vw,720px)] rounded-2xl border border-white/10 bg-neutral-950/95 p-6 text-white shadow-xl">
              <h3 className="mb-2 text-2xl font-extrabold tracking-wide">
                ⚖️ Court Room
              </h3>
              <div>
                <span className="opacity-70">Charge:</span> {court.title}
              </div>
              <div>
                <span className="opacity-70">Law:</span> {court.law}
              </div>
              <div>
                <span className="opacity-70">Outcome:</span> {court.consequence}
              </div>
              <div className="mt-4 flex justify-end">
                <Link
                  href="/court-room"
                  className="rounded bg-white/10 px-4 py-2 hover:bg-white/20"
                >
                  Return to Menu
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
