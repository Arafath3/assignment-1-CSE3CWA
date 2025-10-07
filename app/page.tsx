// app/page.tsx
"use client";

import { useMemo, useState } from "react";
import PlayGroundControl from "@/components/PlayGround/PlayGroundControl";
import PlayGroundPrev from "@/components/PlayGround/PlayGroundPrev";
import { buildHorizontalScrollHTML } from "@/lib/generators/horizontalScroll";

export default function HomePage() {
  const [title, setTitle] = useState("Horizontal Scroll");
  const [count, setCount] = useState(3);
  const [bg, setBg] = useState("#0b0f19");
  const [fg, setFg] = useState("#eaeef7");
  const [accent, setAccent] = useState("#7c9cff");

  const html = useMemo(() => {
    const cards = Array.from({ length: count }, (_, i) => ({
      title: String(i + 1),
    }));
    // border alpha convenience if fg is hex; adjust if you like
    const border = fg.startsWith("#") ? `${fg}59` : "rgba(255,255,255,0.35)";
    return buildHorizontalScrollHTML({
      pageTitle: title,
      cards,
      bg,
      fg,
      accent,
      width: 520,
      height: 380,
      gap: 24,
      radius: 28,
      border,
    });
  }, [title, count, bg, fg, accent]);

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
      <PlayGroundPrev html={html} />
    </main>
  );
}
