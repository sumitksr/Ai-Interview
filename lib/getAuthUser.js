/**
 * getAuthUser — unified auth helper for API routes
 *
 * Checks for an authenticated user in two ways:
 *   1. Custom JWT in the `token` httpOnly cookie (email/password login)
 *   2. NextAuth session (Google / GitHub OAuth login)
 *
 * Returns { id, role } on success, or null if unauthenticated.
 */

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { auth } from "@/auth";
import { connectDB, User } from "@/imports";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_for_development";

export async function getAuthUser() {
  const cookieStore = await cookies();

  // ── 1. Custom JWT cookie (email/password login) ──────────────────────────
  const tokenCookie = cookieStore.get("token")?.value;
  if (tokenCookie) {
    try {
      const decoded = jwt.verify(tokenCookie, JWT_SECRET);
      return { id: decoded.id, role: decoded.role };
    } catch {
      // token invalid/expired — fall through to NextAuth check
    }
  }

  // ── 2. NextAuth session (Google / GitHub OAuth) ──────────────────────────
  const session = await auth();
  if (session?.user) {
    // NextAuth stores the MongoDB _id in session.user.dbId (set in auth.js jwt callback)
    if (session.user.dbId) {
      return { id: session.user.dbId, role: session.user.role || "user" };
    }

    // Fallback: look up user by email if dbId is somehow missing
    const email = session.user.email;
    if (email) {
      await connectDB();
      const user = await User.findOne({
        email: { $regex: new RegExp(`^${email.toLowerCase()}$`, "i") },
      }).select("_id role");
      if (user) {
        return { id: user._id.toString(), role: user.role };
      }
    }
  }

  return null;
}
