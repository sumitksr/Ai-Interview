import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#e2e8f0] bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-[#64748b] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>AI Interview Coach helps candidates practice, review, and improve.</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/about" className="hover:text-[#0f766e]">
            About
          </Link>
          <Link href="/contact" className="hover:text-[#0f766e]">
            Contact
          </Link>
          <Link href="/dashboard" className="hover:text-[#0f766e]">
            Dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
}
