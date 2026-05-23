import type { Metadata, Viewport } from "next";
import { AudioProvider } from "../src/hooks/useAudio";
import "./globals.css";

export const metadata: Metadata = {
  title: "Battleship — Online Multiplayer P2P Naval Combat",
  description: "Play the classic Battleship game online with friends. Real-time peer-to-peer naval warfare built with Next.js and Supabase. No registration required, just create a room and play!",
  keywords: ["Battleship", "Multiplayer Game", "P2P Game", "Online Battleship", "Naval Combat", "Strategy Game", "Next.js", "Supabase"],
  authors: [{ name: "Battleship P2P Team" }],
  openGraph: {
    title: "Battleship — Online Multiplayer P2P Naval Combat",
    description: "Sink your friend's fleet in this real-time P2P Battleship game. Fast, free, and fun!",
    url: "https://battleship-p2p.vercel.app", // Replace with your actual domain if different
    siteName: "Battleship P2P",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Battleship — Online Multiplayer P2P Naval Combat",
    description: "Real-time naval warfare. Create a room and challenge your friends now!",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e1a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AudioProvider>
          {children}
        </AudioProvider>
      </body>
    </html>
  );
}
