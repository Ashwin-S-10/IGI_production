import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { StoryModal } from "@/components/story-modal";
import { AuthProvider } from "@/components/providers/auth-provider";
import { StoryProvider } from "@/components/providers/story-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ConsoleOverride } from "@/components/providers/console-override";
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
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/images/logo/foss-cit-logo.jpeg', type: 'image/jpeg' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined') {
                  const noop = function() {};
                  window.console = window.console || {};
                  console.log = noop;
                  console.debug = noop;
                  console.info = noop;
                  console.warn = noop;
                  console.error = noop;
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ConsoleOverride />
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
