import "98.css";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "$TBILL — TokenizedRWASigmawojak69Hood",
  description:
    "A joke meme coin for entertainment only. Not financial advice, not an investment, no utility. Robinhood Chain. Pons launchpad. Maximum confetti.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
