"use client";

import React, { useEffect, useState } from "react";
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
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    return window.localStorage.getItem("ai-interview-theme") === "light"
      ? "light"
      : "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("ai-interview-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }

  return (
    <header className="site-header sticky top-0 z-30">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="AI Interview Platform home">
          <span className="brand-mark grid h-10 w-10 place-items-center rounded-lg font-bold">
            AI
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-wide text-accent">
              Interview
            </span>
            <span className="title-text block text-lg font-bold">Platform</span>
          </span>
        </Link>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <div className="nav-cluster flex flex-wrap items-center gap-1 rounded-lg p-1">
            {links.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link rounded-md px-3 py-2 text-sm font-semibold transition ${
                    isActive ? "nav-link-active shadow-sm" : ""
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={theme === "dark"}
            className="theme-toggle rounded-md px-3 py-2 text-sm font-semibold transition"
          >
            Theme: {theme === "dark" ? "Dark" : "Light"}
          </button>
          <Link
            href="/login"
            className="nav-link rounded-md px-3 py-2 text-sm font-semibold transition"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="btn-hot min-h-0 px-4 py-2"
          >
            Sign up
          </Link>
        </div>
      </nav>
    </header>
  );
}
