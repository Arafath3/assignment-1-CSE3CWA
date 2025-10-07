// components/PlayGround/SlideSkeleton.tsx
export default function SlideSkeleton({ index }: { index: number }) {
  return (
    <div className="flex h-[380px] w-[520px] items-center justify-center rounded-3xl border-2 border-border bg-card">
      <span className="text-3xl text-card-foreground">{index}</span>
    </div>
  );
}
