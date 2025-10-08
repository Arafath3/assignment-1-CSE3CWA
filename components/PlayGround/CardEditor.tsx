// components/PlayGround/CardEditor.tsx
"use client";

import { HSCard } from "@/lib/generators/horizontalScroll";
import { useRef } from "react";

type Props = {
  cards: HSCard[];
  setCards: (cards: HSCard[]) => void;
};

export default function CardEditor({ cards, setCards }: Props) {
  const fileInputs = useRef<HTMLInputElement[]>([]);

  const update = (idx: number, patch: Partial<HSCard>) => {
    const next = cards.slice();
    next[idx] = { ...next[idx], ...patch };
    setCards(next);
  };

  const onFile = (idx: number, file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update(idx, { imgSrc: String(reader.result) }); // data URL
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid gap-3">
      {cards.map((c, i) => (
        <div key={i} className="rounded-lg border border-border p-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm opacity-80">Title #{i + 1}</span>
              <input
                value={c.title}
                onChange={(e) => update(i, { title: e.target.value })}
                className="px-3 py-2 rounded border border-border bg-background"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm opacity-80">Image URL</span>
              <input
                placeholder="https://…"
                value={c.imgSrc?.startsWith("data:") ? "" : c.imgSrc || ""}
                onChange={(e) =>
                  update(i, { imgSrc: e.target.value || undefined })
                }
                className="w-[320px] px-3 py-2 rounded border border-border bg-background"
              />
            </label>

            <div className="flex items-center gap-2">
              <input
                ref={(el) => {
                  if (el) fileInputs.current[i] = el;
                }}
                type="file"
                accept="image/*"
                onChange={(e) => onFile(i, e.target.files?.[0])}
                className="block text-sm"
              />
              {c.imgSrc && (
                <button
                  className="px-3 py-2 rounded border border-border"
                  onClick={() => update(i, { imgSrc: undefined })}
                >
                  Clear
                </button>
              )}
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-sm opacity-80">Alt text</span>
              <input
                value={c.imgAlt || ""}
                onChange={(e) => update(i, { imgAlt: e.target.value })}
                placeholder={c.title}
                className="px-3 py-2 rounded border border-border bg-background"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm opacity-80">Fit</span>
              <select
                value={c.imgFit || "cover"}
                onChange={(e) =>
                  update(i, { imgFit: e.target.value as "cover" | "contain" })
                }
                className="px-3 py-2 rounded border border-border bg-background"
              >
                <option value="cover">cover (fill)</option>
                <option value="contain">contain</option>
              </select>
            </label>
          </div>

          {c.imgSrc ? (
            <div className="mt-2 flex items-center gap-3">
              <img
                src={c.imgSrc}
                alt="preview"
                className="h-24 w-36 rounded-md border border-border object-cover"
              />
              <span className="text-xs text-muted-foreground">Preview</span>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
