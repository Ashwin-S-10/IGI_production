"use client";

import { useParams } from "next/navigation";
import { MissionShell } from "@/components/mission/mission-shell";
import { RoundWorkspace } from "@/components/mission/round-workspace";

export default function MissionRoundPage() {
  const params = useParams();
  const roundParam = params?.roundId;
  const roundId = Array.isArray(roundParam) ? roundParam[0] : roundParam ?? "round1";
  
  // Round 1 and Round 2 have their own floating navbar, don't wrap in MissionShell
  if (roundId === "round1" || roundId === "round2") {
    return <RoundWorkspace key={roundId} roundId={roundId} />;
  }
  
  // Round 3 and others use MissionShell
  return (
    <MissionShell title="Mission Workspace" subtitle="Submission Console">
      <RoundWorkspace key={roundId} roundId={roundId} />
    </MissionShell>
  );
}
