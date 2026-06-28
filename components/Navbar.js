"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/mentors", label: "Mentors" },
  { href: "/dashboard", label: "Dashboard" },
];

const AVATAR_COLORS = [
  ["#7c3aed", "#c4b8f0"],
  ["#1565c0", "#90caf9"],
  ["#10b981", "#a7f3d0"],
  ["#e65100", "#ffcc80"],
  ["#6a1b9a", "#ce93d8"],
  ["#0891b2", "#a5f3fc"],
  ["#db2777", "#fbcfe8"],
  ["#0277bd", "#81d4fa"],
  ["#558b2f", "#c5e1a5"],
  ["#4527a0", "#b39ddb"],
];

function getAvatarStyle(name) {
  if (!name) return { background: "#7c3aed", color: "#c4b8f0" };
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  const [bg, text] = AVATAR_COLORS[index];
  return { background: bg, color: text };
}

export default function Navbar() {
  const pathname = usePathname();
  const { isLoggedIn: login, userInfo, logout } = useAuth();

  // Always start with "dark" on server — useEffect will sync from localStorage on client
  const [theme, setTheme] = useState("dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Sync initial theme from localStorage after hydration
    const stored = window.localStorage.getItem("ai-interview-theme");
    if (stored && stored !== theme) {
      setTheme(stored);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("ai-interview-theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return (
    <div
      className={`sticky top-0 z-50 flex justify-center w-full transition-all duration-300 ease-out ${
        isScrolled ? "pt-3 px-4" : "pt-0 px-0"
      }`}
    >
      <header
        className={`w-full transition-all duration-300 ease-out ${
          isScrolled
            ? "max-w-4xl rounded-2xl py-2.5 px-5 shadow-2xl"
            : "max-w-7xl py-4 px-5 sm:px-8"
        }`}
        style={
          isScrolled
            ? {
                background: "color-mix(in srgb, var(--surface) 84%, transparent)",
                backdropFilter: "blur(24px)",
                border: "1px solid var(--border)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.3), var(--shadow-glow)",
              }
            : {
                background: "color-mix(in srgb, var(--surface) 80%, transparent)",
                backdropFilter: "blur(20px)",
                border: "1px solid transparent",
                borderBottom: "1px solid var(--border)",
              }
        }
      >
        <nav className="flex items-center justify-between gap-4">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0" aria-label="Ace AI home">
            <div
              className={`brand-mark grid place-items-center rounded-xl font-bold transition-all duration-300 group-hover:scale-110 ${
                isScrolled ? "h-9 w-9" : "h-10 w-10"
              }`}
            >
              {/* Custom Ace AI brand icon */}
              <img
                src="/ace-icon.svg"
                alt="Ace AI"
                width={isScrolled ? "22" : "26"}
                height={isScrolled ? "22" : "26"}
                style={{ display: "block" }}
              />
            </div>
            <div className="flex flex-col leading-none">
              <span
                className={`font-black tracking-tight transition-all duration-300 ${
                  isScrolled ? "text-base" : "text-[1.15rem]"
                }`}
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--cyan))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Ace AI
              </span>
              {!isScrolled && (
                <span className="text-[9px] font-semibold tracking-[0.18em] uppercase mt-0.5" style={{ color: "var(--muted)" }}>
                  Interview Coach
                </span>
              )}
            </div>
          </Link>

          {/* ── Desktop Links ── */}
          <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {links.map((link) => {
              let href = link.href;
              if (link.label === "Dashboard" && userInfo?.role) {
                if (userInfo.role === "teacher") href = "/mentor/dashboard";
                else if (userInfo.role === "admin") href = "/admin/dashboard";
              }
              const isActive = pathname.startsWith(href) && (href !== "/" || pathname === "/");
              return (
                <Link
                  key={link.label}
                  href={href}
                  className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "text-[var(--accent)] bg-[var(--accent-soft)]"
                      : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full"
                      style={{ background: "var(--accent)" }}
                    />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* ── Desktop Actions ── */}
          <div className="hidden md:flex items-center gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-110"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              )}
            </button>

            <div className="w-px h-5 bg-[var(--border)] hidden lg:block" />

            {!login ? (
              <>
                <Link href="/login" className="nav-link text-sm font-semibold px-3 py-2 rounded-lg transition-all hover:text-[var(--foreground)] hover:bg-[var(--accent-soft)]">
                  Log in
                </Link>
                <Link href="/signup" className="btn-primary min-h-0 py-2 px-5 text-sm rounded-xl font-bold">
                  Get started →
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/profile"
                  title={userInfo?.name || "Profile"}
                  style={!userInfo?.image ? getAvatarStyle(userInfo?.name) : {}}
                  className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden ring-2 ring-[var(--border)] hover:ring-[var(--accent)] hover:scale-110 transition-all duration-200 shadow-md flex-shrink-0"
                >
                  {userInfo?.image ? (
                    <img src={userInfo.image} alt={userInfo.name || "Profile"} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold select-none">
                      {userInfo?.name ? userInfo.name.trim().charAt(0).toUpperCase() : "?"}
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => logout()}
                  className="btn-secondary min-h-0 py-2 px-4 text-sm rounded-xl font-bold"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* ── Mobile Controls ── */}
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle w-9 h-9 flex items-center justify-center rounded-full transition-all"
            >
              {theme === "dark" ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-all"
              aria-label="Toggle menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {mobileMenuOpen ? (
                  <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>
                ) : (
                  <><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></>
                )}
              </svg>
            </button>
          </div>
        </nav>

        {/* ── Mobile Dropdown ── */}
        {mobileMenuOpen && (
          <div
            className="absolute left-0 right-0 md:hidden overflow-hidden mt-2 mx-2 rounded-2xl"
            style={{
              background: "color-mix(in srgb, var(--surface) 96%, transparent)",
              backdropFilter: "blur(24px)",
              border: "1px solid var(--border)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
          >
            <div className="px-4 py-5 flex flex-col gap-1.5">
              {links.map((link) => {
                let href = link.href;
                if (link.label === "Dashboard" && userInfo?.role) {
                  if (userInfo.role === "teacher") href = "/mentor/dashboard";
                  else if (userInfo.role === "admin") href = "/admin/dashboard";
                }
                const isActive = pathname.startsWith(href) && (href !== "/" || pathname === "/");
                return (
                  <Link
                    key={link.label}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl text-center text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="h-px bg-[var(--border)] my-2" />

              {!login ? (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-center text-[var(--muted)] hover:text-[var(--accent)] text-sm font-semibold transition-colors rounded-xl">
                    Log in
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="btn-primary w-full py-3 text-sm rounded-xl text-center font-bold">
                    Get started →
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-center text-[var(--muted)] hover:text-[var(--accent)] text-sm font-semibold transition-colors rounded-xl">
                    My Profile
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="btn-secondary w-full py-3 text-sm rounded-xl font-bold"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}