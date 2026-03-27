import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Shopify Status Tracker — Real Downtime Monitoring",
  description: "Independent monitoring of Shopify's real uptime and component status, updated every 5 minutes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <header className="header">
          <div className="container header-inner">
            <h1>Shopify Status Tracker</h1>
            <nav>
              <a href="/">Dashboard</a>
              <a href="/admin">Admin</a>
            </nav>
          </div>
        </header>
        {children}
        <footer className="footer">
          <div className="container">
            Independent Shopify status monitoring. Not affiliated with Shopify.
            <br />Data sourced from shopifystatus.com every 5 minutes.
          </div>
        </footer>
      </body>
    </html>
  );
}
