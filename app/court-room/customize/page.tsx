"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

export default function CustomizeScenarioPage() {
  const router = useRouter();
  useSearchParams(); // keeps Next happy in some setups

  const [task, setTask] = useState("");
  const [description, setDescription] = useState("");
  const [sessionDuration, setSessionDuration] = useState(10); // minutes
  const [rules, setRules] = useState("");
  const [ambientMessages, setAmbientMessages] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ---- helpers ----
  function parseAmbientInput(s: string): string[] {
    return (s || "")
      .split(/\r?\n|,/)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  function hasPatchMarkers(src: string): boolean {
    return /#\s*patch\s+\w+/i.test(src) && /#\s*endpatch/i.test(src);
  }

  useEffect(() => {
    // gentle heads-up for authors
    if (task && !hasPatchMarkers(task)) {
      // soft warn; don’t block saving
      console.debug(
        "Tip: add #patch <name> … #endpatch around the editable area."
      );
    }
  }, [task]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (sessionDuration < 1) {
      toast.error("Time limit must be ≥ 1 minute.");
      return;
    }

    const ambientArr = parseAmbientInput(ambientMessages);

    // Soft validation: encourage using at least 1 patch block
    if (!hasPatchMarkers(task)) {
      toast.warn(
        "Tip: surround the editable area with '#patch <name>' and '#endpatch'. Students won’t see these markers in Play.",
        { autoClose: 6000 }
      );
    }

    setSaving(true);
    try {
      // Persist in the shapes our Play/Evaluator expect.
      const payload = {
        name: task
          ? task.split("\n")[0].slice(0, 80) || "Untitled Scenario"
          : "Untitled Scenario",
        description,
        sessionDurationSec: sessionDuration * 60,
        task, // includes #patch ... #endpatch (hidden from students in Play)
        rulesText: rules, // creator-only DSL
        customRules: { ambientMessages: ambientArr },
        ambient: { messages: ambientArr },
      };

      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Parse response robustly (handles non-JSON errors too)
      let data: any = null;
      let text = "";
      const ct = res.headers.get("content-type") || "";
      try {
        if (ct.includes("application/json")) data = await res.json();
        else text = await res.text();
      } catch {
        /* ignore parse errors */
      }

      if (!res.ok) {
        const msg = data?.error || text || `Create failed (HTTP ${res.status})`;
        throw new Error(msg);
      }

      const code = String(data?.code || "");
      setGeneratedCode(code);
      toast.success("Scenario created!");

      // optional: jump straight to play
      // router.push(`/court-room/play?code=${code}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to create scenario");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center p-4"
      style={{ backgroundImage: "url('/court_room.png')" }}
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-neutral-200">
              Task (starter code / text)
            </label>
            <p className="mt-1 text-xs text-neutral-300">
              Wrap the editable area with hidden anchors (students won’t see
              these in Play):
              <br />
              <code className="opacity-90">
                {/* no backticks inside JSX */}
                {
                  // shown as text only
                }
              </code>
              <pre className="mt-2 whitespace-pre-wrap rounded bg-neutral-900 p-2 text-xs text-neutral-200">
                {`function inputSanitization(input) {
  // #patch sanitize
  return input; // student must change inside this block
  // #endpatch
}`}
              </pre>
            </p>
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              required
              className="mt-2 w-full rounded bg-neutral-800 p-2 text-white"
              rows={8}
              placeholder={`Paste your starter code here.\nRemember to add "#patch <name>" and "#endpatch" around the lines students should change.`}
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-200">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="mt-1 w-full rounded bg-neutral-800 p-2 text-white"
              rows={3}
              placeholder="What should the student achieve? (e.g., 'Sanitize the input to remove scripts, escape HTML, etc.')"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-200">
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
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm text-neutral-200">
                Rules (creater-only DSL)
              </label>
            </div>
            {/* DSL Note */}
            <div className="rounded border border-white/10 bg-black/40 p-3 text-xs text-neutral-200">
              <div className="font-semibold mb-1">How to write rules</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <code>#mustChange &lt;patchName&gt;</code> — user must modify
                  that patch compared to the starter.
                </li>
                <li>
                  <code>#mustMatch &lt;patchName&gt; /regex/i</code> — that
                  patch’s content must match a pattern.
                </li>
                <li>
                  <code>#forbidIn &lt;patchName&gt; /regex/</code> — pattern is
                  not allowed inside that patch.
                </li>
                <li>
                  <code>#require /regex/</code> — global pattern must appear
                  somewhere in the full code.
                </li>
                <li>
                  <code>#forbid /regex/</code> — global pattern is banned
                  anywhere in the full code.
                </li>
                <li>
                  <code>#test someCall(…)</code>{" "}
                  <span className="opacity-70">==</span> <code>"expected"</code>{" "}
                  — run a behavioral check.
                </li>
              </ul>
              <div className="mt-2">
                Example:
                <pre className="mt-1 whitespace-pre-wrap rounded bg-neutral-900 p-2 text-[11px] text-neutral-100">
                  {`#mustChange sanitize
#mustMatch  sanitize /return\\s+sanitize\\(/i
#forbidIn   sanitize /eval\\(|innerHTML\\s*=|document\\.write/i
#require    /function\\s+inputSanitization/i
#test inputSanitization("<script>alert(1)</script>") == ""`}
                </pre>
              </div>
            </div>

            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              className="mt-2 w-full rounded bg-neutral-800 p-2 text-white"
              rows={6}
              placeholder={`Add one rule per line, e.g.:\n#mustChange sanitize\n#forbidIn sanitize /eval\\(/`}
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-200">
              Ambient Messages
            </label>
            <p className="mt-1 text-xs text-neutral-300">
              One message per line (e.g., <em>“Boss: status on sprint 1?”</em>).
              Commas also work, but lines are clearer.
            </p>
            <textarea
              value={ambientMessages}
              onChange={(e) => setAmbientMessages(e.target.value)}
              className="mt-1 w-full rounded bg-neutral-800 p-2 text-white"
              rows={4}
              placeholder={`Boss: status on sprint 1?\nFamily: can you pick up the kids?\nAgile: change title colour to red`}
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
