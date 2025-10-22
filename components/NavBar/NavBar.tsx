// components/NavBar/NavBar.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IoMenu } from "react-icons/io5";
import { ModeToggle } from "../ModeToggle/ModeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button"; // shadcn button

// tiny cookie helpers (client-side)
function setCookie(name: string, value: string, days = 30) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; path=/; max-age=${maxAge}; samesite=lax`;
}
function getCookie(name: string) {
  const m = document.cookie.match(
    new RegExp(`(?:^|; )${encodeURIComponent(name)}=([^;]+)`)
  );
  return m ? decodeURIComponent(m[1]) : "";
}

const NAV: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/escape-room", label: "Escape Room" },
  { href: "/coding-races", label: "Coding Races" },
  { href: "/court-room", label: "Court Room" },
];

export default function NavBar() {
  const pathname = usePathname();
  const [active, setActive] = React.useState(pathname || "/");

  // restore last tab on first load if user lands somewhere else
  React.useEffect(() => {
    const saved = getCookie("menu.active");
    if (saved && saved !== active) setActive(saved);
  }, []);

  // when route changes, update both state and cookie
  React.useEffect(() => {
    if (!pathname) return;
    setActive(pathname);
    setCookie("menu.active", pathname, 30);
  }, [pathname]);

  const isActive = (href: string) => active === href;

  return (
    <header
      className="flex items-center justify-between px-4 py-3 border-b border-border bg-background"
      role="banner"
    >
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open main menu"
              className="rounded-lg"
            >
              <IoMenu className="text-2xl" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            sideOffset={8}
            className="min-w-[220px]"
          >
            <DropdownMenuLabel>Navigation</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {NAV.map((item) => (
              <DropdownMenuItem
                key={item.href}
                asChild
                className={isActive(item.href) ? "bg-muted" : ""}
              >
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="ml-1 text-lg font-semibold tracking-wide select-none">
          22035298
        </span>
      </div>

      <ModeToggle />
    </header>
  );
}
