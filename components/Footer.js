"use client";

import React from "react";
import Link from "next/link";

const footerLinks = [
  {
    heading: "Product",
    links: [
      { href: "/", label: "Home" },
      { href: "/about", label: "About" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/mentors", label: "Mentors" },
    ],
  },
  {
    heading: "Support",
    links: [
      { href: "/contact", label: "Contact Us" },
      { href: "/login", label: "Log In" },
      { href: "/signup", label: "Sign Up" },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        background: "color-mix(in srgb, var(--surface) 90%, transparent)",
        borderTop: "1px solid var(--border)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">

          {/* Brand column */}
          <div>
            <Link href="/" className="flex items-center gap-3 group w-fit">
              <div
                className="brand-mark grid place-items-center rounded-xl h-10 w-10 flex-shrink-0 transition-transform group-hover:scale-110"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                  <path d="M5 3v4" strokeWidth="1.5"/><path d="M19 17v4" strokeWidth="1.5"/>
                  <path d="M3 5h4" strokeWidth="1.5"/><path d="M17 19h4" strokeWidth="1.5"/>
                </svg>
              </div>
              <span
                className="text-xl font-black tracking-tight"
                style={{
                  background: "linear-gradient(135deg, #a78bfa, #c084fc, #34d399)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Ace AI
              </span>
            </Link>
            <p className="mt-4 text-sm leading-7" style={{ color: "var(--muted)", maxWidth: "20rem" }}>
              Your AI-powered interview coach. Practice smarter, get feedback faster, and land the job you deserve.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {/* Fake social icons */}
              {[
                { label: "Twitter/X", d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.736-8.857L2.25 2.25h6.985l4.26 5.634zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                { label: "LinkedIn", d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4" },
                { label: "GitHub", d: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" },
              ].map(({ label, d }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-110"
                  style={{
                    background: "var(--accent-soft)",
                    border: "1px solid color-mix(in srgb, var(--accent) 30%, var(--border))",
                    color: "var(--muted)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "color-mix(in srgb, var(--accent) 30%, var(--border))"; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={d} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          {footerLinks.map((col) => (
            <div key={col.heading}>
              <p className="text-xs font-bold uppercase tracking-[0.15em] mb-4" style={{ color: "var(--accent)" }}>
                {col.heading}
              </p>
              <ul className="flex flex-col gap-2.5">
                {col.links.map(({ href, label }) => (
                  <li key={label}>
                    <Link href={href} className="footer-link hover:text-[var(--accent)] transition-colors text-sm">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
          style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}
        >
          <p>© {year} Ace AI. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--emerald)", boxShadow: "0 0 6px var(--emerald)" }}
            />
            <span>AI systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
