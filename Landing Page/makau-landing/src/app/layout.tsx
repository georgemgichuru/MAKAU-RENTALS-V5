import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nyumbani Rentals — Property & Rental Management",
  description:
    "Nyumbani Rentals: modern property management, booking, tenant screening, digital payments and 24/7 support.",
  metadataBase: new URL("https://example.com"),
  keywords: [
    "property management",
    "rental management",
    "tenant screening",
    "digital payments",
    "bookings",
    "landlord software",
    "rental software Kenya",
  ],
  authors: [{ name: "Nyumbani Rentals" }],
  openGraph: {
    title: "Nyumbani Rentals — Property Management Software",
    description:
      "Manage properties, automate bookings and get 24/7 tenant support with Nyumbani Rentals.",
    url: "https://example.com",
    siteName: "Nyumbani Rentals",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nyumbani Rentals",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nyumbani Rentals",
    description:
      "Modern property and rental management software for landlords and property managers.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
      >
        <Navbar />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
