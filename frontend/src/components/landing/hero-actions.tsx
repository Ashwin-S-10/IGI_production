"use client";

import { MissionButton } from "@/components/ui/button";
import { useStory } from "@/components/providers/story-provider";
import { useRouter } from "next/navigation";

export function HeroActions() {
  const router = useRouter();
  const { open } = useStory();

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <MissionButton onClick={() => router.push("/register")}>Join the Mission</MissionButton>
      <MissionButton variant="secondary" onClick={() => open()}>
        View Story
      </MissionButton>
    </div>
  );
}
