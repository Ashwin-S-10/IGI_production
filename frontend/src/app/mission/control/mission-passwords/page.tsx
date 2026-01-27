import type { Metadata } from "next";
import { MissionShell } from "@/components/mission/mission-shell";
import { MissionPasswordsCenter } from "@/components/mission/mission-passwords-center";

export const metadata: Metadata = {
  title: "Mission Passwords - Mission Control",
};

export const dynamic = 'force-dynamic';

export default function MissionPasswordsPage() {
  return (
    <MissionShell title="Mission Passwords" subtitle="Access Control">
      <MissionPasswordsCenter />
    </MissionShell>
  );
}