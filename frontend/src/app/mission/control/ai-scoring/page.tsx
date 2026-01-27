import type { Metadata } from "next";
import { MissionShell } from "@/components/mission/mission-shell";
import { AIScoringCenter } from "@/components/mission/ai-scoring-center";

export const metadata: Metadata = {
  title: "AI Scoring - Mission Control",
};

export const dynamic = 'force-dynamic';

export default function AIScoringPage() {
  return (
    <MissionShell title="AI Scoring" subtitle="Automated Evaluation">
      <AIScoringCenter />
    </MissionShell>
  );
}