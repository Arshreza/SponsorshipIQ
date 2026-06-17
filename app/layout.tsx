import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SponsorshipIQ — AI Sponsorship Outreach for College Fests",
    template: "%s | SponsorshipIQ",
  },
  description:
    "AI-powered sponsorship outreach for college fest committees. Generate personalized pitches, track your pipeline, and never lose a sponsor contact again.",
  keywords: [
    "college fest sponsorship",
    "sponsorship outreach",
    "AI pitch generator",
    "sponsor CRM",
    "fest committee tool",
  ],
  openGraph: {
    title: "SponsorshipIQ — Intelligent Sponsorship Outreach",
    description:
      "AI-powered sponsorship outreach for college fest committees. Generate personalized pitches, track your pipeline.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
