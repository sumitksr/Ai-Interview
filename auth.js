import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { connectDB, User } from "@/imports";
import { sendWelcomeEmail } from "@/lib/sendWelcomeEmail";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],

  // Use JWT sessions (no database session table needed — our User model handles storage)
  session: { strategy: "jwt" },

  callbacks: {
    /**
     * Runs after every successful OAuth sign-in.
     * Here we upsert the user into our own MongoDB User collection,
     * and set the public cookies (`isLoggedIn`, `userInfo`) that
     * AuthContext + Navbar depend on.
     */
    async signIn({ user, account, profile }) {
      try {
        await connectDB();

        const normalizedEmail = user.email?.toLowerCase();
        if (!normalizedEmail) return false; // reject if no email

        let dbUser = null;

        if (account.provider === "google") {
          dbUser = await User.findOne({
            $or: [
              { googleId: profile.sub },
              { email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") } },
            ],
          });

          if (!dbUser) {
            dbUser = new User({
              name: profile.name,
              email: normalizedEmail,
              googleId: profile.sub,
              image: profile.picture,
              role: "user",
              isVerified: true,
            });
            await dbUser.save();
            sendWelcomeEmail(dbUser.email, dbUser.name).catch((e) => console.error("sendWelcomeEmail error:", e));
          } else {
            let changed = false;
            if (!dbUser.googleId) { dbUser.googleId = profile.sub; changed = true; }
            if (!dbUser.image && profile.picture) { dbUser.image = profile.picture; changed = true; }
            if (!dbUser.isVerified) { dbUser.isVerified = true; changed = true; }
            if (changed) await dbUser.save();
          }
        }

        if (account.provider === "github") {
          const githubId = profile.id?.toString();

          dbUser = await User.findOne({
            $or: [
              { githubId },
              { email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") } },
            ],
          });

          if (!dbUser) {
            dbUser = new User({
              name: profile.name || profile.login,
              email: normalizedEmail,
              githubId,
              image: profile.avatar_url,
              role: "user",
              isVerified: true,
            });
            await dbUser.save();
            sendWelcomeEmail(dbUser.email, dbUser.name).catch((e) => console.error("sendWelcomeEmail error:", e));
          } else {
            let changed = false;
            if (!dbUser.githubId) { dbUser.githubId = githubId; changed = true; }
            if (!dbUser.image && profile.avatar_url) { dbUser.image = profile.avatar_url; changed = true; }
            if (!dbUser.isVerified) { dbUser.isVerified = true; changed = true; }
            if (changed) await dbUser.save();
          }
        }

        // Attach DB fields to the `user` object so jwt callback can pick them up
        if (dbUser) {
          user.dbId = dbUser._id.toString();
          user.role = dbUser.role;
          user.image = dbUser.image || user.image;
          user.isVerified = dbUser.isVerified ?? true;
          user.name = dbUser.name || user.name;

          try {
            const { cookies } = await import("next/headers");
            const cookieStore = await cookies();
            const jwt = (await import("jsonwebtoken")).default;
            const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_for_development";
            const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "fallback_refresh_secret_key_for_development";

            const accessToken = jwt.sign(
              {
                id: dbUser._id.toString(),
                role: dbUser.role,
                email: dbUser.email,
                name: dbUser.name,
                image: dbUser.image || "",
              },
              JWT_SECRET,
              { expiresIn: "1d" }
            );

            const refreshToken = jwt.sign(
              {
                id: dbUser._id.toString(),
                role: dbUser.role,
              },
              REFRESH_TOKEN_SECRET,
              { expiresIn: "30d" }
            );

            user.accessToken = accessToken;
            user.refreshToken = refreshToken;

            cookieStore.set("token", accessToken, {
              path: "/",
              httpOnly: true,
              maxAge: 60 * 60 * 24,
            });
            cookieStore.set("refreshToken", refreshToken, {
              path: "/",
              httpOnly: true,
              maxAge: 60 * 60 * 24 * 30,
            });
            cookieStore.set("isLoggedIn", "true", {
              path: "/",
              maxAge: 60 * 60 * 24,
            });
            cookieStore.set("userInfo", JSON.stringify({
              name: dbUser.name,
              image: dbUser.image || "",
              role: dbUser.role,
              isVerified: dbUser.isVerified ?? true,
            }), {
              path: "/",
              maxAge: 60 * 60 * 24,
            });
          } catch (cookieErr) {
            console.error("NextAuth cookie setting error:", cookieErr);
          }
        }

        return true;
      } catch (err) {
        console.error("NextAuth signIn callback error:", err);
        return false;
      }
    },

    /**
     * Persists custom fields (dbId, role, image) into the NextAuth JWT.
     */
    async jwt({ token, user }) {
      if (user) {
        token.dbId = user.dbId;
        token.role = user.role;
        token.image = user.image;
        token.name = user.name;
        token.isVerified = user.isVerified;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      return token;
    },

    /**
     * Exposes custom fields to the client session.
     */
    async session({ session, token }) {
      if (token) {
        session.user.dbId = token.dbId;
        session.user.role = token.role;
        session.user.image = token.image;
        session.user.name = token.name;
        session.user.isVerified = token.isVerified;
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
      }
      return session;
    },
  },

  /**
   * After OAuth redirect, set the public cookies that AuthContext reads.
   * We use the `redirect` callback to intercept and then let Next.js handle
   * the actual redirect. The cookies are set via a custom middleware approach
   * via the signIn callback above — the actual cookie setting happens in
   * the catch-all route handler below via the signIn event.
   */
  events: {
    async signIn({ user }) {
      // Cookies are set client-side after signIn() resolves in login/signup pages
      // via the useEffect that watches the NextAuth session.
      // This event is for server-side logging / analytics if needed.
    },
  },

  pages: {
    // Redirect to our custom login page (not NextAuth's default)
    signIn: "/login",
    error: "/login",
  },
});
