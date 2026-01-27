import type { Metadata } from "next";
import { MissionShell } from "@/components/mission/mission-shell";
import { SubmissionsIntelCenter } from "@/components/mission/submissions-intel-center";

export const metadata: Metadata = {
  title: "Submissions Intel - Mission Control",
};

export const dynamic = 'force-dynamic';

export default function SubmissionsIntelPage() {
  return (
    <MissionShell title="Submissions Intel" subtitle="Data Analysis">
      <SubmissionsIntelCenter />
    </MissionShell>
  );
}