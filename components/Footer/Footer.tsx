// components/Footer/Footer.tsx
"use client";

type FooterProps = {
  name?: string;
  studentId?: string;
};

export default function Footer({
  name = "Arafath", // <- change to your actual name
  studentId = "22035298", // <- your student ID
}: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="border-t border-border bg-background/80 backdrop-blur
                 text-sm text-muted-foreground w-full"
    >
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-3">
        <span>
          © {year} {name}. All rights reserved.
        </span>
        <span className="opacity-80">Student ID: {studentId}</span>
      </div>
    </footer>
  );
}
