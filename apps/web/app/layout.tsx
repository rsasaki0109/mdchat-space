import type { ReactNode } from "react";
import type { Metadata } from "next";

import "./globals.css";


export const metadata: Metadata = {
  title: "mdchat-space",
  description: "Markdown-first community chat for durable conversations.",
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
