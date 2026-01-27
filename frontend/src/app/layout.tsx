import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { StoryModal } from "@/components/story-modal";
import { AuthProvider } from "@/components/providers/auth-provider";
import { StoryProvider } from "@/components/providers/story-provider";
import { QueryProvider } from "@/components/providers/query-provider";
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
  title: "I'M GOING INN — Cyber Ops Coding Contest",
  description:
    "Secure operations dashboard for the I'M GOING INN coding contest with AI-evaluated rounds and mission control.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <StoryProvider>
              {children}
              <StoryModal />
            </StoryProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
