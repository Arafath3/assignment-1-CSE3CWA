// lib/rules.ts

// ---------- Types ----------
export type Penalty = { title: string; law: string; consequence: string };

export type Scenario = {
  code: string;
  name: string;
  description: string;
  sessionDurationSec: number;
  task: string; // starter with #patch ... #endpatch markers
  rulesText?: string; // teacher-written DSL
  ambient?: { messages?: string[] } | string;
  customRules?: { ambientMessages?: string[] | string } | string | null;
};

export type ParsedRule =
  | { kind: "require"; re: RegExp }
  | { kind: "forbid"; re: RegExp }
  | { kind: "test"; call: string; expect: any }
  | { kind: "mustChange"; patch: string }
  | { kind: "mustMatch"; patch: string; re: RegExp }
  | { kind: "forbidIn"; patch: string; re: RegExp };

export type PatchBlock = {
  name: string;
  fullStart: number; // index of line with "#patch name"
  fullEnd: number; // index just after line with "#endpatch"
  innerStart: number; // start index of inner content
  innerEnd: number; // end index of inner content
  inner: string; // inner content
};

// ---- helpers ----
export function toRegex(fragment: string): RegExp {
  const m = fragment.match(/^\/(.+)\/([a-z]*)$/i);
  if (m) return new RegExp(m[1], m[2] || "");
  return new RegExp(escapeRegExp(fragment), "i");
}
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------- DSL parsing ----------
export function parseRules(text: string | undefined): ParsedRule[] {
  if (!text) return [];
  const out: ParsedRule[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => l.startsWith("#"));

  for (const line of lines) {
    if (line.startsWith("#require")) {
      out.push({
        kind: "require",
        re: toRegex(line.replace(/^#require\s+/, "")),
      });
      continue;
    }
    if (line.startsWith("#forbid")) {
      out.push({
        kind: "forbid",
        re: toRegex(line.replace(/^#forbid\s+/, "")),
      });
      continue;
    }
    if (line.startsWith("#test")) {
      const rest = line.replace(/^#test\s+/, "");
      const m = rest.match(/^(.*)\s*==\s*(.+)$/);
      if (m) {
        const call = m[1].trim();
        let expect: any;
        try {
          expect = JSON.parse(m[2].trim());
        } catch {
          const s = m[2].trim();
          expect = /^".*"$/.test(s) || /^'.*'$/.test(s) ? s.slice(1, -1) : s;
        }
        out.push({ kind: "test", call, expect });
      }
      continue;
    }
    if (line.startsWith("#mustChange")) {
      const tag = line.replace(/^#mustChange\s+/, "").trim();
      if (tag) out.push({ kind: "mustChange", patch: tag });
      continue;
    }
    if (line.startsWith("#mustMatch")) {
      const rest = line.replace(/^#mustMatch\s+/, "").trim();
      const m = rest.match(/^(\S+)\s+(.+)$/); // "<patch> <regex>"
      if (m) out.push({ kind: "mustMatch", patch: m[1], re: toRegex(m[2]) });
      continue;
    }
    if (line.startsWith("#forbidIn")) {
      const rest = line.replace(/^#forbidIn\s+/, "").trim();
      const m = rest.match(/^(\S+)\s+(.+)$/);
      if (m) out.push({ kind: "forbidIn", patch: m[1], re: toRegex(m[2]) });
      continue;
    }
  }
  return out;
}

// ---------- Patch utilities ----------
export function extractPatchBlocks(src: string): PatchBlock[] {
  const blocks: PatchBlock[] = [];
  const reStart = /(^.*?#\s*patch\s+([A-Za-z0-9_\-]+).*$)/im;
  const reEnd = /(^.*?#\s*endpatch.*$)/im;

  let rest = src;
  let globalOffset = 0;

  while (true) {
    const mStart = reStart.exec(rest);
    if (!mStart) break;

    const startLine = mStart[1];
    const name = mStart[2];

    const startAbs = globalOffset + (mStart.index ?? 0);
    const afterStart = mStart.index! + startLine.length;
    const restAfterStart = rest.slice(afterStart);

    const mEnd = reEnd.exec(restAfterStart);
    if (!mEnd) break; // malformed; ignore tail

    const endLine = mEnd[1];
    const innerStartRel = afterStart;
    const innerEndRel = afterStart + mEnd.index!;
    const endAbs = globalOffset + afterStart + mEnd.index! + endLine.length;

    const inner = rest.slice(innerStartRel, innerEndRel);

    blocks.push({
      name,
      fullStart: startAbs,
      fullEnd: endAbs,
      innerStart: globalOffset + innerStartRel,
      innerEnd: globalOffset + innerEndRel,
      inner,
    });

    const advanceBy = afterStart + mEnd.index! + endLine.length;
    globalOffset += advanceBy;
    rest = rest.slice(advanceBy);
  }

  return blocks;
}

// Remove the #patch / #endpatch lines (students never see these)
export function stripPatchMarkers(src: string): string {
  return src
    .split(/\r?\n/)
    .filter((l) => !/#\s*(patch|endpatch)\b/i.test(l))
    .join("\n");
}

// Build the list of OUTSIDE segments (anchors) split by patches.
// We rtrim each line so anchors don't care about trailing spaces/tabs.
export function splitVisibleIntoAnchors(baseWithMarkers: string) {
  const blocks = extractPatchBlocks(baseWithMarkers);
  const rtrimLines = (s: string) => s.replace(/[ \t]+$/gm, "");

  const anchors: string[] = [];
  const originalPatchBodies: string[] = [];

  let cursor = 0;
  for (const b of blocks) {
    const before = baseWithMarkers.slice(cursor, b.fullStart);
    anchors.push(rtrimLines(stripPatchMarkers(before)));
    originalPatchBodies.push(b.inner);
    cursor = b.fullEnd;
  }
  // tail (after the last patch)
  anchors.push(rtrimLines(stripPatchMarkers(baseWithMarkers.slice(cursor))));

  return { anchors, patchBodies: originalPatchBodies, blocks };
}

// ---------- Extract student's patch bodies from visible text ----------
// Robust, 1 body per patch. Uses a single non-greedy regex with captured groups.
export function extractStudentPatchesFromVisible(
  baseWithMarkers: string,
  studentVisible: string
): { ok: true; bodies: string[] } | { ok: false; why: string } {
  const { anchors, blocks } = splitVisibleIntoAnchors(baseWithMarkers);

  // If there are N patches, there are N+1 anchors. Build:
  // ^anchor0([\s\S]*?)anchor1([\s\S]*?)...anchorN$
  const parts: string[] = [];
  for (let i = 0; i < anchors.length; i++) {
    parts.push(escapeRegExp(anchors[i]));
    if (i < anchors.length - 1) parts.push("([\\s\\S]*?)");
  }
  const re = new RegExp("^" + parts.join("") + "$");

  const m = re.exec(studentVisible);
  if (!m) {
    return {
      ok: false,
      why: "It looks like you modified text outside the allowed regions. Please only edit inside the editable area.",
    };
  }

  const groups = m.slice(1); // one per patch
  if (groups.length !== blocks.length) {
    return {
      ok: false,
      why: "Editable region mismatch. Please reload the page and only edit inside the specified block.",
    };
  }

  return { ok: true, bodies: groups };
}

// Normalize code prior to comparing starter vs student inside a patch
export function normalizeCodeForCompare(s: string) {
  return (s ?? "")
    .replace(/\/\/.*$/gm, "") // line comments
    .replace(/\/\*[\s\S]*?\*\//gm, "") // block comments
    .replace(/\s+/g, "")
    .trim();
}

// Reconstruct full user code by replacing each patch’s inner content with student body
export function reconstructUserCode(
  baseWithMarkers: string,
  newBodies: string[]
): string {
  const blocks = extractPatchBlocks(baseWithMarkers);
  if (blocks.length !== newBodies.length) return baseWithMarkers;

  // splice from the end to keep indices valid
  let acc = baseWithMarkers;
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i];
    acc = acc.slice(0, b.innerStart) + newBodies[i] + acc.slice(b.innerEnd);
  }
  return acc;
}

// ---------- Sandbox runner ----------
export function runTestInSandbox(userCode: string, call: string) {
  const wrapper = `
    "use strict";
    // lock down common globals, but DON'T bind 'eval' in strict mode
    const window = undefined,
          document = undefined,
          globalThis = undefined,
          Function = undefined,
          require = undefined,
          process = undefined,
          module = undefined;

    ${userCode}

    return (function () {
      try { return (${call}); }
      catch (e) { throw e; }
    })();
  `;
  const fn = new Function(wrapper);
  return fn();
}

// ---------- Server-side evaluation ----------
export function evaluateRulesServer(
  scenario: Scenario,
  studentVisible: string
): { passed: true } | { passed: false; reason: string } {
  const base = scenario.task || "";
  const rules = parseRules(scenario.rulesText);

  // 1) Extract student patch bodies from the visible text (anchors must be intact)
  const ex = extractStudentPatchesFromVisible(base, studentVisible);
  if (!ex.ok) {
    return { passed: false, reason: ex.why };
  }

  // 2) Reconstruct full user code (with markers) for global checks/tests
  const userFull = reconstructUserCode(base, ex.bodies);

  // 3) Patch-level enforcement
  const blocks = extractPatchBlocks(base);
  const mapPatch = new Map<string, { base: string; user: string }>();
  blocks.forEach((b, i) => {
    mapPatch.set(b.name, { base: b.inner, user: ex.bodies[i] });
  });

  for (const r of rules) {
    if (r.kind === "mustChange") {
      const P = mapPatch.get(r.patch);
      if (!P)
        return {
          passed: false,
          reason: `Missing editable region "${r.patch}".`,
        };
      if (normalizeCodeForCompare(P.base) === normalizeCodeForCompare(P.user)) {
        return {
          passed: false,
          reason: `You must modify the "${r.patch}" section (it still matches the starter).`,
        };
      }
    }
    if (r.kind === "mustMatch") {
      const P = mapPatch.get(r.patch);
      if (!P)
        return {
          passed: false,
          reason: `Missing editable region "${r.patch}".`,
        };
      if (!r.re.test(P.user)) {
        return {
          passed: false,
          reason: `Section "${r.patch}" does not match expected pattern ${r.re}.`,
        };
      }
    }
    if (r.kind === "forbidIn") {
      const P = mapPatch.get(r.patch);
      if (!P)
        return {
          passed: false,
          reason: `Missing editable region "${r.patch}".`,
        };
      if (r.re.test(P.user)) {
        return {
          passed: false,
          reason: `Forbidden pattern ${r.re} found in "${r.patch}".`,
        };
      }
    }
  }

  // 4) Global regex require/forbid on userFull
  for (const r of rules) {
    if (r.kind === "require" && !r.re.test(userFull)) {
      return { passed: false, reason: `Missing requirement: ${r.re}` };
    }
    if (r.kind === "forbid" && r.re.test(userFull)) {
      return { passed: false, reason: `Forbidden usage: ${r.re}` };
    }
  }

  // 5) Behavioral tests
  for (const r of rules) {
    if (r.kind !== "test") continue;
    try {
      const result = runTestInSandbox(userFull, r.call);
      if (JSON.stringify(result) !== JSON.stringify(r.expect)) {
        return {
          passed: false,
          reason: `Test failed: ${r.call} !== ${JSON.stringify(r.expect)}`,
        };
      }
    } catch (e: any) {
      return {
        passed: false,
        reason: `Test threw: ${String(e?.message || e)}`,
      };
    }
  }

  return { passed: true };
}

// ---------- Editable ranges for UI ----------
export type EditableRange = {
  name: string;
  start: number; // char index in visible text
  end: number; // char index in visible text
  lineStart: number; // 1-based
  lineEnd: number; // 1-based
  preview: string; // first non-empty line inside the block
};

// Map patches to visible positions (one range per patch).
export function locateEditableRanges(
  baseWithMarkers: string,
  studentVisible: string
): EditableRange[] | null {
  const { anchors, blocks } = splitVisibleIntoAnchors(baseWithMarkers);
  const ranges: EditableRange[] = [];

  const lineOf = (idx: number) =>
    studentVisible.slice(0, idx).split(/\r?\n/).length;

  let pos = 0;
  for (let i = 0; i < anchors.length; i++) {
    const anchor = anchors[i];
    const idx = studentVisible.indexOf(anchor, pos);
    if (idx === -1) return null;

    if (i > 0) {
      const start = pos;
      const end = idx;
      const name = blocks[i - 1]?.name ?? `block-${i}`;
      const segment = studentVisible.slice(start, end);
      const preview = (
        segment.split(/\r?\n/).find((l) => l.trim().length) || ""
      )
        .trim()
        .slice(0, 80);

      ranges.push({
        name,
        start,
        end,
        lineStart: lineOf(start),
        lineEnd: lineOf(Math.max(start, end - 1)),
        preview,
      });
    }
    pos = idx + anchor.length;
  }

  return ranges;
}
