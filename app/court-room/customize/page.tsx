// app/court-room/customize/page.tsx
import { Suspense } from "react";
import CustomizeClient from "./CustomizeClient";

export const dynamic = "force-dynamic"; // avoids prerender errors

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Loading…</div>}>
      <CustomizeClient />
    </Suspense>
  );
}
