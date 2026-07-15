import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";

import { AppProviders } from "@/components/providers/app-providers";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LocalMap | Get Found Online",
    template: "%s | LocalMap",
  },
  description:
    "Local Map Co. helps local brands get found. One master profile, honest listings across Google, Apple, Yelp, and more, plus reputation and AI visibility.",
  metadataBase: new URL("https://localmap.co"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>
          {children}
          <Toaster richColors />
        </AppProviders>
      </body>
    </html>
  );
}
