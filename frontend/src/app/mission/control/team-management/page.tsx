import type { Metadata } from "next";
import { MissionShell } from "@/components/mission/mission-shell";
import { TeamManagementCenter } from "@/components/mission/team-management-center";

export const metadata: Metadata = {
  title: "Team Management - Mission Control",
};

export const dynamic = 'force-dynamic';

export default function TeamManagementPage() {
  return (
    <MissionShell title="Team Management" subtitle="Squad Operations">
      <TeamManagementCenter />
    </MissionShell>
  );
}