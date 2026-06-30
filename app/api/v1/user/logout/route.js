import { NextResponse } from "next/server";
import { signOut } from "@/auth";

export async function POST() {
  try {
    // Destroy the NextAuth session token (the root cause of the re-login bug)
    // signOut with redirect:false just invalidates the server-side JWT/session
    await signOut({ redirect: false });

    const response = NextResponse.json({ message: "Logout successful" }, { status: 200 });

    // Clear all auth-related cookies
    response.cookies.set("token",       "", { path: "/", httpOnly: true, maxAge: 0 });
    response.cookies.set("refreshToken","", { path: "/", httpOnly: true, maxAge: 0 });
    response.cookies.set("isLoggedIn",  "", { path: "/", maxAge: 0 });
    response.cookies.set("userInfo",    "", { path: "/", maxAge: 0 });
    // Also explicitly clear the NextAuth cookies just in case
    response.cookies.set("next-auth.session-token",          "", { path: "/", httpOnly: true, maxAge: 0 });
    response.cookies.set("__Secure-next-auth.session-token", "", { path: "/", httpOnly: true, maxAge: 0, secure: true });
    response.cookies.set("next-auth.callback-url",           "", { path: "/", maxAge: 0 });
    response.cookies.set("next-auth.csrf-token",             "", { path: "/", maxAge: 0 });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

