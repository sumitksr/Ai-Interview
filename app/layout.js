import { Inter, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Navbar, Footer, AuthProvider } from "@/imports";
import { cookies } from "next/headers";

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
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('ai-interview-theme')||'dark';document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}",
          }}
        />
      </head>
      <body className="min-h-full">
        <AuthProvider initialLoginState={isLoggedIn} initialUserInfo={userInfo}>
          <Navbar />
          <main className="min-h-[calc(100vh-168px)]">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

