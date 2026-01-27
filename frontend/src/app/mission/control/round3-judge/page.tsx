import type { Metadata } from "next";
import { MissionShell } from "@/components/mission/mission-shell";
import { Round3JudgePanel } from "@/components/mission/round3-judge-panel";

export const metadata: Metadata = {
  title: "Round 3 Duel Judging",
};

export default function Round3JudgePage() {
  return (
    <MissionShell title="Round 3 Duels" subtitle="Mission Control">
      <Round3JudgePanel />
    </MissionShell>
  );
}
