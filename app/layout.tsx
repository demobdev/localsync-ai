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
    default: "LocalMap | Business Listings Management",
    template: "%s | LocalMap",
  },
  description:
    "Manage your business details in one place. Review listing updates, complete publisher verification, and track what is actually live with LocalMap.",
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
      data-scroll-behavior="smooth"
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
