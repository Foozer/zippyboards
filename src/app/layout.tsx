import type { Metadata } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "ZippyBoard - Speed-run Issue Tracker",
  description: "The speed-run issue tracker for indie devs and lean teams. Lightning fast, GitHub integrated, and AI-powered task management.",
  keywords: ["issue tracker", "project management", "kanban", "github integration", "ai", "task management"],
  authors: [{ name: "ZippyBoard Team" }],
  openGraph: {
    title: "ZippyBoard - Speed-run Issue Tracker",
    description: "The speed-run issue tracker for indie devs and lean teams. Lightning fast, GitHub integrated, and AI-powered task management.",
    type: "website",
    url: "https://zippyboard.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ZippyBoard - Speed-run Issue Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZippyBoard - Speed-run Issue Tracker",
    description: "The speed-run issue tracker for indie devs and lean teams. Lightning fast, GitHub integrated, and AI-powered task management.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
