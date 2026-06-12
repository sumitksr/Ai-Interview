"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isLoggedIn: login, logout } = useAuth();

  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    return window.localStorage.getItem("ai-interview-theme") === "light"
      ? "light"
      : "dark";
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("ai-interview-theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }

  return (
    <div 
      className={`sticky top-0 z-50 flex justify-center w-full transition-all duration-300 ease-out ${
        isScrolled ? "pt-4 px-4 border-b border-transparent bg-transparent" : "pt-0 px-0 bg-[var(--surface)]/80 backdrop-blur-md border-b border-[var(--border)]/50"
      }`}
    >
      <header
        className={`w-full transition-all duration-300 ease-out relative ${
          isScrolled
            ? "max-w-4xl rounded-2xl bg-[var(--surface)]/70 backdrop-blur-md border border-[var(--border)] shadow-lg py-2.5 px-4"
            : "max-w-7xl py-5 px-5 sm:px-8 border border-transparent"
        }`}
      >
        <nav className="flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 md:gap-4 group" aria-label="AI Interview Platform home">
            <div className={`brand-mark grid place-items-center rounded-xl font-bold transition-all duration-300 ease-out group-hover:scale-105 ${
              isScrolled ? "h-9 w-9" : "h-10 w-10"
            }`}>
              <svg width={isScrolled ? "18" : "20"} height={isScrolled ? "18" : "20"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              </svg>
            </div>
            <div className="hidden sm:flex flex-col justify-center">
              {!isScrolled && (
                <span className="text-[10px] font-extrabold tracking-[0.2em] text-[var(--accent)] uppercase leading-none mb-1 transition-colors group-hover:text-[var(--cyan)]">
                  Interview
                </span>
              )}
              <span className={`title-text font-black leading-none tracking-tight transition-all duration-300 ease-out ${
                isScrolled ? "text-lg" : "text-[1.1rem]"
              }`}>
                Platform
              </span>
            </div>
          </Link>

          {/* Desktop Links (Smooth Hover) */}
          <div className="hidden md:flex items-center gap-1.5 flex-1 justify-center">
            {links.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ease-out flex items-center justify-center ${
                    isActive 
                      ? "text-[var(--accent)] bg-[var(--accent-soft)]" 
                      : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-105"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              )}
            </button>

            <div className="w-px h-5 border-l border-border hidden lg:block"></div>
              {!login ? (
                <>
                <Link href="/login" className="nav-link text-sm font-semibold transition-colors hover:text-[var(--foreground)] px-2">
                  Log in
                </Link>
              
                <Link href="/signup" className="btn-primary min-h-0 py-2.5 px-4 text-sm rounded-xl font-bold">
                  Get started
                </Link>
                </>
            ):
            (
              <>
              {/* // here will add image for gmail login and link to profile page */}
                <Link href="/profile" className="btn-primary min-h-0 py-2.5 px-4 text-sm rounded-xl font-bold">
                  Profile
                </Link>
                <button
                  onClick={() => {
                    logout()
                  }}
                  className="btn-secondary min-h-0 py-2.5 px-4 text-sm rounded-xl font-bold"
                >
                  Logout
                </button>
              </>
            
            )
            }
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle w-9 h-9 flex items-center justify-center rounded-full transition-colors"
            >
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {mobileMenuOpen ? (
                  <>
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </>
                ) : (
                  <>
                    <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
                  </>
                )}
              </svg>
            </button>
          </div>
        </nav>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className={`absolute left-0 right-0 bg-[var(--surface)]/95 backdrop-blur-xl md:hidden overflow-hidden transition-all duration-300 ${
            isScrolled 
              ? "top-[calc(100%+0.5rem)] rounded-2xl border border-[var(--border)] shadow-2xl" 
              : "top-full border-b border-[var(--border)] shadow-xl"
          }`}>
            <div className="px-5 py-6 flex flex-col gap-2">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl text-center text-sm font-semibold transition-all ${
                      isActive ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="h-px border-t border-[var(--border)] my-3"></div>
              
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-center text-[var(--muted)] hover:text-[var(--foreground)] text-sm font-semibold transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary w-full py-3 px-5 text-sm rounded-xl text-center justify-center font-bold"
              >
                Get started
              </Link>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}