// lib/generators/horizontalScroll.ts
export type HSCard = { title: string; body?: string };

export type HSOptions = {
  pageTitle?: string;
  cards?: HSCard[];
  bg?: string;
  fg?: string;
  accent?: string;
  width?: number;
  height?: number;
  gap?: number;
  radius?: number;
  border?: string;
};

export function buildHorizontalScrollHTML(opts: HSOptions = {}) {
  const {
    pageTitle = "Horizontal Scroll",
    cards = [{ title: "1" }, { title: "2" }, { title: "3" }],
    bg = "#0b0f19",
    fg = "#eaeef7",
    accent = "#7c9cff",
    width = 520,
    height = 380,
    gap = 24,
    radius = 28,
    border = "rgba(255,255,255,0.35)",
  } = opts;

  const cardHtml = cards
    .map(
      (c, i) => `
    <section role="group" aria-label="Card ${i + 1}"
      style="scroll-snap-align:center; min-width:${width}px; height:${height}px;
             display:flex; flex-direction:column; align-items:center; justify-content:center;
             border:1px solid ${border}; border-radius:${radius}px; margin-right:${gap}px; color:${fg};">
      <div style="font-size:28px; font-weight:600; margin-bottom:8px;">${esc(
        c.title
      )}</div>
      ${
        c.body
          ? `<p style="margin:0; padding:0 16px; text-align:center; line-height:1.5; opacity:.9;">${esc(
              c.body
            )}</p>`
          : ""
      }
    </section>
  `
    )
    .join("");

  const step = width + gap;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${esc(
    pageTitle
  )}</title><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0; background:${bg}; color:${fg}; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;">
<header style="padding:16px;"><h1 style="margin:0; font-size:22px;">${esc(
    pageTitle
  )}</h1></header>
<main style="padding:24px; max-width:1200px; margin:0 auto;">
  <div id="frame" role="region" aria-label="Horizontal Scroll"
       style="overflow:auto; padding:${gap}px; border:2px solid ${border}; border-radius:${
    radius + 12
  }px; scroll-behavior:smooth;"
       tabindex="0">
    <div style="display:flex; align-items:stretch; scroll-snap-type:x mandatory;">${cardHtml}</div>
  </div>
  <div style="margin-top:16px; display:flex; align-items:center; gap:8px;">
    <button id="leftBtn" aria-label="Scroll left"
      style="padding:10px 14px; border:1px solid ${accent}; background:transparent; color:${accent}; border-radius:10px; cursor:pointer;">◀</button>
    <button id="rightBtn" aria-label="Scroll right"
      style="padding:10px 14px; border:1px solid ${accent}; background:${accent}; color:#fff; border-radius:10px; cursor:pointer;">▶</button>
    <span style="margin-left:8px; opacity:.8; font-size:14px;">Tip: use Shift+Wheel or ← →</span>
  </div>
</main>
<script>(function(){
  var frame=document.getElementById('frame'); var step=${step};
  document.getElementById('leftBtn').onclick=function(){ frame.scrollBy({left:-step}); };
  document.getElementById('rightBtn').onclick=function(){ frame.scrollBy({left: step}); };
  frame.addEventListener('keydown',function(e){ if(e.key==='ArrowRight')frame.scrollBy({left:step}); if(e.key==='ArrowLeft')frame.scrollBy({left:-step}); });
  frame.addEventListener('wheel',function(e){ if(e.shiftKey){ e.preventDefault(); frame.scrollBy({left:e.deltaY>0?step/2:-step/2}); } }, {passive:false});
}());</script>
</body></html>`;
}

function esc(s: string) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
