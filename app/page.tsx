// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import PlayGroundControl from "@/components/PlayGround/PlayGroundControl";
import PlayGroundPrev from "@/components/PlayGround/PlayGroundPrev";
import CardEditor from "@/components/PlayGround/CardEditor";
import {
  buildHorizontalScrollHTML,
  HSCard,
} from "@/lib/generators/horizontalScroll";

export default function HomePage() {
  const [title, setTitle] = useState("Horizontal Scroll");
  const [count, setCount] = useState(3);
  const [bg, setBg] = useState("#0b0f19");
  const [fg, setFg] = useState("#eaeef7");
  const [accent, setAccent] = useState("#7c9cff");

  const [cards, setCards] = useState<HSCard[]>(() =>
    Array.from({ length: 3 }, (_, i) => ({ title: String(i + 1) }))
  );

  // keep cards array length in sync with count
  useEffect(() => {
    setCards((prev) => {
      const next = prev.slice(0, count);
      while (next.length < count) next.push({ title: String(next.length + 1) });
      // re-label titles if they were default numbers
      next.forEach((c, i) => {
        if (/^\d+$/.test(c.title)) c.title = String(i + 1);
      });
      return next;
    });
  }, [count]);

  const html = useMemo(() => {
    const border = /^#([a-f0-9]{6})$/i.test(fg)
      ? `${fg}59`
      : "rgba(255,255,255,0.35)";
    return buildHorizontalScrollHTML({
      pageTitle: title,
      cards,
      bg,
      fg,
      accent,
      width: 600,
      height: 420,
      gap: 28,
      radius: 32,
      border,
    });
  }, [title, cards, bg, fg, accent]);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Homepage — Code Generator</h1>

      <PlayGroundControl
        title={title}
        setTitle={setTitle}
        count={count}
        setCount={setCount}
        bg={bg}
        setBg={setBg}
        fg={fg}
        setFg={setFg}
        accent={accent}
        setAccent={setAccent}
      />

      {/* Per-slide images / titles */}
      <CardEditor cards={cards} setCards={setCards} />

      {/* Single box that toggles Preview/Code */}
      <PlayGroundPrev html={html} />
    </main>
  );
}
