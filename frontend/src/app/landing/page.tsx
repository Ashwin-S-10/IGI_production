"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import { ContestantDashboard } from "@/components/dashboards/contestant-dashboard";
import { MissionButton } from "@/components/ui/button";

export default function LandingPage() {
  const router = useRouter();
  const { user, role, loading, logout } = useAuth();
  const consoleSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const scrollToConsole = () => {
    consoleSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <LoaderCircle className="h-10 w-10 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="relative bg-black">
      {/* Fixed Top Bar - Stays on screen when scrolling */}
      <div className="fixed top-0 left-0 right-0 z-30 px-6 py-4 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/70 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <img src="/images/foss-cit-logo.jpeg" alt="FOSS Logo" className="h-10 w-auto rounded" />
          <span
            className="text-[#FF0000] text-xl font-bold tracking-wider uppercase"
            style={{ textShadow: "0 0 10px rgba(255, 0, 0, 0.6)" }}
          >
            I'M GOING INN
          </span>
        </div>
        <div className="flex items-center gap-3">
          {role !== "admin" && (
            <MissionButton variant="secondary">
              Story Brief
            </MissionButton>
          )}
          <MissionButton variant="ghost" onClick={() => logout()}>
            Logout
          </MissionButton>
        </div>
      </div>

      {/* ==================== SECTION 1: I'M GOING IN LANDING ==================== */}
      <section className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url(/images/1.28.9.png)",
            filter: "brightness(0.5) contrast(1.1)",
          }}
        />
        
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50 z-[1]" />

        {/* Center Content */}
        <div className="relative z-10 text-center px-4">
          <h1
            className="text-6xl md:text-8xl font-bold tracking-wider mb-6"
            style={{
              color: "#FF0000",
              textShadow: "0 0 10px rgba(255, 0, 0, 0.9), 0 0 20px rgba(255, 0, 0, 0.7), 0 0 40px rgba(255, 0, 0, 0.5), 0 0 80px rgba(255, 0, 0, 0.3)",
            }}
          >
            I'M GOING INN
          </h1>
          
          <p className="text-white/80 text-lg md:text-xl tracking-[0.3em] uppercase mb-12">
            Mission Awaits
          </p>

          <button
            onClick={scrollToConsole}
            className="px-8 py-4 border-2 border-white/30 text-white/80 hover:text-white hover:border-white/60 transition-all duration-300 tracking-widest uppercase text-sm"
          >
            Scroll or Click to Continue
          </button>
        </div>
      </section>

      {/* ==================== SECTION 2: CONSOLE WITH VIDEO BG ==================== */}
      <section ref={consoleSectionRef} className="relative min-h-screen w-full overflow-hidden">
        {/* Background Video */}
        <div className="fixed inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "brightness(0.4) contrast(1.1)" }}
          >
            <source src="/mainload.mp4" type="video/mp4" />
          </video>
        </div>
        
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60 z-[1]" />

        {/* Console Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-8 py-8 pb-16 pt-24">
          <div className="w-full bg-transparent border border-[#FF6B00]/20 p-6 md:p-10 shadow-2xl">
            <header className="mb-8 bg-transparent">
              <p className="text-xs uppercase tracking-[0.5em] text-[#FF6B00] mb-2">
                {role === "admin" ? "Admin Console" : "Field Ops"}
              </p>
              <h2
                className="text-3xl md:text-4xl font-bold text-white mb-3"
                style={{ textShadow: "0 0 20px rgba(255, 107, 0, 0.5)" }}
              >
                {role === "admin" ? "Mission Control" : "Contestant Console"}
              </h2>
              <p className="text-sm text-white/80">
                Signed in as <span className="font-medium text-white">{user?.email ?? "Unknown"}</span> — role{" "}
                <span className="uppercase tracking-[0.3em] text-[#FF6B00]">{role}</span>
              </p>
            </header>
            <main className="space-y-8 bg-transparent">
              {role === "admin" ? <AdminDashboard /> : <ContestantDashboard />}
            </main>
          </div>
        </div>
      </section>
    </div>
  );
}
/////////////////////cmtss///////