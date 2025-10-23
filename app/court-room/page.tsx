"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import bg from "../../public/court_room.png";

const SESSION_KEY = "court_session_id";

export default function CourtRoomPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [latest, setLatest] = useState<any>(null); // ⟵ keep latest snapshot
  const [hasSave, setHasSave] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(true);

  // modals
  const [showAdd, setShowAdd] = useState(false);

  // add-code
  const [incomingShareId, setIncomingShareId] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // default state (if you still want to create a first snapshot)
  const defaultGameState = useMemo(
    () => ({
      version: 1,
      scene: "courtroom_lobby",
      progress: { caseCount: 0, lastCheckpoint: "entrance", inventory: [] },
      flags: { tutorialShown: false },
      updatedAt: new Date().toISOString(),
    }),
    []
  );

  // Read existing session on load
  useEffect(() => {
    (async () => {
      const id =
        typeof window !== "undefined"
          ? localStorage.getItem(SESSION_KEY)
          : null;
      if (!id) {
        setBusy(false);
        return;
      }

      const res = await fetch(`/api/sessions/${id}`);
      if (res.ok) {
        const j = await res.json();
        setSessionId(id);
        setLatest(j.latest ?? null);
        setHasSave(Boolean(j.latest));
      }
      setBusy(false);
    })();
  }, []);

  // Ensure a session exists
  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId;
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        /* no scenario yet */
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      alert(`Could not start a new session.\n${t}`);
      throw new Error("session create failed");
    }
    const j = await res.json();
    localStorage.setItem(SESSION_KEY, j.id);
    setSessionId(j.id);
    return j.id as string;
  }

  // If no save -> create one (optional)
  async function ensureDefaultSave(id: string) {
    if (hasSave) return;
    await fetch(`/api/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: defaultGameState }),
    });
    setHasSave(true);
  }

  // Play (new)
  async function onPlayClick() {
    setBusy(true);
    const id = await ensureSession();
    await ensureDefaultSave(id);
    setBusy(false);
    // If there is already a scenario in latest, continue into it; otherwise open Add Code
    const r = await fetch(`/api/sessions/${id}`);
    const j = await r.json();
    const scode = j.latest?.scenarioCode ?? null;
    if (scode) {
      router.push(
        `/court-room/play?sid=${id}&code=${encodeURIComponent(scode)}`
      );
    } else {
      setShowAdd(true);
    }
  }

  // Continue (always go to the saved scenario)
  async function onContinue() {
    if (!sessionId) return onPlayClick();
    const r = await fetch(`/api/sessions/${sessionId}`);
    if (!r.ok) return onPlayClick();
    const j = await r.json();
    const scode = j.latest?.scenarioCode ?? null;
    if (!scode) {
      // session exists but no scenario picked yet
      setShowAdd(true);
      return;
    }
    router.push(
      `/court-room/play?sid=${sessionId}&code=${encodeURIComponent(scode)}`
    );
  }

  // Add Code → bind scenario to this session and jump into Play
  async function onFetchShareAndStart() {
    if (!incomingShareId.trim()) return;
    setAddLoading(true);
    try {
      // Make sure session exists
      const sid = await ensureSession();

      // Validate scenario code exists
      const sRes = await fetch(`/api/scenarios/${incomingShareId}`);
      if (!sRes.ok) {
        alert("No scenario found for that code.");
        return;
      }

      // Write scenarioCode into the snapshot so Continue works later
      await fetch(`/api/sessions/${sid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioCode: incomingShareId }),
      });

      setShowAdd(false);
      router.push(
        `/court-room/play?sid=${sid}&code=${encodeURIComponent(
          incomingShareId
        )}`
      );
    } finally {
      setAddLoading(false);
      // after PATCH scenarioCode succeeds:
      setLatest({ scenarioCode: incomingShareId, elapsedSec: 0, work: "" });
      setHasSave(true);
    }
  }

  return (
    <main
      className="relative min-h-[calc(100vh-0px)] w-full overflow-hidden"
      style={{
        backgroundImage: `url(${bg.src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <section className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="flex w-full max-w-xl flex-col items-center gap-6 rounded-2xl bg-black/40 p-8 shadow-2xl backdrop-blur">
          <h1 className="text-center text-4xl font-black uppercase tracking-widest text-white">
            Court Room
          </h1>
          <p className="text-center text-sm uppercase tracking-wider text-neutral-200 opacity-90">
            {busy
              ? "…"
              : sessionId
              ? `Session: ${sessionId.slice(0, 8)}…`
              : "New player"}
          </p>

          <div className="mt-2 flex w-full flex-col gap-4">
            <PixelBtn
              onClick={hasSave ? onContinue : onPlayClick}
              disabled={busy}
            >
              {hasSave ? "Continue" : "Play"}
            </PixelBtn>

            <PixelBtn onClick={() => setShowAdd(true)} disabled={busy}>
              Add Code
            </PixelBtn>

            <PixelBtn onClick={() => router.push("/court-room/customize")}>
              Customize
            </PixelBtn>
          </div>
        </div>
      </section>

      {showAdd && (
        <Modal title="Add Code" onClose={() => setShowAdd(false)}>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-neutral-200">
              Scenario Code
            </label>
            <input
              className="w-full rounded border border-white/20 bg-black/40 px-3 py-2 text-white outline-none"
              placeholder="enter scenario code"
              value={incomingShareId}
              onChange={(e) => setIncomingShareId(e.target.value.trim())}
            />
            <PixelBtn
              onClick={onFetchShareAndStart}
              disabled={addLoading || !incomingShareId}
            >
              {addLoading ? "Loading…" : "Start"}
            </PixelBtn>
          </div>
        </Modal>
      )}
    </main>
  );
}

/* --- helpers (unchanged) --- */
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 w-[min(92vw,720px)] rounded-2xl border border-white/10 bg-neutral-900/90 p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-neutral-300 hover:text-white"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PixelBtn({
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={
        "group relative w-full select-none rounded-md border-4 border-[#2e2e2e] bg-[#3d3d3d] px-5 py-3 font-black uppercase tracking-widest text-white shadow-[0_6px_0_#1a1a1a] transition active:translate-y-1 active:shadow-[0_4px_0_#1a1a1a] hover:bg-[#4a4a4a] " +
        className
      }
      style={{ imageRendering: "pixelated" as any }}
    >
      <span className="drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]">{children}</span>
    </button>
  );
}
