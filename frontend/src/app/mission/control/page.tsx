import type { Metadata } from "next";
import { MissionShell } from "@/components/mission/mission-shell";
import { ControlCenter } from "@/components/mission/control-center";

export const metadata: Metadata = {
  title: "Mission Control",
};

export const dynamic = 'force-dynamic';

export default function ControlPage() {
  return (
    <MissionShell title="Mission Control" subtitle="Operations Console">
      <ControlCenter />
    </MissionShell>
  );
}
