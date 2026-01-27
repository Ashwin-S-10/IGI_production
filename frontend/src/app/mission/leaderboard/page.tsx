import type { Metadata } from "next";
import { MissionShell } from "@/components/mission/mission-shell";
import { LeaderboardPanel } from "@/components/mission/leaderboard-panel";

export const metadata: Metadata = {
  title: "Mission Leaderboard",
};

export default function LeaderboardPage() {
  return (
    <MissionShell title="Leaderboard" subtitle="Mission Rankings">
      <LeaderboardPanel />
    </MissionShell>
  );
}
