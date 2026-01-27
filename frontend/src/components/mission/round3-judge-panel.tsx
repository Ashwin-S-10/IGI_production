"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Scale, CheckCircle2, Clock3, Loader2, RefreshCcw, ArrowLeft } from "lucide-react";

import { MissionButton } from "@/components/ui/button";
import {
  useRound3Duels,
  useRound3Questions,
  useRound3Submissions,
  useTeams,
} from "@/lib/firestore/hooks";
import type { Round3Duel, Round3Submission, Round3Question, Team } from "@/lib/firestore/models";

type JudgeAlert =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

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

function formatTime(value: Date | null): string {
  if (!value) return "—";
  return value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const STATUS_COLORS: Record<Round3Duel["status"], string> = {
  pending: "text-slate-300",
  scheduled: "text-accent",
  active: "text-emerald-300",
  awaiting_judgement: "text-amber-300",
  judged: "text-emerald-200",
  rematch_scheduled: "text-rose-300",
};

export function Round3JudgePanel() {
  const router = useRouter();
  const { duels } = useRound3Duels();
  const { submissions } = useRound3Submissions();
  const { questions } = useRound3Questions();
  const { teams } = useTeams();

  const [selectedDuelId, setSelectedDuelId] = useState<string | null>(null);
  const [overrideSolutionA, setOverrideSolutionA] = useState<string>("");
  const [overrideSolutionB, setOverrideSolutionB] = useState<string>("");
  const [judgeState, setJudgeState] = useState<"idle" | "loading">("idle");
  const [alert, setAlert] = useState<JudgeAlert>({ type: "idle" });

  type SupabaseTeam = (typeof teams)[number];
  type TeamLookup = Record<string, Team>;

  const teamLookup = useMemo(
    () =>
      teams.reduce<TeamLookup>((acc: TeamLookup, supabaseTeam: SupabaseTeam) => {
        // Convert Supabase team to expected Team type
        const team: Team = {
          id: supabaseTeam.id,
          name: supabaseTeam.name,
          members: supabaseTeam.members || [],
          createdAt: new Date(supabaseTeam.created_at),
          squad: supabaseTeam.squad as 'FOSS-1' | 'FOSS-2' | undefined,
          round1Score: supabaseTeam.round1_score || undefined,
        };
        acc[team.id] = team;
        return acc;
      }, {}),
    [teams],
  );

  type QuestionLookupType = Record<string, Round3Question>;

  const questionLookup = useMemo(
    () =>
      questions.reduce<QuestionLookupType>((acc: QuestionLookupType, question: Round3Question) => {
        acc[question.id] = question;
        return acc;
      }, {}),
    [questions],
  );

  type SubmissionsLookup = Record<string, Round3Submission>;

  const submissionsById = useMemo(
    () =>
      submissions.reduce<SubmissionsLookup>((acc: SubmissionsLookup, submission: Round3Submission) => {
        acc[submission.id] = submission;
        return acc;
      }, {}),
    [submissions],
  );

  const sortedDuels = useMemo(() => {
    return [...duels]
      .map((duel) => ({
        ...duel,
        startTime: toDate(duel.startTime),
        judgedAt: toDate(duel.judgedAt),
      }))
      .sort((a, b) => {
        if (a.status === "awaiting_judgement" && b.status !== "awaiting_judgement") return -1;
        if (b.status === "awaiting_judgement" && a.status !== "awaiting_judgement") return 1;
        if (a.round !== b.round) return a.round - b.round;
        const aTime = a.startTime?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bTime = b.startTime?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      });
  }, [duels]);

  const selectedDuel = useMemo(() => {
    if (!sortedDuels.length) return null;
    const fallback = sortedDuels[0];
    const explicit = selectedDuelId ? sortedDuels.find((duel) => duel.id === selectedDuelId) : null;
    return explicit ?? fallback;
  }, [sortedDuels, selectedDuelId]);

  const submissionA = selectedDuel?.submissionA ? submissionsById[selectedDuel.submissionA] : undefined;
  const submissionB = selectedDuel?.submissionB ? submissionsById[selectedDuel.submissionB] : undefined;

  useEffect(() => {
    if (!selectedDuel) return;
    const nextOverrideA = submissionA?.answer ?? "";
    const nextOverrideB = submissionB?.answer ?? "";
    setOverrideSolutionA(nextOverrideA);
    setOverrideSolutionB(nextOverrideB);
  }, [selectedDuel, submissionA?.answer, submissionB?.answer]);

  const resetAlert = () => setAlert({ type: "idle" });

  const judgeDuel = async () => {
    if (!selectedDuel) return;
    setJudgeState("loading");
    resetAlert();

    try {
      const payload: Record<string, unknown> = { duelId: selectedDuel.id };
      const trimmedA = overrideSolutionA.trim();
      const trimmedB = overrideSolutionB.trim();
      if (trimmedA && trimmedA !== (submissionA?.answer ?? "")) {
        payload.overrideSolutionA = trimmedA;
      }
      if (trimmedB && trimmedB !== (submissionB?.answer ?? "")) {
        payload.overrideSolutionB = trimmedB;
      }

      const response = await fetch("/api/contest/round3/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Unable to judge duel." }));
        throw new Error(body.error ?? "Unable to judge duel.");
      }

      const body = await response.json();
      const { result } = body as { result?: { winner?: string; reason?: string } };
      const winnerLabel =
        result?.winner === "A"
          ? teamLookup[selectedDuel.teamA]?.name ?? selectedDuel.teamA
          : result?.winner === "B"
          ? teamLookup[selectedDuel.teamB]?.name ?? selectedDuel.teamB
          : "Rematch";

      setAlert({
        type: "success",
        message: result?.winner === "rematch"
          ? "Rematch ordered. Bracket will update automatically."
          : `Winner locked: ${winnerLabel}. ${result?.reason ?? ""}`.trim(),
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Judging failed due to an unexpected error.",
      });
    } finally {
      setJudgeState("idle");
    }
  };

  const question = selectedDuel?.questionId ? questionLookup[selectedDuel.questionId] : undefined;

  return (
    <section className="glass-panel space-y-6 p-6 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-accent">Round 3 Oversight</p>
          <h2 className="mt-2 text-2xl font-semibold">Duel Judging Console</h2>
          <p className="mt-2 max-w-3xl text-sm text-white/70">
            Compare submissions side-by-side and trigger Groq adjudication for duels awaiting judgement. Override fields if you
            need to inject corrected transcripts before committing the verdict.
          </p>
        </div>
        <div className="flex gap-3">
          <MissionButton variant="secondary" onClick={() => router.push('/mission/control')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Control
          </MissionButton>
          <MissionButton variant="secondary" onClick={() => setSelectedDuelId(null)}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Reset Selection
          </MissionButton>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
        <aside className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-white">Bracket Feed</h3>
          <p className="mt-1 text-xs text-white/60">Select a duel to review submissions and lock the winner.</p>
          <div className="mt-4 space-y-3">
            {sortedDuels.length ? (
              sortedDuels.map((duel) => {
                const isActive = selectedDuel?.id === duel.id;
                const winnerTeam = duel.winnerTeamId ? teamLookup[duel.winnerTeamId] : undefined;
                return (
                  <button
                    key={duel.id}
                    type="button"
                    onClick={() => setSelectedDuelId(duel.id)}
                    className={`w-full rounded-2xl border border-white/10 bg-black/40 p-3 text-left transition hover:border-accent/60 ${
                      isActive ? "border-accent/60" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em]">
                      <span className="text-white/60">Round {duel.round}</span>
                      <span className={STATUS_COLORS[duel.status as keyof typeof STATUS_COLORS]}> {duel.status.replace(/_/g, " ")}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {duel.teamA || "TBD"} vs {duel.teamB || "TBD"}
                    </p>
                    {duel.status === "judged" && duel.result && (
                      <p className="mt-1 text-xs text-emerald-300">
                        Winner: {winnerTeam?.name ?? duel.winnerTeamId ?? duel.result.winner}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-white/50">Start {formatTime(duel.startTime)}</p>
                  </button>
                );
              })
            ) : (
              <p className="glass-panel p-4 text-sm text-white/60">
                No round 3 duels available.
              </p>
            )}
          </div>
        </aside>

        <section className="space-y-4">
          {selectedDuel ? (
            <div className="glass-panel p-5">
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-white/50">Current Duel</p>
                  <h3 className="text-lg font-semibold text-white">
                    {teamLookup[selectedDuel.teamA]?.name ?? selectedDuel.teamA} vs {teamLookup[selectedDuel.teamB]?.name ?? selectedDuel.teamB}
                  </h3>
                  <p className="mt-1 text-xs text-white/60">
                    {question?.title ?? selectedDuel.problemId} • ID {selectedDuel.id}
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/50">
                  <Clock3 className="mr-2 inline h-4 w-4" /> {selectedDuel.status.replace(/_/g, " ")}
                </div>
              </header>

              {question?.prompt ? (
                <article className="mt-4 glass-panel p-4 text-sm text-white/70">
                  <h4 className="text-xs uppercase tracking-[0.3em] text-white/50">Mission Prompt</h4>
                  <p className="mt-2 whitespace-pre-wrap">{question.prompt}</p>
                </article>
              ) : null}

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <article className="glass-panel p-4">
                  <h4 className="text-xs uppercase tracking-[0.3em] text-white/60">Squad A Submission</h4>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {teamLookup[selectedDuel.teamA]?.name ?? selectedDuel.teamA}
                  </p>
                  <textarea
                    className="mt-3 h-48 w-full rounded-xl border border-white/10 bg-black/70 p-3 text-sm text-white"
                    value={overrideSolutionA}
                    onChange={(event) => setOverrideSolutionA(event.target.value)}
                  />
                  <p className="mt-2 text-xs text-white/50">
                    Submitted {formatTime(submissionA ? toDate(submissionA.submittedAt) : null)} •
                    {" "}
                    {submissionA?.durationSeconds ? `${submissionA.durationSeconds}s` : "duration unknown"}
                  </p>
                </article>
                <article className="glass-panel p-4">
                  <h4 className="text-xs uppercase tracking-[0.3em] text-white/60">Squad B Submission</h4>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {teamLookup[selectedDuel.teamB]?.name ?? selectedDuel.teamB}
                  </p>
                  <textarea
                    className="mt-3 h-48 w-full rounded-xl border border-white/10 bg-black/70 p-3 text-sm text-white"
                    value={overrideSolutionB}
                    onChange={(event) => setOverrideSolutionB(event.target.value)}
                  />
                  <p className="mt-2 text-xs text-white/50">
                    Submitted {formatTime(submissionB ? toDate(submissionB.submittedAt) : null)} •
                    {" "}
                    {submissionB?.durationSeconds ? `${submissionB.durationSeconds}s` : "duration unknown"}
                  </p>
                </article>
              </div>

              {selectedDuel.result ? (
                <article className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em]">
                    <CheckCircle2 className="h-4 w-4" /> Last Verdict
                  </div>
                  <p className="mt-2 text-sm text-emerald-100">
                    Winner: {selectedDuel.result.winner === "rematch"
                      ? "Rematch ordered"
                      : teamLookup[selectedDuel.winnerTeamId ?? (selectedDuel.result.winner === "A" ? selectedDuel.teamA : selectedDuel.teamB)]?.name ?? selectedDuel.winnerTeamId ?? selectedDuel.result.winner}
                  </p>
                  {selectedDuel.result.reason ? (
                    <p className="mt-1 text-xs text-emerald-100/90">{selectedDuel.result.reason}</p>
                  ) : null}
                  {selectedDuel.result.scores ? (
                    <dl className="mt-2 grid gap-2 text-xs text-emerald-100/80 md:grid-cols-2">
                      <div>
                        <dt className="uppercase tracking-[0.3em]">Squad A</dt>
                        <dd>Correctness {selectedDuel.result.scores.A.correct ? "✔" : "✖"}, clarity {selectedDuel.result.scores.A.clarity}, steps {selectedDuel.result.scores.A.steps}</dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-[0.3em]">Squad B</dt>
                        <dd>Correctness {selectedDuel.result.scores.B.correct ? "✔" : "✖"}, clarity {selectedDuel.result.scores.B.clarity}, steps {selectedDuel.result.scores.B.steps}</dd>
                      </div>
                    </dl>
                  ) : null}
                </article>
              ) : null}

              {alert.type !== "idle" ? (
                <div
                  className={`mt-4 flex items-center gap-2 rounded-2xl border p-3 text-sm ${
                    alert.type === "error"
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                  }`}
                >
                  {alert.type === "error" ? <AlertTriangle className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
                  <span>{alert.message}</span>
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                  Groq adjudication will persist results to Firestore and advance bracket slots automatically.
                </p>
                <MissionButton
                  onClick={judgeDuel}
                  loading={judgeState === "loading"}
                  disabled={judgeState === "loading" || !submissionA || !submissionB}
                >
                  {judgeState === "loading" ? (
                    <span className="flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" /> Judging…
                    </span>
                  ) : (
                    "Judge With Groq"
                  )}
                </MissionButton>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center glass-panel p-5 text-sm text-white/60">
              Select a duel from the left column to begin judging.
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
