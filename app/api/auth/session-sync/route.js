import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Called by the client (SessionSync component) after NextAuth OAuth redirect.
 * Reads the active NextAuth session and sets the public cookies
 * (isLoggedIn, userInfo) that AuthContext + Navbar depend on.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { name, image, role } = session.user;
  const userInfo = JSON.stringify({ name: name || "", image: image || null, role: role || "user" });

  const res = NextResponse.json({ ok: true, name, image });
  res.cookies.set("isLoggedIn", "true", { path: "/", maxAge: 60 * 60 * 24 });
  res.cookies.set("userInfo", userInfo, { path: "/", maxAge: 60 * 60 * 24 });

  return res;
}
