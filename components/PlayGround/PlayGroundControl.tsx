// components/PlayGround/PlayGroundControl.tsx
"use client";

type Props = {
  title: string;
  setTitle: (v: string) => void;
  count: number;
  setCount: (n: number) => void;
  bg: string;
  setBg: (v: string) => void;
  fg: string;
  setFg: (v: string) => void;
  accent: string;
  setAccent: (v: string) => void;
};

export default function PlayGroundControl(p: Props) {
  const {
    title,
    setTitle,
    count,
    setCount,
    bg,
    setBg,
    fg,
    setFg,
    accent,
    setAccent,
  } = p;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm opacity-80">Page title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="px-3 py-2 rounded border border-border bg-background"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm opacity-80">Cards</span>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 rounded border border-border"
            onClick={() => setCount(Math.max(1, count - 1))}
          >
            –
          </button>
          <span className="min-w-6 text-center">{count}</span>
          <button
            className="px-3 py-2 rounded border border-border"
            onClick={() => setCount(Math.min(12, count + 1))}
          >
            +
          </button>
        </div>
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
  );
}
