import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar, Footer } from "../imports";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AI Interview Platform",
  description: "A platform for conducting AI interviews ",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f7f8fb] text-[#17202a]">
        <Navbar />
        <main className="min-h-[calc(100vh-168px)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
