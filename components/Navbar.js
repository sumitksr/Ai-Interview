"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-[#e2e8f0] bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="AI Interview home">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#0f766e] font-bold text-white">
            AI
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-wide text-[#0f766e]">
              Interview
            </span>
            <span className="block text-lg font-bold text-[#17202a]">Coach</span>
          </span>
        </Link>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#f1f5f9] p-1">
            {links.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-white text-[#0f766e] shadow-sm"
                      : "text-[#475569] hover:bg-white/70 hover:text-[#17202a]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-sm font-semibold text-[#334155] transition hover:bg-[#eef2f7]"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-[#ea580c] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#c2410c]"
          >
            Sign up
          </Link>
        </div>
      </nav>
    </header>
  );
}
