import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Video to Prompt — Free Gemini-powered video prompt generator",
  description:
    "Drop a video, get a ready-to-use prompt for Veo, Sora, Seedance, and any AI video generator. Free, open-source, runs in your browser with your own Gemini API key.",
  openGraph: {
    title: "Video to Prompt",
    description:
      "Free Gemini-powered video prompt generator — drop a video, get a prompt.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Video to Prompt",
    description:
      "Free Gemini-powered video prompt generator — drop a video, get a prompt.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-radial-glow">
        {children}
      </body>
    </html>
  );
}
