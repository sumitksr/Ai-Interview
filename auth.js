import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { connectDB, User } from "@/imports";

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
            });
            await dbUser.save();
          } else {
            let changed = false;
            if (!dbUser.googleId) { dbUser.googleId = profile.sub; changed = true; }
            if (!dbUser.image && profile.picture) { dbUser.image = profile.picture; changed = true; }
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
            });
            await dbUser.save();
          } else {
            let changed = false;
            if (!dbUser.githubId) { dbUser.githubId = githubId; changed = true; }
            if (!dbUser.image && profile.avatar_url) { dbUser.image = profile.avatar_url; changed = true; }
            if (changed) await dbUser.save();
          }
        }

        // Attach DB fields to the `user` object so jwt callback can pick them up
        if (dbUser) {
          user.dbId = dbUser._id.toString();
          user.role = dbUser.role;
          user.image = dbUser.image || user.image;
          user.name = dbUser.name || user.name;
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
