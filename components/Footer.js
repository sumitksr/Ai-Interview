import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-header border-t">
      <div className="muted-text mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>AI Interview Platform helps candidates practice, review, and improve.</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/about" className="hover:text-accent">
            About
          </Link>
          <Link href="/contact" className="hover:text-accent">
            Contact
          </Link>
          <Link href="/dashboard" className="hover:text-accent">
            Dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
}
