"use client";

import { useEffect, useState } from "react";
import { copyToClipboard, downloadAsHtml } from "@/lib/utils";

type Props = { html: string; filename?: string };

export default function PlayGroundPrev({
  html,
  filename = "horizontal-scroll.html",
}: Props) {
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    const v = localStorage.getItem("pg:view");
    if (v) setShowCode(v === "code");
  }, []);
  useEffect(() => {
    localStorage.setItem("pg:view", showCode ? "code" : "preview");
  }, [showCode]);

  return (
    <div
      className="relative rounded-xl border border-border bg-card"
      style={{ minHeight: 620, height: "64vh", maxHeight: 820 }}
    >
      {/* toolbar */}
      <div className="absolute right-2 top-2 flex gap-2 z-10">
        <button
          className="rounded-md border border-border bg-secondary px-3 py-1 text-sm text-secondary-foreground"
          onClick={() => setShowCode((v) => !v)}
          aria-pressed={showCode}
          aria-label={showCode ? "Show preview" : "Show code"}
          title={showCode ? "Preview" : "Code"}
        >
          {showCode ? "Preview" : "Code"}
        </button>

        {showCode && (
          <>
            <button
              className="rounded-md border border-border bg-primary px-3 py-1 text-sm text-primary-foreground"
              onClick={async () => {
                await copyToClipboard(html);
                alert("Copied!");
              }}
            >
              Copy
            </button>
            <button
              className="rounded-md border border-border bg-card px-3 py-1 text-sm"
              onClick={() => downloadAsHtml(filename, html)}
            >
              Download
            </button>
          </>
        )}
      </div>

      {/* content */}
      <div className="h-full w-full overflow-hidden rounded-xl">
        {showCode ? (
          <textarea
            spellCheck={false}
            value={html}
            readOnly
            className="h-full w-full resize-none rounded-xl bg-card p-4 font-mono text-xs text-card-foreground outline-none"
            aria-label="Generated HTML code"
          />
        ) : (
          <iframe
            title="Preview"
            srcDoc={html}
            className="block h-full w-full rounded-xl border-0 bg-background"
          />
        )}
      </div>

      <div className="pointer-events-none absolute bottom-2 left-3 text-xs text-muted-foreground">
        {showCode
          ? "code • Copy/Download →"
          : "preview • Click ‘Code’ to see HTML"}
      </div>
    </div>
  );
}
