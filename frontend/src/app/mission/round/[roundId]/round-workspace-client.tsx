"use client";

import { RoundWorkspace } from "@/components/mission/round-workspace";

type RoundWorkspaceClientProps = {
  roundId: string;
};

export function RoundWorkspaceClient({ roundId }: RoundWorkspaceClientProps) {
  return <RoundWorkspace roundId={roundId} />;
}
