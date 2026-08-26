import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReviewProvider } from "@/context/ReviewContext";
import { PageTransition } from "@/components/layout/PageTransition";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * The template gives every screen the product name in the tab. Screens below
 * a dashboard set their own short title through <PageTitle>, which formats it
 * the same way — every page in this app is a client component, so none of
 * them can export metadata of their own.
 */
export const metadata: Metadata = {
  title: {
    template: "%s | QRA — Quality Review Assistant",
    default: "QRA — Quality Review Assistant",
  },
  description: "Pharmaceutical QA analytical batch release review platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ReviewProvider>
          <PageTransition>{children}</PageTransition>
        </ReviewProvider>
      </body>
    </html>
  );
}
