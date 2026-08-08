"use client";
import { usePathname } from "next/navigation";

/**
 * AdminShellSuppressor
 *
 * On /admin/* routes: renders children without the <main> wrapper so the
 * admin layout (with its own sidebar) takes full control of the page shell.
 *
 * On all other routes: wraps children in the normal <main> tag with the
 * standard min-height so Navbar + Footer are accounted for.
 */
export default function AdminShellSuppressor({ children }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    // No wrapper — admin layout provides its own full-screen shell
    return <>{children}</>;
  }

  return (
    <main className="min-h-[calc(100vh-168px)]">
      {children}
    </main>
  );
}
