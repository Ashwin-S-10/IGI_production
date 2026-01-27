import type { Metadata } from "next";
import { MissionShell } from "@/components/mission/mission-shell";
import { Round1ReviewPanel } from "@/components/mission/round1-review";

export const metadata: Metadata = {
  title: "Round 1 Submission Review",
};

export default function Round1ReviewPage() {
  return (
    <MissionShell title="Round 1 Submissions" subtitle="Mission Control">
      <Round1ReviewPanel />
    </MissionShell>
  );
}
