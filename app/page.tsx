"use client";

import { useEffect, useMemo } from "react";
import PlayGroundPrev from "@/components/PlayGround/PlayGroundPrev";
import PlayGroundControl from "@/components/PlayGround/PlayGroundControl";
import CardEditor from "@/components/PlayGround/CardEditor";
import TabsControl from "@/components/Tabs/TabsControl";
import {
  HSCard,
  buildHorizontalScrollHTML,
} from "@/lib/generators/horizontalScroll";
import { TabSpec, buildTabsHTML } from "@/lib/generators/tabs";
import { usePersistentState } from "@/lib/persist";

type GenType = "carousel" | "tabs";

export default function HomePage() {
  const [gen, setGen] = usePersistentState<GenType>("gen.type", "carousel");

  const [bg, setBg] = usePersistentState<string>("gen.bg", "#0b0f19");
  const [fg, setFg] = usePersistentState<string>("gen.fg", "#eaeef7");
  const [accent, setAccent] = usePersistentState<string>(
    "gen.accent",
    "#7c9cff"
  );

  const [carTitle, setCarTitle] = usePersistentState<string>(
    "carousel.title",
    "Horizontal Scroll"
  );
  const [count, setCount] = usePersistentState<number>("carousel.count", 3);
  const [cards, setCards] = usePersistentState<HSCard[]>(
    "carousel.cards",
    Array.from({ length: 3 }, (_, i) => ({ title: String(i + 1) }))
  );
  useEffect(() => {
    setCards((prev) => {
      const next = prev.slice(0, count);
      while (next.length < count) next.push({ title: String(next.length + 1) });
      next.forEach((c, i) => {
        if (/^\d+$/.test(c.title)) c.title = String(i + 1);
      });
      return next;
    });
  }, [count, setCards]);

  const [tabsTitle, setTabsTitle] = usePersistentState<string>(
    "tabs.title",
    "Lesson Tabs"
  );
  const [active, setActive] = usePersistentState<number>("tabs.active", 0);
  const [tabs, setTabs] = usePersistentState<TabSpec[]>("tabs.items", [
    { label: "Overview", html: "<p>Welcome!</p>" },
    { label: "Resources", html: "<ul><li>PDF</li><li>Video</li></ul>" },
    { label: "Quiz", html: "<p>10 questions.</p>" },
  ]);

  const html = useMemo(() => {
    if (gen === "tabs") {
      return buildTabsHTML({
        pageTitle: tabsTitle,
        tabs,
        activeIndex: Math.max(0, Math.min(active, tabs.length - 1)),
        bg,
        fg,
        accent,
      });
    }
    const cardBorder = /^#([a-f0-9]{6})$/i.test(fg)
      ? `${fg}59`
      : "rgba(255,255,255,0.35)";
    return buildHorizontalScrollHTML({
      pageTitle: carTitle,
      cards,
      bg,
      fg,
      accent,
      width: 600,
      height: 420,
      gap: 28,
      radius: 32,
      frameBorder: "none",
      cardBorder,
    });
  }, [gen, tabsTitle, tabs, active, carTitle, cards, bg, fg, accent]);

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-sm opacity-80">Generate:</span>
        <button
          className={`px-3 py-2 rounded border border-border ${
            gen === "carousel" ? "bg-primary text-primary-foreground" : ""
          }`}
          onClick={() => setGen("carousel")}
        >
          Carousel
        </button>
        <button
          className={`px-3 py-2 rounded border border-border ${
            gen === "tabs" ? "bg-primary text-primary-foreground" : ""
          }`}
          onClick={() => setGen("tabs")}
        >
          Tabs
        </button>
      </div>

      {gen === "carousel" ? (
        <>
          <PlayGroundControl
            title={carTitle}
            setTitle={setCarTitle}
            count={count}
            setCount={setCount}
            bg={bg}
            setBg={setBg}
            fg={fg}
            setFg={setFg}
            accent={accent}
            setAccent={setAccent}
          />
          <CardEditor cards={cards} setCards={setCards} />
        </>
      ) : (
        <TabsControl
          tabs={tabs}
          setTabs={setTabs}
          active={active}
          setActive={setActive}
          bg={bg}
          setBg={setBg}
          fg={fg}
          setFg={setFg}
          accent={accent}
          setAccent={setAccent}
          title={tabsTitle}
          setTitle={setTabsTitle}
        />
      )}

      <PlayGroundPrev
        html={html}
        filename={gen === "tabs" ? "tabs.html" : "carousel.html"}
      />
    </main>
  );
}
