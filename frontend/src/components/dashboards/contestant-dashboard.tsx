"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, KeyRound, Play, Shield, Trophy, Zap } from "lucide-react";
import { MissionButton } from "@/components/ui/button";
import { useStory } from "@/components/providers/story-provider";
import { useAuth } from "@/components/providers/auth-provider";
import {
  useRounds,
  useSubmissionsRound1,
  useSubmissionsRound2,
  useTeams,
  useRound3Duels,
} from "@/lib/firestore/hooks";
import type { SubmissionRound1, SubmissionRound2 } from "@/lib/firestore/models";
import { TelecastViewer } from "@/components/telecast/telecast-viewer";

interface RoundState {
  id: string;
  Flag: number;
  status: 'pending' | 'active' | 'completed';
}

const roundBlueprint = [
  {
    id: "round1" as const,
    title: "Phase 1 — Algorithm Challenge",
    summary: "Solve mission algorithms, upload snapshots, and await AI validation.",
    storySegment: "phase1",
  },
  {
    id: "round2" as const,
    title: "Phase 2 — Capture the Hostile",
    summary: "Identify hostile bugs with line-precision to proceed.",
    storySegment: "phase2",
  },
  {
    id: "round3" as const,
    title: "Phase 3 — 1v1 Face-Off",
    summary: "Duel bracket begins once eight squads remain.",
    storySegment: "phase3",
  },
];

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate();
  }
  return null;
}

function latest<T extends { submittedAt: Date }>(entries: T[]): T | null {
  if (!entries.length) return null;
  return [...entries].sort((a: T, b: T) => {
    const aDate = a.submittedAt.getTime();
    const bDate = b.submittedAt.getTime();
    return bDate - aDate;
  })[0];
}

export function ContestantDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { openSegment, setSegmentScope } = useStory();
  const { teams } = useTeams();
  const { rounds } = useRounds();
  const [showYetToStart, setShowYetToStart] = useState(false);
  const [telecastCompleted, setTelecastCompleted] = useState(false);
  const [roundsState, setRoundsState] = useState<RoundState[]>([]);

  // Fetch rounds state from backend to check Flag visibility
  useEffect(() => {
    const fetchRoundsState = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/contest/rounds/state`);
        if (response.ok) {
          const data = await response.json();
          setRoundsState(data);
        }
      } catch (error) {
        console.error("Failed to fetch rounds state:", error);
      }
    };

    fetchRoundsState();
    const interval = setInterval(fetchRoundsState, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  type TeamCandidate = (typeof teams)[number];
  
  const team = useMemo(() => {
    if (!user) return undefined;
    if (user.teamId) {
      const direct = teams.find((candidate: TeamCandidate) => candidate.id === user.teamId);
      if (direct) return direct;
    }
    const email = user.email.toLowerCase();
    return teams.find((candidate: TeamCandidate) =>
      candidate.members?.some((member: string) => member.toLowerCase() === email),
    );
  }, [teams, user]);
  const { submissions: round1Submissions } = useSubmissionsRound1(team?.id);
  const { submissions: round2Submissions } = useSubmissionsRound2(team?.id);
  const { duels } = useRound3Duels();

  // Check if telecast was completed (stored in localStorage)
  useEffect(() => {
    const completed = localStorage.getItem('telecastCompleted') === 'true';
    setTelecastCompleted(completed);
  }, [setTelecastCompleted]);

  type Round = (typeof rounds)[number];
  type RoundLookup = Record<string, Round>;

  const roundLookup = useMemo(
    () =>
      rounds.reduce<RoundLookup>((acc: RoundLookup, roundEntry: Round) => {
        acc[roundEntry.id] = roundEntry;
        return acc;
      }, {}),
    [rounds],
  );

  const roundSummaries = useMemo(() => {
    return roundBlueprint.map((round) => {
      const roundState = roundsState.find(r => r.id === round.id);
      const isVisible = roundState ? roundState.Flag > 0 : false;
      
      return {
        ...round,
        status: roundLookup[round.id]?.status ?? "pending",
        isVisible,
      };
    }).filter(round => round.isVisible); // Only show rounds where Flag > 0
  }, [roundLookup, roundsState]);

  const missionRound = useMemo(() => {
    if (!roundSummaries.length) return null;
    return (
      roundSummaries.find((round) => round.status === "active") ??
      roundSummaries.find((round) => round.status === "pending") ??
      roundSummaries[0]
    );
  }, [roundSummaries]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Round 2 no longer requires password verification
    // All users can access Round 2 directly
  }, []);

  useEffect(() => {
    if (missionRound?.storySegment) {
      setSegmentScope([missionRound.storySegment]);
    } else {
      setSegmentScope();
    }
    return () => {
      setSegmentScope();
    };
  }, [missionRound?.storySegment, setSegmentScope]);

  // Fetch team data directly from Supabase based on user
  const [teamData, setTeamData] = useState<any>(null);
  
  useEffect(() => {
    const fetchTeamData = async () => {
      // Priority: use user.teamId if available
      let teamId = user?.teamId;
      
      if (!teamId) {
        console.warn('No team ID in user object:', user);
        return;
      }
      
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        console.log('Fetching team data for:', teamId);
        
        const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched team data:', data.data);
          setTeamData(data.data);
        } else {
          console.error('Failed to fetch team data:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Failed to fetch team data:', error);
      }
    };

    fetchTeamData();
    const interval = setInterval(fetchTeamData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [user?.teamId]);

  // Explicitly type the latest submissions to preserve their properties
  const latestRound1: SubmissionRound1 | null = latest(round1Submissions);
  const latestRound2: SubmissionRound2 | null = latest(round2Submissions);

  // Use Supabase teamData if available, fall back to Firestore team data
  const round1Score = teamData?.r1_score ?? latestRound1?.score ?? team?.round1_score ?? null;
  const round2Score = teamData?.r2_score ?? latestRound2?.totalScore ?? null;
  const round3Score = useMemo(() => {
    if (!teamData) return null;
    const r3_1 = teamData.round3_1_score ?? 0;
    const r3_2 = teamData.round3_2_score ?? 0;
    const r3_3 = teamData.round3_3_score ?? 0;
    const total = r3_1 + r3_2 + r3_3;
    return total > 0 ? total : null;
  }, [teamData]);
  
  const currentRank = teamData?.rank ?? null;
  const squadName = teamData?.team_name ?? team?.name ?? null;

  // Debug logging
  useEffect(() => {
    if (teamData) {
      console.log('Team data loaded:', {
        team_name: teamData.team_name,
        r1_score: teamData.r1_score,
        r2_score: teamData.r2_score,
        round3_1_score: teamData.round3_1_score,
        round3_2_score: teamData.round3_2_score,
        round3_3_score: teamData.round3_3_score,
        rank: teamData.rank,
      });
    }
  }, [teamData]);

  const round3Matches = useMemo(
    () =>
      duels
        .filter((duel) => duel.teamA === (teamData?.team_id ?? team?.id) || duel.teamB === (teamData?.team_id ?? team?.id))
        .map((duel) => ({
          ...duel,
          judgedAt: toDate(duel.judgedAt),
        }))
        .sort((a, b) => (b.judgedAt?.getTime() ?? 0) - (a.judgedAt?.getTime() ?? 0)),
    [duels, teamData?.team_id, team?.id],
  );

  const squadStats = [
    { label: "Squad", value: squadName ?? "Unassigned" },
    {
      label: "Round 1 Score",
      value: round1Score != null ? `${round1Score} / 100` : "—",
    },
    {
      label: "Round 2 Score",
      value: round2Score != null ? `${round2Score} / 100` : "—",
    },
    {
      label: "Round 3 Score",
      value: round3Score != null ? `${round3Score.toFixed(1)} / 30` : "—",
    },
  ];

  const handleRound2Unlock = () => {
    // Round 2 no longer requires password verification
    // Users can directly access Round 2
  };

  return (
    <div className="space-y-8 text-white">
      <TelecastViewer />
      
      {/* Main Welcome Section */}
      <section className="border border-[#FF6B00]/20 bg-transparent backdrop-blur-md p-8 rounded-3xl hover:border-[#FF6B00]/40 transition-all duration-300">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-[#FF6B00] mb-3">Contest Console</p>
            <h1 className="text-4xl font-bold text-white tracking-wide" style={{textShadow: "0 0 20px rgba(255, 107, 0, 0.5)"}}>Welcome to I&apos;M GOING INN</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/80 leading-relaxed">
              Track squad status, scoring. Opening story segments explain each
              mission phase — review before launching operations.
            </p>
          </div>
          <MissionButton variant="primary" onClick={() => router.push("/mission/leaderboard")}>
            View Leaderboard
          </MissionButton>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-stretch">
          <div className="grid gap-5 grid-cols-2 flex-1">
            {squadStats.map((stat) => (
              <article key={stat.label} className="group border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 min-h-[140px] text-center rounded-2xl hover:bg-black/40 hover:border-[#FF6B00]/60 transition-all duration-300 flex flex-col items-center justify-center">
                <p className="text-xs uppercase tracking-[0.45em] text-[#FF6B00]/80">{stat.label}</p>
                <p className="mt-3 text-2xl font-bold text-white group-hover:text-[#FF6B00] transition-colors">{stat.value}</p>
              </article>
            ))}
          </div>
          <article className="group border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm px-5 py-4 text-center rounded-2xl hover:bg-black/40 hover:border-[#FF6B00]/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,0,0.2)] flex flex-col items-center justify-center w-full md:w-[220px] self-end min-h-[140px]">
            <p className="text-xs uppercase tracking-[0.45em] text-[#FF6B00]/80">Rank</p>
            <p className="mt-3 text-3xl font-bold text-white group-hover:text-[#FF6B00] transition-colors">{currentRank != null ? `#${currentRank}` : "—"}</p>
          </article>
        </div>
      </section>

      {/* Mission Timeline Section */}
      <section className="border border-[#FF6B00]/20 bg-transparent backdrop-blur-md p-8 rounded-3xl hover:border-[#FF6B00]/40 transition-all duration-300">
        {/* Active Phase Details */}
        {missionRound && (
          <div className="mb-8">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.5em] text-[#FF6B00]">Active Phase</p>
              <h2 className="text-3xl font-bold text-white mt-2" style={{textShadow: "0 0 15px rgba(255, 107, 0, 0.3)"}}>{missionRound.title}</h2>
            </div>
            <div className="border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl">
              <div className="space-y-2 text-sm text-white/80">
                {missionRound.id === "round1" && (
                  <>
                    <p className="font-semibold text-white flex items-start gap-2"><span className="text-[#FF6B00] mt-0.5">▸</span> Explain efficient algorithms, and await evaluation.</p>
                    <p className="font-semibold text-white flex items-start gap-2"><span className="text-[#FF6B00] mt-0.5">▸</span> Speed bonus applies to tie-breaks — submit fast.</p>
                  </>
                )}
                {missionRound.id === "round2" && (
                  <>
                    <p className="font-semibold text-white flex items-start gap-2"><span className="text-[#FF6B00] mt-0.5">▸</span> Identify hostile bugs with line-precision to proceed.</p>
                    <p className="font-semibold text-white flex items-start gap-2"><span className="text-[#FF6B00] mt-0.5">▸</span> Speed bonus applies to tie-breaks — submit fast.</p>
                  </>
                )}
                {missionRound.id === "round3" && (
                  <>
                    <p className="font-semibold text-white flex items-start gap-2"><span className="text-[#FF6B00] mt-0.5">▸</span> Duel bracket begins once eight squads remain.</p>
                    <p className="font-semibold text-white flex items-start gap-2"><span className="text-[#FF6B00] mt-0.5">▸</span> Speed bonus applies to tie-breaks — submit fast.</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mission Timeline */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-[#FF6B00]">Rounds</p>
            <h2 className="text-3xl font-bold text-white mt-2" style={{textShadow: "0 0 15px rgba(255, 107, 0, 0.3)"}}>Mission Timeline</h2>
          </div>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {roundSummaries.map((round) => {
            return (
              <article
                key={round.id}
                className="group flex flex-col justify-between border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl hover:bg-black/40 hover:border-[#FF6B00]/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,0,0.2)]"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-[#FF6B00]/80 mb-2">{round.status}</p>
                  <h3 className="text-xl font-bold text-white group-hover:text-[#FF6B00] transition-colors">{round.title}</h3>
                  <p className="mt-3 text-sm text-white/70">{round.summary}</p>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <MissionButton
                    type="button"
                    variant="secondary"
                    className="text-xs"
                    disabled={telecastCompleted}
                    onClick={() => !telecastCompleted && setShowYetToStart(true)}
                  >
                    Story Brief
                  </MissionButton>
                  <MissionButton
                    type="button"
                    className="text-xs"
                    onClick={() => router.push(`/mission/round/${round.id}`)}
                  >
                    Enter Round <ArrowUpRight className="ml-1 h-3 w-3" />
                  </MissionButton>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Yet to Start Modal */}
      {showYetToStart && (
        <div 
          className="fixed inset-0 z-[9998] bg-black/90 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setShowYetToStart(false)}
        >
          <div className="glass-panel max-w-md p-8 text-center" onClick={e => e.stopPropagation()}>
            <h2 className="text-4xl font-bold neon-orange-text mb-4">YET TO START</h2>
            <p className="text-white/70 text-lg mb-6">
              The Story Brief will be available once the mission commander initiates the briefing.
            </p>
            <MissionButton onClick={() => setShowYetToStart(false)}>
              Understood
            </MissionButton>
          </div>
        </div>
      )}
    </div>
  );
}
