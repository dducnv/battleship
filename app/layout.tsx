import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Battleship — Multiplayer Naval Combat",
  description: "Sink the enemy fleet in this real-time 2-player Battleship game. Deploy your ships, take aim, and dominate the seas.",
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
        {children}
      </body>
    </html>
  );
}
