import type { ReactNode } from "react";
import type { Metadata } from "next";

import "./globals.css";


const isStaticDemo = process.env.NEXT_PUBLIC_MDCHAT_DEMO === "1";

export const metadata: Metadata = {
  title: isStaticDemo ? "mdchat-space · Demo" : "mdchat-space",
  description: isStaticDemo
    ? "Markdown-first chat — try channels, threads, AI helpers, and DMs in your browser."
    : "Markdown-first community chat for durable conversations.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
