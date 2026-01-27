"use client";

import { Round1Workspace } from "@/components/mission/round1-workspace";
import { Round2WorkspaceNew } from "@/components/mission/round2-workspace-new";
import { Round3Workspace } from "@/components/mission/round3-workspace";

type RoundWorkspaceProps = {
  roundId: string;
};

export function RoundWorkspace({ roundId }: RoundWorkspaceProps) {
  if (roundId === "round2") {
    return <Round2WorkspaceNew roundId={roundId} />;
  }

  if (roundId === "round3") {
    return <Round3Workspace />;
  }

  return <Round1Workspace roundId={roundId} />;
}
