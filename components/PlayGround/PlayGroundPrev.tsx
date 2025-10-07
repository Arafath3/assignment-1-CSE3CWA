// components/PlayGround/PlayGroundPrev.tsx
"use client";

import { useEffect, useState } from "react";
import { copyToClipboard, downloadAsHtml } from "@/lib/utils";

type Props = {
  html: string;
  filename?: string;
};

export default function PlayGroundPrev({
  html,
  filename = "horizontal-scroll.html",
}: Props) {
  const [showCode, setShowCode] = useState<boolean>(false);

  // remember last view
  useEffect(() => {
    const saved = localStorage.getItem("pg:view");
    if (saved) setShowCode(saved === "code");
  }, []);
  useEffect(() => {
    localStorage.setItem("pg:view", showCode ? "code" : "preview");
  }, [showCode]);

  return (
    <div
      className="relative rounded-xl border border-border bg-card"
      style={{ height: 460 }} // single fixed box height; tweak if you want
    >
      {/* Toolbar (top-right) */}
      <div className="absolute right-2 top-2 flex gap-2">
        <button
          className="rounded-md border border-border bg-secondary px-3 py-1 text-sm text-secondary-foreground"
          onClick={() => setShowCode((v) => !v)}
          aria-pressed={showCode}
          aria-label={showCode ? "Show preview" : "Show code"}
          title={showCode ? "Preview" : "Code"}
        >
          {showCode ? "Preview" : "Code"}
        </button>

        {showCode ? (
          <>
            <button
              className="rounded-md border border-border bg-primary px-3 py-1 text-sm text-primary-foreground"
              onClick={async () => {
                await copyToClipboard(html);
                alert("Copied!");
              }}
              aria-label="Copy code"
            >
              Copy
            </button>
            <button
              className="rounded-md border border-border bg-card px-3 py-1 text-sm"
              onClick={() => downloadAsHtml(filename, html)}
              aria-label="Download HTML file"
            >
              Download
            </button>
          </>
        ) : null}
      </div>

      {/* Content area */}
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
            className="h-full w-full rounded-xl bg-background"
          />
        )}
      </div>

      {/* Footer hint (bottom-left) */}
      <div className="pointer-events-none absolute bottom-2 left-3 text-xs text-muted-foreground">
        {showCode
          ? "Viewing code • Copy / Download on the right"
          : "Viewing preview • Click ‘Code’ to see HTML"}
      </div>
    </div>
  );
}
