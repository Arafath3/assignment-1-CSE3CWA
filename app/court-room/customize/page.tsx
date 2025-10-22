"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

export default function CustomizeScenarioPage() {
  const router = useRouter();
  useSearchParams(); // prevents tree-shake warning in some setups

  const [task, setTask] = useState("");
  const [description, setDescription] = useState("");
  const [sessionDuration, setSessionDuration] = useState(10); // minutes
  const [rules, setRules] = useState("");
  const [ambientMessages, setAmbientMessages] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sessionDuration < 1) {
      toast.error("Time limit must be ≥ 1 minute.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: task || "Untitled Scenario",
          description,
          sessionDurationSec: sessionDuration * 60,
          task,
          rulesText: rules,
          ambientMessages,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Create failed");
      setGeneratedCode(data.code);
      toast.success("Scenario created!");

      // optional: jump straight to play
      // router.push(`/court-room/play?code=${data.code}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create scenario");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center p-4"
      style={{ backgroundImage: "url('/court_room.png')" }} // from /public
    >
      <div className="mx-auto max-w-xl rounded-2xl bg-black/50 p-5 backdrop-blur">
        <h2 className="mb-4 text-center text-2xl font-black text-white uppercase tracking-widest">
          Create Custom Scenario
        </h2>

        {/* Launch-style nav buttons */}
        <div className="mb-4 flex gap-3">
          <PixelBtn onClick={() => router.push("/court-room")}>
            Back to Menu
          </PixelBtn>
          <PixelBtn onClick={() => router.push("/court-room/play")}>
            Play
          </PixelBtn>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-300">
              Task (code / quiz / text)
            </label>
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              required
              className="mt-1 w-full rounded bg-neutral-800 p-2 text-white"
              rows={6}
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="mt-1 w-full rounded bg-neutral-800 p-2 text-white"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-300">
              Time Limit (minutes, ≥ 1)
            </label>
            <input
              type="number"
              min={1}
              value={sessionDuration}
              onChange={(e) => setSessionDuration(Number(e.target.value))}
              className="mt-1 w-full rounded bg-neutral-800 p-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-300">
              Rules (free text)
            </label>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              className="mt-1 w-full rounded bg-neutral-800 p-2 text-white"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-300">
              Ambient Messages
            </label>
            <textarea
              value={ambientMessages}
              onChange={(e) => setAmbientMessages(e.target.value)}
              className="mt-1 w-full rounded bg-neutral-800 p-2 text-white"
              rows={3}
            />
          </div>

          <PixelBtn type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Scenario"}
          </PixelBtn>
        </form>

        {generatedCode && (
          <div className="mt-4 rounded border border-white/20 bg-black/40 p-3 text-white">
            <div className="text-sm opacity-80">Share Code</div>
            <div className="font-mono text-lg">{generatedCode}</div>
            <div className="mt-2 flex gap-2">
              <PixelBtn
                onClick={() => navigator.clipboard.writeText(generatedCode!)}
              >
                Copy
              </PixelBtn>
              <PixelBtn
                onClick={() =>
                  router.push(`/court-room/play?code=${generatedCode}`)
                }
              >
                Use in Play
              </PixelBtn>
            </div>
          </div>
        )}
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
        "group select-none rounded-md border-4 border-[#2e2e2e] bg-[#3d3d3d] px-4 py-2 font-black uppercase tracking-widest text-white shadow-[0_6px_0_#1a1a1a] transition active:translate-y-1 active:shadow-[0_4px_0_#1a1a1a] hover:bg-[#4a4a4a] " +
        className
      }
      style={{ imageRendering: "pixelated" as any }}
    >
      <span className="drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]">{children}</span>
    </button>
  );
}
