// lib/generators/tabs.ts
export type TabSpec = { id?: string; label: string; html?: string };

export function buildTabsHTML(opts: {
  pageTitle?: string;
  tabs: TabSpec[];
  activeIndex?: number; // default 0
  bg?: string; // page background
  fg?: string; // text color
  accent?: string; // active tab + focus
  radius?: number; // px
}) {
  const {
    pageTitle = "Tabs",
    tabs,
    activeIndex = 0,
    bg = "#0b0f19",
    fg = "#eaeef7",
    accent = "#7c9cff",
    radius = 14,
  } = opts;

  const scheme = isDark(bg) ? "dark" : "light";
  const safeTabs = tabs.map((t, i) => ({
    id: t.id || `tab-${i + 1}`,
    label: t.label || `Tab ${i + 1}`,
    html:
      t.html ??
      `<p style="margin:0;">Content for ${esc(t.label || `Tab ${i + 1}`)}</p>`,
  }));

  const tabButtons = safeTabs
    .map((t, i) => {
      const selected = i === activeIndex;
      return `
<button role="tab"
  id="${t.id}-tab"
  aria-controls="${t.id}-panel"
  aria-selected="${selected ? "true" : "false"}"
  tabindex="${selected ? "0" : "-1"}"
  style="
    cursor:pointer; border:1px solid ${fg}2a; background:${
        selected ? accent : "transparent"
      };
    color:${
      selected ? "#fff" : fg
    }; padding:10px 14px; border-radius:${radius}px;
    margin-right:8px; outline:none;
  "
>${esc(t.label)}</button>`;
    })
    .join("");

  const panels = safeTabs
    .map((t, i) => {
      const hidden = i !== activeIndex;
      return `
<div role="tabpanel"
  id="${t.id}-panel"
  aria-labelledby="${t.id}-tab"
  ${hidden ? 'hidden="until-activated"' : ""}
  style="
    ${hidden ? "display:none;" : ""}
    padding:16px; border:1px solid ${fg}2a; border-radius:${radius}px; margin-top:12px;
    color:${fg};
  ">
  ${t.html}
</div>`;
    })
    .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${esc(pageTitle)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
</head>
<body style="margin:0; background:${bg}; color:${fg}; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial; color-scheme:${scheme};">
<header style="padding:16px;"><h1 style="margin:0; font-size:22px;">${esc(
    pageTitle
  )}</h1></header>

<main style="padding:24px; max-width:1100px; margin:0 auto;">
  <div role="tablist" aria-label="${esc(pageTitle)}" id="tablist"
    style="display:flex; align-items:center; flex-wrap:wrap;">
    ${tabButtons}
  </div>
  ${panels}
</main>

<script>
(function(){
  var accent='${accent}'; var fg='${fg}';
  var tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  var panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
  function activate(idx, focusBtn){
    tabs.forEach(function(btn,i){
      var sel = i===idx;
      btn.setAttribute('aria-selected', sel);
      btn.tabIndex = sel?0:-1;
      btn.style.background = sel?accent:'transparent';
      btn.style.color = sel?'#fff':fg;
      var panel = document.getElementById(btn.id.replace(/-tab$/,'-panel'));
      if(panel){ panel.style.display = sel ? 'block' : 'none'; }
    });
    if(focusBtn && tabs[idx]) tabs[idx].focus();
    var id = tabs[idx].id.replace(/-tab$/,'');
    try { document.cookie = 'lastTabId='+encodeURIComponent(id)+'; path=/; max-age='+(60*60*24*30); } catch(e){}
    if(history && history.replaceState){ history.replaceState(null,'','#'+id); }
  }
  tabs.forEach(function(btn, i){
    btn.addEventListener('click', function(){ activate(i,false); });
  });
  document.getElementById('tablist').addEventListener('keydown', function(e){
    var current = tabs.findIndex(function(b){ return b.getAttribute('aria-selected')==='true'; });
    if(e.key==='ArrowRight'){ e.preventDefault(); activate((current+1)%tabs.length,true); }
    if(e.key==='ArrowLeft'){ e.preventDefault(); activate((current-1+tabs.length)%tabs.length,true); }
    if(e.key==='Home'){ e.preventDefault(); activate(0,true); }
    if(e.key==='End'){ e.preventDefault(); activate(tabs.length-1,true); }
  });
  (function restore(){
    var hash = location.hash && location.hash.slice(1);
    var cookie = (document.cookie.match(/(?:^|; )lastTabId=([^;]+)/)||[])[1];
    var byId = hash || (cookie?decodeURIComponent(cookie):'');
    if(byId){
      var idx = tabs.findIndex(function(b){ return b.id.replace(/-tab$/,'')===byId; });
      if(idx>=0){ activate(idx,false); return; }
    }
    activate(${activeIndex}, false);
  }());
}());
</script>
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
function isDark(hex: string) {
  var m = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex || "");
  if (!m) return true;
  var r = parseInt(m[1], 16),
    g = parseInt(m[2], 16),
    b = parseInt(m[3], 16);
  var L = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
  return L < 0.5;
}
