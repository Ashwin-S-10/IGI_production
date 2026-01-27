"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { MissionShell } from "@/components/mission/mission-shell";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import { ContestantDashboard } from "@/components/dashboards/contestant-dashboard";
import { MissionButton } from "@/components/ui/button";

export default function MissionPage() {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        <LoaderCircle className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center text-white">
        <p className="text-xl">Session expired. Authenticate to re-enter I&apos;M GOING INN.</p>
        <MissionButton onClick={() => router.push("/")}>Go to Login</MissionButton>
      </div>
    );
  }

  if (role === "admin") {
    return (
      <MissionShell title="Mission Control" subtitle="Admin Console">
        <AdminDashboard />
      </MissionShell>
    );
  }

  return (
    <MissionShell title="Contestant Console" subtitle="Field Ops">
      <ContestantDashboard />
    </MissionShell>
  );
}
