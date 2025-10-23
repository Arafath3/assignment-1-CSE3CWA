// app/court-room/play/page.tsx
"use client";

import React, { Suspense } from "react";
import PlayClient from "./PlayClient";

export const dynamic = "force-dynamic"; // optional, avoids prerender issues

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Loading game…</div>}>
      <PlayClient />
    </Suspense>
  );
}
