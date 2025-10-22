// components/Tabs/TabsControl.tsx
"use client";

import { TabSpec } from "@/lib/generators/tabs";

export default function TabsControl({
  tabs,
  setTabs,
  active,
  setActive,
  bg,
  setBg,
  fg,
  setFg,
  accent,
  setAccent,
  title,
  setTitle,
}: {
  tabs: TabSpec[];
  setTabs: (t: TabSpec[]) => void;
  active: number;
  setActive: (n: number) => void;
  bg: string;
  setBg: (v: string) => void;
  fg: string;
  setFg: (v: string) => void;
  accent: string;
  setAccent: (v: string) => void;
  title: string;
  setTitle: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <label className="flex flex-col gap-1">
          <span className="text-sm opacity-80">Page Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="px-3 py-2 rounded border border-border bg-background"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm opacity-80">Active Index</span>
          <input
            type="number"
            min={0}
            max={tabs.length - 1}
            value={active}
            onChange={(e) =>
              setActive(
                Math.max(0, Math.min(tabs.length - 1, Number(e.target.value)))
              )
            }
            className="px-3 py-2 w-24 rounded border border-border bg-background"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm opacity-80">Background</span>
          <input
            type="color"
            value={bg}
            onChange={(e) => setBg(e.target.value)}
            className="h-10 w-20 rounded border border-border"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm opacity-80">Text</span>
          <input
            type="color"
            value={fg}
            onChange={(e) => setFg(e.target.value)}
            className="h-10 w-20 rounded border border-border"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm opacity-80">Accent</span>
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="h-10 w-20 rounded border border-border"
          />
        </label>
      </div>

      <div className="grid gap-3">
        {tabs.map((t, i) => (
          <div key={i} className="rounded border border-border p-3">
            <div className="flex items-center gap-3">
              <input
                value={t.label}
                onChange={(e) => {
                  const next = [...tabs];
                  next[i] = { ...next[i], label: e.target.value };
                  setTabs(next);
                }}
                className="px-3 py-2 rounded border border-border bg-background"
              />
              <button
                className="px-3 py-2 rounded border border-border"
                onClick={() => {
                  const next = tabs.filter((_, idx) => idx !== i);
                  setTabs(next);
                  setActive(Math.min(active, next.length - 1));
                }}
              >
                Remove
              </button>
            </div>
            <textarea
              value={t.html || ""}
              onChange={(e) => {
                const next = [...tabs];
                next[i] = { ...next[i], html: e.target.value };
                setTabs(next);
              }}
              className="mt-2 w-full h-28 p-2 rounded border border-border font-mono text-sm bg-background"
              placeholder="<p>Content...</p>"
            />
          </div>
        ))}
        <button
          className="px-3 py-2 rounded border border-border"
          onClick={() =>
            setTabs([
              ...tabs,
              { label: `Tab ${tabs.length + 1}`, html: "<p>New content</p>" },
            ])
          }
        >
          Add Tab
        </button>
      </div>
    </div>
  );
}
