"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Shield, Target, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

import { MissionButton } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { useStory } from "@/components/providers/story-provider";
import {
  useRound2Prompts,
  useSubmissionsRound2,
  useTeams,
} from "@/lib/firestore/hooks";
import type { SubmissionRound2, Team } from "@/lib/firestore/models";
import { readRound2Access } from "@/lib/mission/access";
import { ROUND2_CODE_SNIPPETS } from "@/data/round2-code-snippets";

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

function normalizeLineInput(value: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : NaN;
}

function computeLeaderboard(submissions: SubmissionRound2[]) {
  const enriched = submissions.map((submission) => ({
    ...submission,
    submittedAt: toDate(submission.submittedAt) ?? new Date(0),
  }));

  const bestByTeam = new Map<string, (typeof enriched)[number]>();
  enriched.forEach((entry) => {
    const current = bestByTeam.get(entry.teamId);
    if (!current) {
      bestByTeam.set(entry.teamId, entry);
      return;
    }
    if (entry.totalScore > current.totalScore) {
      bestByTeam.set(entry.teamId, entry);
      return;
    }
    if (entry.totalScore === current.totalScore) {
      const entryDuration = entry.durationSeconds ?? Number.MAX_SAFE_INTEGER;
      const currentDuration = current.durationSeconds ?? Number.MAX_SAFE_INTEGER;
      if (entryDuration < currentDuration) {
        bestByTeam.set(entry.teamId, entry);
        return;
      }
      const entryTime = entry.submittedAt.getTime();
      const currentTime = current.submittedAt.getTime();
      if (entryDuration === currentDuration && entryTime < currentTime) {
        bestByTeam.set(entry.teamId, entry);
      }
    }
  });

  return Array.from(bestByTeam.values()).sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    const aDuration = a.durationSeconds ?? Number.MAX_SAFE_INTEGER;
    const bDuration = b.durationSeconds ?? Number.MAX_SAFE_INTEGER;
    if (aDuration !== bDuration) {
      return aDuration - bDuration;
    }
    return a.submittedAt.getTime() - b.submittedAt.getTime();
  });
}

function findTeamForUser(userEmail: string | null, userTeamId: string | null | undefined, teams: Team[]) {
  if (!userEmail) return undefined;
  if (userTeamId) {
    const direct = teams.find((team) => team.id === userTeamId);
    if (direct) return direct;
  }
  return teams.find((team) =>
    team.members?.some((member) => member.toLowerCase() === userEmail.toLowerCase()),
  );
}

type Round2DraftState = Record<string, { description: string; line: string }>;

const DRAFT_STORAGE_PREFIX = "round2-draft";

export function Round2Workspace() {
  const router = useRouter();
  const { user } = useAuth();
  const { prompts } = useRound2Prompts();
  const { teams } = useTeams();
  const { submissions: allSubmissions } = useSubmissionsRound2();
  const { submissions: teamSubmissions } = useSubmissionsRound2(user?.teamId);
  const { openSegment } = useStory();
  const [hasAccess, setHasAccess] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  // Track language selection for each question (Q1-Q10)
  const [questionLanguages, setQuestionLanguages] = useState<Record<number, string>>({
    1: "Python", 2: "Python", 3: "Python", 4: "Python", 5: "Python",
    6: "Python", 7: "Python", 8: "Python", 9: "Python", 10: "Python"
  });

  const team = useMemo(() => {
    // Convert Supabase teams to expected Team type
    const mappedTeams: Team[] = teams.map(supabaseTeam => ({
      id: supabaseTeam.id,
      name: supabaseTeam.name,
      members: supabaseTeam.members || [],
      createdAt: new Date(supabaseTeam.created_at),
      squad: supabaseTeam.squad as 'FOSS-1' | 'FOSS-2' | undefined,
      round1Score: supabaseTeam.round1_score || undefined,
    }));
    
    return findTeamForUser(user?.email ?? null, user?.teamId, mappedTeams);
  }, [teams, user?.email, user?.teamId]);

  const leaderboard = useMemo(() => {
    // Convert Supabase submissions to expected SubmissionRound2 type
    const mappedSubmissions: SubmissionRound2[] = allSubmissions.map(supabaseSubmission => ({
      id: supabaseSubmission.id,
      teamId: supabaseSubmission.team_id,
      submittedAt: new Date(supabaseSubmission.submitted_at),
      language: undefined, // Not available in Supabase schema
      answers: [], // Would need to parse from bug_results
      evaluations: [], // Would need to parse from bug_results
      totalScore: supabaseSubmission.total_score || 0,
      durationSeconds: undefined, // Not available in Supabase schema
      placement: undefined, // Not available in Supabase schema
    }));
    
    return computeLeaderboard(mappedSubmissions);
  }, [allSubmissions]);
  const placement = useMemo(() => {
    if (!team) return null;
    const index = leaderboard.findIndex((entry) => entry.teamId === team.id);
    return index >= 0 ? index + 1 : null;
  }, [leaderboard, team]);

  const qualified = placement != null && placement > 0 && placement <= 8;

  const languages = useMemo(() => {
    const unique = Array.from(new Set(prompts.map((prompt) => prompt.language))).filter(Boolean) as string[];
    return unique.sort((a, b) => a.localeCompare(b));
  }, [prompts]);

  useEffect(() => {
    if (!languages.length) {
      setSelectedLanguage("");
      return;
    }
    if (!selectedLanguage || !languages.includes(selectedLanguage)) {
      setSelectedLanguage(languages[0]);
    }
  }, [languages, selectedLanguage]);

  const activePrompts = useMemo(() => {
    if (!selectedLanguage) {
      return [] as typeof prompts;
    }
    return prompts
      .filter((prompt) => prompt.language === selectedLanguage)
      .slice(0, 10);
  }, [prompts, selectedLanguage]);

  const latestSubmission = useMemo(() => {
    if (!teamSubmissions.length) return null;
    
    // Since language is not available in Supabase schema, just get the latest submission
    const latest = [...teamSubmissions]
      .map((submission) => ({
        ...submission,
        submittedAt: new Date(submission.submitted_at),
      }))
      .sort((a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0))[0];
    
    return latest || null;
  }, [teamSubmissions]);

  const [draft, setDraft] = useState<Round2DraftState>({});
  const storageKey = useMemo(() => {
    if (!team || !selectedLanguage) {
      return null;
    }
    return `${DRAFT_STORAGE_PREFIX}:${team.id}:${selectedLanguage}`;
  }, [team, selectedLanguage]);

  useEffect(() => {
    if (!storageKey || !activePrompts.length) {
      setDraft({});
      return;
    }

    type Prompt = (typeof activePrompts)[number];
    const baseDraft: Round2DraftState = activePrompts.reduce((acc: Round2DraftState, prompt: Prompt) => {
      acc[prompt.id] = { description: "", line: "" };
      return acc;
    }, {} as Round2DraftState);

    let restored: Round2DraftState | null = null;
    if (typeof window !== "undefined") {
      try {
        const stored = window.sessionStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as Round2DraftState;
          const hydrated: Round2DraftState = { ...baseDraft };
          Object.entries(parsed).forEach(([key, value]) => {
            if (key in hydrated && value) {
              hydrated[key] = {
                description: value.description ?? "",
                line: value.line ?? "",
              };
            }
          });
          restored = hydrated;
        }
      } catch (error) {
        console.warn("Failed to restore Round 2 draft", error);
      }
    }

    if (!restored && latestSubmission) {
      const hydrated: Round2DraftState = { ...baseDraft };
      
      // Parse answers from bug_results JSON
      try {
        const bugResults = latestSubmission.bug_results as any;
        if (Array.isArray(bugResults)) {
          bugResults.forEach((answer: any) => {
            if (answer.promptId && hydrated[answer.promptId]) {
              hydrated[answer.promptId] = {
                description: answer.description ?? "",
                line: Number.isFinite(answer.line) ? String(answer.line) : "",
              };
            }
          });
        }
      } catch (error) {
        console.warn("Failed to parse bug_results", error);
      }
      
      restored = hydrated;
    }

    const nextDraft = restored ?? baseDraft;
    const serialized = JSON.stringify(nextDraft);
    setDraft((prev) => {
      if (JSON.stringify(prev) === serialized) {
        return prev;
      }
      return nextDraft;
    });
  }, [storageKey, activePrompts, latestSubmission]);

  const [submitState, setSubmitState] = useState<
    | { status: "idle" }
    | { status: "submitting" }
    | {
        status: "complete";
        totalScore: number;
        placement: number | null;
        qualified: boolean;
        evaluations: SubmissionRound2["evaluations"];
      }
    | { status: "error"; message: string }
  >({ status: "idle" });
  const startedAtRef = useRef<string>(new Date().toISOString());

  useEffect(() => {
    if (!storageKey || !activePrompts.length) return;
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(draft));
    } catch (error) {
      console.warn("Failed to persist Round 2 draft", error);
    }
  }, [draft, storageKey, activePrompts.length]);

  useEffect(() => {
    setHasAccess(readRound2Access());
    setAccessChecked(true);
  }, []);

  useEffect(() => {
    startedAtRef.current = new Date().toISOString();
  }, []);

  useEffect(() => {
    if (selectedLanguage) {
      startedAtRef.current = new Date().toISOString();
    }
  }, [selectedLanguage]);

  useEffect(() => {
    setSubmitState((prev) => (prev.status === "submitting" ? prev : { status: "idle" }));
  }, [selectedLanguage]);
  const answeredCount = useMemo(
    () =>
      activePrompts.filter((prompt) => {
        const entry = draft[prompt.id];
        return Boolean(entry?.description?.trim()) && entry?.line?.trim();
      }).length,
    [draft, activePrompts],
  );

  const totalPrompts = activePrompts.length;

  const submissionEvaluations = useMemo(() => {
    const base =
      submitState.status === "complete"
        ? submitState.evaluations
        : []; // Evaluations would need to be parsed from bug_results JSON
    const promptIds = new Set(activePrompts.map((prompt) => prompt.id));
    return base.filter((evaluation) => promptIds.has(evaluation.promptId));
  }, [submitState, activePrompts]);

  const submissionScore =
    submitState.status === "complete"
      ? submitState.totalScore
      : latestSubmission?.total_score ?? null;

  const handleDraftChange = (promptId: string, field: "description" | "line", value: string) => {
    setDraft((prev) => ({
      ...prev,
      [promptId]: {
        description: field === "description" ? value : prev[promptId]?.description ?? "",
        line: field === "line" ? value : prev[promptId]?.line ?? "",
      },
    }));
  };

  const handleSubmit = async () => {
    if (!team) {
      setSubmitState({ status: "error", message: "Team assignment missing." });
      return;
    }
    if (!selectedLanguage) {
      setSubmitState({ status: "error", message: "Select a language before submitting." });
      return;
    }
    if (!activePrompts.length) {
      setSubmitState({ status: "error", message: "No prompts available for the selected language." });
      return;
    }
    setSubmitState({ status: "submitting" });
    try {
      // Calculate score based on answered questions (10 points per attempted question)
      let totalScore = 0;
      for (const prompt of activePrompts) {
        if (draft[prompt.id]?.description?.trim()) {
          totalScore += 10;
        }
      }
      
      // Normalize to 0-100 scale
      const maxPossibleScore = activePrompts.length * 10;
      const normalizedScore = Math.min(100, Math.round((totalScore / Math.max(maxPossibleScore, 1)) * 100));
      
      const payload = {
        teamId: team.id,
        total_score: normalizedScore,
        submitted_at: new Date().toISOString(),
        startedAt: startedAtRef.current,
        language: selectedLanguage,
        answers: activePrompts.map((prompt) => ({
          promptId: prompt.id,
          description: draft[prompt.id]?.description?.trim() ?? "",
          line: normalizeLineInput(draft[prompt.id]?.line ?? ""),
        })),
      };

      console.log('[Round2 Submit] Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch("/api/contest/round2/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Submission failed" }));
        throw new Error(body.error ?? "Submission failed");
      }

      const body = (await response.json()) as {
        totalScore: number;
        placement: number | null;
        qualified: boolean;
        evaluations: SubmissionRound2["evaluations"];
      };

      setSubmitState({
        status: "complete",
        totalScore: body.totalScore,
        placement: body.placement,
        qualified: body.qualified,
        evaluations: body.evaluations,
      });
      startedAtRef.current = new Date().toISOString();
    } catch (error) {
      console.error("Round 2 submission failed", error);
      setSubmitState({
        status: "error",
        message: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };

  const missionSummary = qualified
    ? "Commander confirms: your squad advances. Prepare for duel briefing."
    : "Command reviewing all reports. Stay frosty and monitor the leaderboard.";

  if (!accessChecked) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-white">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="space-y-6 glass-panel p-6 text-white">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-accent" />
          <div>
            <h2 className="text-2xl font-semibold">Access Locked</h2>
            <p className="text-sm text-white/70">
              Command requires the Round 2 mission password. Return to the console and enter the code to deploy.
            </p>
          </div>
        </div>
        <MissionButton type="button" variant="secondary" onClick={() => router.push("/mission")}>Return to Console</MissionButton>
      </div>
    );
  }

  return (
    <div className="space-y-6 glass-panel p-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-accent">Phase 2</p>
          <h2 className="mt-2 text-2xl font-semibold">Capture the Hostile</h2>
          <p className="mt-2 max-w-3xl text-sm text-white/70">
            Identify the hidden bug in each dossier. Describe the hostile, mark the exact line, and transmit without alerting the
            crowd. Accuracy first, speed for the tie-break.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {languages.length > 0 && (
            <label className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/60">
              Language
              <select
                className="rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs font-semibold text-white focus:outline-none"
                value={selectedLanguage}
                disabled={submitState.status === "submitting"}
                onChange={(event) => setSelectedLanguage(event.target.value)}
              >
                {languages.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </label>
          )}
          <MissionButton variant="secondary" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Console
          </MissionButton>
          <MissionButton variant="ghost" onClick={() => openSegment("phase2")}>Story Brief</MissionButton>
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Dossiers</p>
            <h3 className="mt-1 text-lg font-semibold">
              {selectedLanguage ? `Bug Identification Pack • ${selectedLanguage}` : "Bug Identification Pack"}
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              Each snippet hides one hostile. Provide a clear diagnosis and the exact line number. Command accepts partial
              credit if you&apos;re within a single line.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-black/50 px-4 py-2 text-xs uppercase tracking-[0.4em] text-white/60">
            {answeredCount}/{totalPrompts} locked in
          </div>
        </header>

        {selectedLanguage && totalPrompts > 0 && totalPrompts < 10 && (
          <p className="mt-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            Only {totalPrompts} dossier{totalPrompts === 1 ? "" : "s"} are live for {selectedLanguage}. Command will deploy the
            remaining files shortly.
          </p>
        )}

        <div className="mt-5 space-y-5">
          {activePrompts.length === 0 ? (
            <article className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-5 text-sm text-white/70">
              Command has not deployed dossiers for this language yet. Check back soon or select a different language.
            </article>
          ) : (
            activePrompts.map((prompt, index) => {
            const entry = draft[prompt.id] ?? { description: "", line: "" };
            const evaluation = submissionEvaluations.find((item) => item.promptId === prompt.id);
            const evaluationBadge = evaluation
              ? evaluation.points === 1
                ? "correct"
                : evaluation.points === 0.5
                  ? "partial"
                  : "incorrect"
              : null;

              const questionNum = index + 1;
              const currentLanguage = questionLanguages[questionNum] || "Python";
              const hasMultiLanguage = ROUND2_CODE_SNIPPETS[questionNum] !== undefined;
              const displaySnippet = hasMultiLanguage && ROUND2_CODE_SNIPPETS[questionNum][currentLanguage]
                ? ROUND2_CODE_SNIPPETS[questionNum][currentLanguage]
                : prompt.snippet;

              return (
                <article key={prompt.id} className="glass-panel p-5">
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                      #{questionNum} • {prompt.language} • {prompt.difficulty}
                    </p>
                    <h4 className="mt-1 text-lg font-semibold text-white">{prompt.title}</h4>
                    {prompt.context && <p className="mt-2 text-sm text-white/70">{prompt.context}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    {hasMultiLanguage && (
                      <select
                        className="rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-accent/50"
                        value={currentLanguage}
                        onChange={(event) => setQuestionLanguages(prev => ({
                          ...prev,
                          [questionNum]: event.target.value
                        }))}
                      >
                        <option value="Python">Python</option>
                        <option value="C">C</option>
                        <option value="C++">C++</option>
                        <option value="Java">Java</option>
                      </select>
                    )}
                    {evaluationBadge && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.3em] ${
                          evaluationBadge === "correct"
                            ? "bg-emerald-500/20 text-emerald-200"
                            : evaluationBadge === "partial"
                              ? "bg-amber-500/20 text-amber-200"
                              : "bg-rose-500/20 text-rose-200"
                        }`}
                      >
                        {evaluationBadge}
                      </span>
                    )}
                  </div>
                </header>

                <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-black/70 p-4 text-xs leading-relaxed text-white/80">
                  <code>{displaySnippet}</code>
                </pre>
                {prompt.tags?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.3em] text-white/40">
                    {prompt.tags.map((tag: string) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs uppercase tracking-[0.3em] text-white/60">Bug description</label>
                    <textarea
                      className="mt-2 h-24 w-full rounded-xl border border-white/10 bg-black/60 p-3 text-sm text-white"
                      placeholder="Describe the hostile."
                      value={entry.description}
                      onChange={(event) => handleDraftChange(prompt.id, "description", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-[0.3em] text-white/60">Line number</label>
                    <input
                      className="mt-2 w-32 rounded-xl border border-white/10 bg-black/60 p-2 text-sm text-white"
                      placeholder="e.g. 12"
                      value={entry.line}
                      onChange={(event) => handleDraftChange(prompt.id, "line", event.target.value)}
                    />
                  </div>
                  {evaluation && (
                    <p className="text-xs text-white/60">
                      {evaluation.feedback} ({evaluation.points} pts)
                    </p>
                  )}
                </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="glass-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Mission Log</p>
            <h3 className="mt-1 text-lg font-semibold text-white">Submission Summary</h3>
            <p className="mt-2 text-sm text-white/70">Speed only breaks ties. Accuracy is mandatory.</p>
          </div>
          <MissionButton
            onClick={handleSubmit}
            loading={submitState.status === "submitting"}
            disabled={submitState.status === "submitting" || !activePrompts.length || !selectedLanguage}
          >
            {submitState.status === "submitting" ? (
              <span className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Transmitting
              </span>
            ) : (
              "Submit Round 2"
            )}
          </MissionButton>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-4">
          <article className="glass-panel p-4 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Score</p>
            <p className="mt-2 text-3xl font-semibold text-accent">
              {submissionScore != null ? `${submissionScore.toFixed(1)} / 10` : "—"}
            </p>
          </article>
          <article className="glass-panel p-4 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Placement</p>
            <p className="mt-2 text-3xl font-semibold text-accent">
              {placement != null ? `#${placement}` : "Pending"}
            </p>
          </article>
          <article className="glass-panel p-4 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Qualified</p>
            <p className={`mt-2 text-2xl font-semibold ${qualified ? "text-emerald-300" : "text-white/60"}`}>
              {qualified ? "Advancing" : "TBD"}
            </p>
          </article>
          <article className="glass-panel p-4 text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Entries</p>
            <p className="mt-2 text-3xl font-semibold text-accent">{answeredCount}</p>
          </article>
        </div>

        {submitState.status === "error" && (
          <p className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
            {submitState.message}
          </p>
        )}

        <p className="mt-4 text-sm text-white/70">{missionSummary}</p>
      </section>

      <section className="glass-panel p-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-accent" />
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/60">Leaderboard</p>
              <h3 className="mt-1 text-lg font-semibold text-white">Top 8 Advance to Round 3</h3>
            </div>
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Score &gt; Time</p>
        </header>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-white/80">
            <thead className="text-xs uppercase tracking-[0.3em] text-white/40">
              <tr>
                <th className="pb-2">Seed</th>
                <th className="pb-2">Team</th>
                <th className="pb-2">Language</th>
                <th className="pb-2">Score</th>
                <th className="pb-2">Duration</th>
                <th className="pb-2">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.slice(0, 12).map((entry, index) => {
                const isMe = team?.id === entry.teamId;
                const submittedAt = toDate(entry.submittedAt);
                return (
                  <tr
                    key={`${entry.teamId}-${index}`}
                    className={`border-t border-white/10 ${isMe ? "bg-accent/10" : "bg-transparent"}`}
                  >
                    <td className="py-2">#{index + 1}</td>
                    <td className="py-2">{entry.teamId}</td>
                    <td className="py-2">{entry.language ?? "—"}</td>
                    <td className="py-2">{entry.totalScore.toFixed(1)}</td>
                    <td className="py-2">
                      {entry.durationSeconds != null && Number.isFinite(entry.durationSeconds)
                        ? `${Math.round(entry.durationSeconds)}s`
                        : "—"}
                    </td>
                    <td className="py-2 text-xs text-white/60">
                      {submittedAt ? submittedAt.toLocaleTimeString() : "—"}
                    </td>
                  </tr>
                );
              })}
              {!leaderboard.length && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-white/60">
                    Awaiting first submission.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-panel p-5">
        <h3 className="text-lg font-semibold text-white">Field Brief</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <article className="glass-panel p-4 text-sm text-white/70">
            <Shield className="mb-3 h-6 w-6 text-accent" />
            No changes to code allowed. Identify only.
          </article>
          <article className="glass-panel p-4 text-sm text-white/70">
            <Target className="mb-3 h-6 w-6 text-accent" />
            Line precision matters. Off-by-one earns partial credit at best.
          </article>
          <article className="glass-panel p-4 text-sm text-white/70">
            <CheckCircle2 className="mb-3 h-6 w-6 text-accent" />
            Command ranks by score, then speed. Keep your squad coordinated.
          </article>
        </div>
      </section>
    </div>
  );
}
