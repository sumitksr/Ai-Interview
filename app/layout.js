import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar, Footer, AuthProvider } from "@/imports";
import { cookies } from "next/headers";
import AdminShellSuppressor from "./AdminShellSuppressor";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Ace AI — Your AI-Powered Interview Coach",
  description: "Ace AI helps you master interviews with AI-powered mock sessions, instant feedback, resume analysis, and expert mentors. Land your dream job faster.",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.get("isLoggedIn")?.value === "true";
  
  let userInfo = null;
  const userInfoCookie = cookieStore.get("userInfo")?.value;
  if (userInfoCookie) {
    try {
      userInfo = JSON.parse(userInfoCookie);
    } catch (e) {
      console.error("Failed to parse userInfo cookie", e);
    }
  }

  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="darkreader-lock" />
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('ai-interview-theme')||'dark';document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}",
          }}
        />
      </head>
      <body className="min-h-full" suppressHydrationWarning>
        <AuthProvider initialLoginState={isLoggedIn} initialUserInfo={userInfo}>
          <Navbar />
          {/*
            AdminShellSuppressor: on /admin/* routes it renders children directly
            (no main wrapper) so the admin sidebar layout takes full control.
            On all other routes it wraps children in the normal <main> tag.
          */}
          <AdminShellSuppressor>{children}</AdminShellSuppressor>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
