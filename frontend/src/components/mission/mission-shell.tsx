"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MissionButton } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { useStory } from "@/components/providers/story-provider";
import { useTelecast } from "@/lib/supabase/hooks";
import { TelecastViewer } from "@/components/telecast/telecast-viewer";

interface MissionShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function MissionShell({ title, subtitle = "Mission Console", children }: MissionShellProps) {
  const router = useRouter();
  const { user, role, logout } = useAuth();
  const { open } = useStory();
  const { activeTelecast } = useTelecast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showYetToStart, setShowYetToStart] = useState(false);
  const [telecastCompleted, setTelecastCompleted] = useState(false);

  // Check if there's an active mission telecast
  const isMissionActive = activeTelecast?.active && typeof activeTelecast?.videoPath === 'string' && activeTelecast?.videoPath?.includes('/missions/');
  const currentMission = isMissionActive && typeof activeTelecast?.videoPath === 'string' ? 
    (activeTelecast?.videoPath?.includes('igi-1') ? 1 : 
     activeTelecast?.videoPath?.includes('igi-2') ? 2 : 
     activeTelecast?.videoPath?.includes('igi-3') ? 3 : null) : null;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const completed = localStorage.getItem('telecastCompleted') === 'true';
    setTelecastCompleted(completed);
  }, [setTelecastCompleted]);

  return (
    <div className="relative min-h-screen">
      {/* Dedicated Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-black/80 backdrop-blur-md border-b border-[#FF6B00]/20">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <button 
            onClick={() => router.push('/landing')}
            className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img src="/images/foss-cit-logo.jpeg" alt="FOSS Logo" className="h-12 w-auto rounded-lg" />
            <span className="text-[#FF0000] text-2xl font-bold tracking-wider uppercase" style={{ textShadow: '0 0 10px rgba(255, 0, 0, 0.5)' }}>
              I'M GOING INN
            </span>
          </button>
        </div>
      </div>

      {/* Video Background - Starts below navbar */}
      <div className="fixed left-0 right-0 bottom-0 z-0" style={{ top: '88px' }}>
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ filter: "brightness(0.85) contrast(1.1)" }}
        >
          <source src="/mainload.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-8 pt-32 pb-12 flex flex-col items-center justify-center min-h-screen">
        <div className="w-full glass-panel p-10 shadow-2xl my-auto">
          <header className="flex flex-wrap items-center justify-between gap-6 mb-10">
            <div className="relative">
              <h1 className="text-4xl font-bold text-white mb-3" style={{textShadow: "0 0 20px rgba(255, 107, 0, 0.5)"}}>{title}</h1>
            </div>
            <div className="flex flex-wrap gap-4 relative">
              {role === "admin" && (
                <button
                  onClick={() => logout()}
                  className="px-6 py-2 rounded-lg border border-[#FF6B00]/30 bg-[#FF6B00]/10 text-[#FF6B00] hover:bg-[#FF6B00]/20 hover:border-[#FF6B00] hover:text-white transition-all duration-300 font-semibold uppercase tracking-wider text-sm"
                >
                  Logout
                </button>
              )}
            </div>
          </header>
          <main className="mt-10 space-y-10">{children}</main>
        </div>
      </div>


      
      {/* Telecast Viewer - Shows mission videos when admin triggers them */}
      <TelecastViewer />
    </div>
  );
}
