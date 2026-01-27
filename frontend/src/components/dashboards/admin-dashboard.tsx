"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ClipboardList,
  FileSpreadsheet,
  LockKeyhole,
  Play,
  PlayCircle,
  ShieldAlert,
  UploadCloud,
  Users,
  Loader2,
} from "lucide-react";
import { MissionButton } from "@/components/ui/button";
import { useStory } from "@/components/providers/story-provider";
import { useAIJobs, useRounds, useSubmissionsRound1, useSubmissionsRound2, useTeams } from "@/lib/firestore/hooks";
import type { SubmissionRound1, SubmissionRound2 } from "@/lib/firestore/models";
import type { TelecastState } from "@/lib/telecast-state";

interface RoundState {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'completed';
  Flag: number;
  start_time: string | null;
  end_time: string | null;
  timer: number | null;
}

const panels = [
  {
    title: "Team Management",
    icon: Users,
    body: "Assign squads, swap operatives, and mark extractions. Squad balance suggestions update live as submissions arrive.",
  },
];

const overrides = [
  {
    label: "Flag Suspicious Submission",
    detail: "Mark and quarantine an entry for manual review.",
  },
  {
    label: "Override Winner",
    detail: "Settle disputes when AI cannot determine a unique winner.",
  },
  {
    label: "Emergency Shutdown",
    detail: "Freeze all rounds and force contestants back to standby.",
  },
];

export function AdminDashboard() {
  const router = useRouter();
  const { openSegment } = useStory();
  const { teams } = useTeams();
  const { rounds } = useRounds();
  const { submissions: round1Submissions } = useSubmissionsRound1();
  const { submissions: round2Submissions } = useSubmissionsRound2();
  const { jobs } = useAIJobs();
  const [telecastStatus, setTelecastStatus] = useState<'idle' | 'triggering' | 'active' | 'clearing'>('idle');
  const [telecastInfo, setTelecastInfo] = useState<TelecastState | null>(null);
  const [selectedVideo, setSelectedVideo] = useState('/infovid.mp4');
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [adminPreviewVideo, setAdminPreviewVideo] = useState<string | null>(null);

  // Round state management
  const [roundsState, setRoundsState] = useState<RoundState[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(true);
  const [updatingRound, setUpdatingRound] = useState<string | null>(null);

  // Round 3 control state
  const [round3Question, setRound3Question] = useState<number>(0);
  const [round3Timer, setRound3Timer] = useState<number>(30);

  // Available videos in the public folder
  const availableVideos = [
    { path: '/infovid.mp4', name: 'Mission Briefing (Default)', description: 'Standard mission briefing video' },
    { path: '/mainload.mp4', name: 'Main Loading Video', description: 'Background loading sequence' },
    { path: '/bg.mp4', name: 'Background Video', description: 'General background video' },
  ];

  // Mission videos
  const missionVideos = [
    { path: '/missions/igi-1.mp4', name: 'IGI Mission 1', description: 'First mission briefing video' },
    { path: '/missions/igi-2.mp4', name: 'IGI Mission 2', description: 'Second mission briefing video' },
    { path: '/missions/igi-3.mp4', name: 'IGI Mission 3', description: 'Third mission briefing video' },
  ];

  // Poll telecast status
  useEffect(() => {
    const checkTelecastStatus = async () => {
      try {
        const response = await fetch("/api/contest/telecast/status");
        if (response.ok) {
          const data = await response.json();
          setTelecastInfo(data);
        }
      } catch (error) {
        console.error("Failed to check telecast status:", error);
      }
    };

    checkTelecastStatus();
    const interval = setInterval(checkTelecastStatus, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Fetch rounds state
  useEffect(() => {
    const fetchRoundsState = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/contest/rounds/state`);
        if (response.ok) {
          const data = await response.json();
          setRoundsState(data);
          
          // Initialize Round 3 state from database
          const round3 = data.find((r: RoundState) => r.id === 'round3');
          if (round3) {
            setRound3Question(round3.Flag);
            setRound3Timer(round3.timer || 30);
          }
        }
      } catch (error) {
        console.error("Failed to fetch rounds state:", error);
      } finally {
        setLoadingRounds(false);
      }
    };

    fetchRoundsState();
    const interval = setInterval(fetchRoundsState, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Handle Round 1 & 2 toggle
  const handleRoundToggle = async (roundId: string, currentFlag: number) => {
    setUpdatingRound(roundId);
    try {
      const newFlag = currentFlag === 0 ? 1 : 0;
      console.log(`🔄 Toggling ${roundId} Flag from ${currentFlag} to ${newFlag}`);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/contest/rounds/${roundId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Flag: newFlag }),
        }
      );
      
      if (response.ok) {
        const updated = await response.json();
        console.log('✅ Round updated:', updated);
        setRoundsState(prev => prev.map(r => r.id === roundId ? updated : r));
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Update failed:', errorData);
        alert(`Failed to update round visibility:\n${errorData.details || errorData.error}\n\n${errorData.hint || 'Check backend logs'}`);
      }
    } catch (error) {
      console.error('❌ Error updating round:', error);
      alert(`Failed to update round visibility:\n${error instanceof Error ? error.message : 'Network error'}\n\nCheck if backend is running and database is properly set up.`);
    } finally {
      setUpdatingRound(null);
    }
  };

  // Handle Round 3 question start
  const handleStartRound3Question = async () => {
    if (round3Question === 0) {
      alert('Please select a question (1, 2, or 3)');
      return;
    }

    if (!round3Timer || round3Timer <= 0) {
      alert('Please enter a valid timer duration in minutes');
      return;
    }

    if (!confirm(`Start Round 3 Question ${round3Question} with ${round3Timer} minute timer?`)) {
      return;
    }

    setUpdatingRound('round3');
    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + round3Timer * 60 * 1000);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/contest/rounds/round3`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Flag: round3Question,
            start_time: now.toISOString(),
            end_time: endTime.toISOString(),
            timer: round3Timer,
            status: 'active',
          }),
        }
      );
      
      if (response.ok) {
        const updated = await response.json();
        setRoundsState(prev => prev.map(r => r.id === 'round3' ? updated : r));
        alert(`Round 3 Question ${round3Question} started successfully!`);
      } else {
        alert('Failed to start Round 3 question');
      }
    } catch (error) {
      console.error('Error starting Round 3 question:', error);
      alert('Failed to start Round 3 question');
    } finally {
      setUpdatingRound(null);
    }
  };

  // Get round state by ID
  const getRoundState = (roundId: string): RoundState | undefined => {
    return roundsState.find(r => r.id === roundId);
  };

  type Round = (typeof rounds)[number];
  type RoundLookup = Record<string, Round>;

  const roundLookup = useMemo(
    () =>
      rounds.reduce<RoundLookup>((acc: RoundLookup, round: Round) => {
        acc[round.id] = round;
        return acc;
      }, {}),
    [rounds],
  );

  const panelStats: Record<string, string> = {
    "Team Management": `${teams.length} active squad${teams.length === 1 ? "" : "s"}`,
  };

  const toDate = (value: unknown): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "string") return new Date(value);
    if (typeof value === "object" && value !== null && "toDate" in value && typeof value.toDate === "function") {
      return value.toDate();
    }
    return null;
  };

  const recentActivity = useMemo(() => {
    const normalizeRound1 = round1Submissions.map((submission: SubmissionRound1) => ({
      id: submission.id,
      round: "round1" as const,
      teamId: submission.team_id,
      submittedAt: toDate(submission.submitted_at),
      scoreLabel:
        typeof submission.score === "number" ? `Score ${submission.score.toFixed(1)}/10` : "Score pending",
    }));

    const normalizeRound2 = round2Submissions.map((submission: SubmissionRound2) => ({
      id: submission.id,
      round: "round2" as const,
      teamId: submission.team_id,
      submittedAt: toDate(submission.submitted_at),
      scoreLabel:
        typeof submission.total_score === "number"
          ? `Score ${submission.total_score.toFixed(1)}/10`
          : "Score pending",
    }));

    return [...normalizeRound1, ...normalizeRound2]
      .sort((a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0))
      .slice(0, 6);
  }, [round1Submissions, round2Submissions]);

  const handleMissionLaunch = async (videoPath: string, missionName: string) => {
    if (!confirm(`🚀 LAUNCH ${missionName}?\n\nThis will:\n• Force ALL participants to watch the mission video\n• Put them in fullscreen mode\n• Block access until video completes\n\nProceed with launch?`)) {
      return;
    }
    
    setTelecastStatus('triggering');
    try {
      const response = await fetch("/api/contest/telecast/trigger", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoPath: videoPath,
          title: missionName
        })
      });
      if (response.ok) {
        setTelecastStatus('active');
        setTimeout(() => setTelecastStatus('idle'), 3000);
      } else {
        throw new Error('Failed to launch mission');
      }
    } catch (error) {
      console.error('Mission launch failed:', error);
      alert('Failed to launch mission. Check console for details.');
      setTelecastStatus('idle');
    }
  };

  const handleTelecastTrigger = async () => {
    if (!confirm(`🚨 TRIGGER VIDEO BROADCAST?\n\nVideo: ${availableVideos.find(v => v.path === selectedVideo)?.name}\nPath: ${selectedVideo}\n\nThis will:\n• Force ALL participants to watch this video\n• Put them in fullscreen mode\n• Block access until video completes\n\nProceed?`)) {
      return;
    }
    
    setTelecastStatus('triggering');
    try {
      const response = await fetch("/api/contest/telecast/trigger", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoPath: selectedVideo })
      });
      if (response.ok) {
        setTelecastStatus('active');
        setTimeout(() => setTelecastStatus('idle'), 3000);
      } else {
        throw new Error('Failed to trigger telecast');
      }
    } catch (error) {
      console.error('Telecast trigger failed:', error);
      alert('Failed to trigger telecast. Check console for details.');
      setTelecastStatus('idle');
    }
  };

  const handleAdminPreview = (videoPath: string) => {
    setAdminPreviewVideo(videoPath);
  };

  const closeAdminPreview = () => {
    setAdminPreviewVideo(null);
  };

  const handleTelecastClear = async () => {
    if (!confirm("Clear telecast state? This will stop any active video broadcasts.")) {
      return;
    }
    
    setTelecastStatus('clearing');
    try {
      const response = await fetch("/api/contest/telecast/clear", { method: "POST" });
      if (response.ok) {
        setTelecastStatus('idle');
      } else {
        throw new Error('Failed to clear telecast');
      }
    } catch (error) {
      console.error('Telecast clear failed:', error);
      alert('Failed to clear telecast. Check console for details.');
      setTelecastStatus('idle');
    }
  };

  return (
    <div className="space-y-8 text-white">
        <section className="border border-[#FF6B00]/20 bg-transparent backdrop-blur-md p-8 rounded-3xl hover:border-[#FF6B00]/40 transition-all duration-300">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-[#FF6B00] mb-3">Mission Control</p>
              <h1 className="text-4xl font-bold text-white tracking-wide" style={{textShadow: "0 0 20px rgba(255, 107, 0, 0.5)"}}>Admin Operations Console</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/80 leading-relaxed">
                Launch rounds, watch AI scoring, and keep the I&apos;M GOING INN mission secure. Use the controls below
                to shepherd squads through each phase.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-1 lg:grid-cols-1">
          {panels.map(({ title, icon: Icon, body }) => (
            <article 
              key={title} 
              className="group relative border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl hover:bg-black/40 hover:border-[#FF6B00]/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,0,0.2)]"
            >
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#FF6B00]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#FF6B00]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Icon className="mb-4 h-10 w-10 text-[#FF6B00] group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-white group-hover:text-[#FF6B00] transition-colors">{title}</h3>
              <p className="mt-3 text-sm text-white/70 leading-relaxed">{body}</p>
              {panelStats[title] && (
                <p className="mt-3 text-xs uppercase tracking-[0.3em] text-[#FF6B00]/60">{panelStats[title]}</p>
              )}
              
              <MissionButton
                className="mt-5 w-full"
                variant="ghost"
                onClick={() => {
                  const routeMap: Record<string, string> = {
                    'Team Management': '/mission/control/team-management',
                  };
                  
                  const route = routeMap[title];
                  if (route) {
                    router.push(route);
                  } else {
                    router.push(`/mission/control?task=${encodeURIComponent(title)}`);
                  }
                }}
              >
                Configure →
              </MissionButton>
            </article>
          ))}
          </div>
        </section>

        {/* Mission Control Panel - For launching mission telecasts */}
        <section className="border border-[#FF6B00]/20 bg-transparent backdrop-blur-md p-8 rounded-3xl hover:border-[#FF6B00]/40 transition-all duration-300">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-[#FF6B00]">Mission Telecast</p>
              <h2 className="text-3xl font-bold text-white mt-2" style={{textShadow: "0 0 15px rgba(255, 107, 0, 0.3)"}}>Launch Mission Videos</h2>
              <p className="mt-2 text-sm text-white/70">
                Trigger fullscreen mission briefings for all participants. Videos cannot be skipped or closed.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.3em] text-[#FF6B00]/60">Telecast Status</p>
              <div className="mt-1 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${telecastInfo?.active ? 'bg-green-500' : 'bg-gray-500'}`} />
                <span className="text-sm text-white/80">
                  {telecastInfo?.active ? 'Active' : 'Idle'}
                </span>
              </div>
              {telecastInfo?.active && telecastInfo?.videoPath && typeof telecastInfo.videoPath === 'string' && (
                <p className="text-xs text-[#FF6B00]/80 mt-1">
                  Playing: {missionVideos.find(v => v.path === telecastInfo.videoPath)?.name || telecastInfo.videoPath}
                </p>
              )}
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            {missionVideos.map((mission, index) => (
              <div key={mission.path} className="border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-white mb-2">{mission.name}</h3>
                <p className="text-sm text-white/70 mb-4">{mission.description}</p>
                <MissionButton
                  className="w-full text-sm"
                  variant="primary"
                  disabled={telecastStatus !== 'idle'}
                  onClick={() => handleMissionLaunch(mission.path, mission.name)}
                >
                  {telecastStatus === 'triggering' ? '🚀 Launching...' :
                   telecastStatus === 'active' ? '✅ Launched!' :
                   `🚀 Launch Mission ${index + 1}`}
                </MissionButton>
              </div>
            ))}
          </div>

          {/* Clear All Telecasts Button */}
          <div className="mt-6 pt-4 border-t border-[#FF6B00]/20">
            <MissionButton
              className="w-full text-sm"
              variant="danger"
              disabled={telecastStatus !== 'idle'}
              onClick={handleTelecastClear}
            >
              {telecastStatus === 'clearing' ? '🛑 Clearing...' : '🛑 Clear All Telecasts'}
            </MissionButton>
          </div>
        </section>

      <section className="border border-[#FF6B00]/20 bg-transparent backdrop-blur-md p-8 rounded-3xl hover:border-[#FF6B00]/40 transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-[#FF6B00]">Round Status</p>
            <h2 className="text-3xl font-bold text-white mt-2" style={{textShadow: "0 0 15px rgba(255, 107, 0, 0.3)"}}>Phase Controls</h2>
          </div>
        </div>

        {loadingRounds ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {/* ROUND 1 CONTROL */}
            <article className="group border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl hover:bg-black/40 hover:border-[#FF6B00]/60 transition-all duration-300">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.4em] text-[#FF6B00]/80 mb-2">
                    round1 • {getRoundState('round1')?.status ?? 'pending'}
                  </p>
                  <h3 className="text-xl font-bold text-white">Round 1 — Algorithm Challenge</h3>
                  <p className="text-sm text-white/70 mt-2">Control Round 1 visibility for contestants</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-white/70">Enable Round 1</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={getRoundState('round1')?.Flag === 1}
                        onChange={() => handleRoundToggle('round1', getRoundState('round1')?.Flag ?? 0)}
                        disabled={updatingRound === 'round1'}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#FF6B00]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B00]"></div>
                    </div>
                  </label>
                  <span className="text-xs text-white/50 ml-2">
                    {getRoundState('round1')?.Flag === 1 ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              </div>
            </article>

            {/* ROUND 2 CONTROL */}
            <article className="group border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl hover:bg-black/40 hover:border-[#FF6B00]/60 transition-all duration-300">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.4em] text-[#FF6B00]/80 mb-2">
                    round2 • {getRoundState('round2')?.status ?? 'pending'}
                  </p>
                  <h3 className="text-xl font-bold text-white">Round 2 — Capture the Hostile</h3>
                  <p className="text-sm text-white/70 mt-2">Control Round 2 visibility for contestants</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-white/70">Enable Round 2</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={getRoundState('round2')?.Flag === 1}
                        onChange={() => handleRoundToggle('round2', getRoundState('round2')?.Flag ?? 0)}
                        disabled={updatingRound === 'round2'}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#FF6B00]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B00]"></div>
                    </div>
                  </label>
                  <span className="text-xs text-white/50 ml-2">
                    {getRoundState('round2')?.Flag === 1 ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              </div>
            </article>

            {/* ROUND 3 CONTROL - QUESTION SELECTOR */}
            <article className="group border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl hover:bg-black/40 hover:border-[#FF6B00]/60 transition-all duration-300">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-[0.4em] text-[#FF6B00]/80 mb-2">
                      round3 • {getRoundState('round3')?.status ?? 'pending'}
                    </p>
                    <h3 className="text-xl font-bold text-white">Round 3 — 1v1 Face-Off</h3>
                    <p className="text-sm text-white/70 mt-2">Control which Round 3 question is active</p>
                  </div>
                  {getRoundState('round3')?.Flag !== undefined && getRoundState('round3')!.Flag > 0 && (
                    <div className="bg-green-500/20 border border-green-500/40 px-3 py-1 rounded-full">
                      <span className="text-xs text-green-400 font-semibold uppercase tracking-wider">
                        Question {getRoundState('round3')!.Flag} Active
                      </span>
                    </div>
                  )}
                </div>

                {/* Question Control Panel */}
                <div className="border border-[#FF6B00]/10 bg-black/30 p-4 rounded-xl space-y-4">
                  <h4 className="text-sm font-semibold text-[#FF6B00] uppercase tracking-wider">Question Control Panel</h4>
                  
                  {/* Question Selector */}
                  <div className="space-y-2">
                    <label className="text-xs text-white/60 uppercase tracking-wide">Select Question</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: 0, label: 'None' },
                        { value: 1, label: 'Question 1' },
                        { value: 2, label: 'Question 2' },
                        { value: 3, label: 'Question 3' },
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => setRound3Question(option.value)}
                          className={`px-4 py-2 rounded border text-sm font-medium transition-all ${
                            round3Question === option.value
                              ? 'bg-[#FF6B00] border-[#FF6B00] text-white'
                              : 'bg-black/40 border-[#FF6B00]/20 text-white/70 hover:border-[#FF6B00]/60'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timer Input */}
                  <div className="space-y-2">
                    <label className="text-xs text-white/60 uppercase tracking-wide">Timer (Minutes)</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={round3Timer}
                      onChange={(e) => setRound3Timer(parseInt(e.target.value) || 30)}
                      disabled={round3Question === 0}
                      className="w-full px-4 py-2 bg-black/40 border border-[#FF6B00]/20 rounded text-white focus:outline-none focus:border-[#FF6B00] disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Enter minutes"
                    />
                    <p className="text-xs text-white/40">
                      {round3Question === 0 
                        ? 'Timer disabled when "None" is selected'
                        : `Question will run for ${round3Timer} minutes`}
                    </p>
                  </div>

                  {/* Start Button */}
                  <MissionButton
                    onClick={handleStartRound3Question}
                    disabled={round3Question === 0 || updatingRound === 'round3'}
                    className="w-full"
                  >
                    {updatingRound === 'round3' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      `Start Question ${round3Question === 0 ? '' : round3Question}`
                    )}
                  </MissionButton>

                  {/* Current State Display */}
                  {getRoundState('round3')?.Flag !== undefined && getRoundState('round3')!.Flag > 0 && getRoundState('round3')?.start_time && (
                    <div className="mt-3 p-3 bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded">
                      <p className="text-xs text-white/70">
                        <strong>Active:</strong> Question {getRoundState('round3')!.Flag}
                      </p>
                      <p className="text-xs text-white/70">
                        <strong>Started:</strong> {new Date(getRoundState('round3')!.start_time!).toLocaleString()}
                      </p>
                      {getRoundState('round3')?.end_time && (
                        <p className="text-xs text-white/70">
                          <strong>Ends:</strong> {new Date(getRoundState('round3')!.end_time!).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                    <p className="text-xs text-yellow-400">
                      ⚠️ Starting a new question will override any currently active question immediately.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        )}
      </section>

      {/* Admin Video Preview Modal */}
      {adminPreviewVideo && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center"
          onClick={closeAdminPreview}
        >
          <div className="relative max-w-4xl w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Admin Preview</h3>
                <p className="text-sm text-white/70">
                  {availableVideos.find(v => v.path === adminPreviewVideo)?.name} - You can continue working while this plays
                </p>
              </div>
              <button
                onClick={closeAdminPreview}
                className="text-white/70 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <video
              src={adminPreviewVideo}
              controls
              autoPlay
              className="w-full rounded-lg"
              style={{ maxHeight: '70vh' }}
            />
            <div className="mt-4 flex gap-3">
              <MissionButton
                variant="primary"
                onClick={() => {
                  setSelectedVideo(adminPreviewVideo);
                  closeAdminPreview();
                }}
              >
                Select This Video
              </MissionButton>
              <MissionButton
                variant="secondary"
                onClick={closeAdminPreview}
              >
                Close Preview
              </MissionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

