import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "YJA Content Hub",
  description:
    "A mini-CRM for Young Jains of America - browse the latest community content and manage posts.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <nav className="navbar">
          <Link href="/" className="brand">
            <span className="brand-lockup">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="brand-logo"
                src="/placeholder.png"
                alt="YJA logo - meditating Tirthankara"
              />
              YJA
            </span>
            <span className="brand-name">Content Hub</span>
          </Link>
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link
              href="/manage_ops"
              className="nav-cta"
              title="Add a new post (title, link, description, image) or delete existing ones"
            >
              Manage Posts
            </Link>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}
