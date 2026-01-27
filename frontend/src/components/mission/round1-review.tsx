"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MissionButton } from "@/components/ui/button";
import { getRoundQuestions } from "@project/shared";
import { useSubmissionsRound1, useTeams } from "@/lib/firestore/hooks";
import type { SubmissionRound1, Team } from "@/lib/firestore/models";

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null && "toDate" in value && typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

function formatDateLabel(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type SubmissionWithMeta = SubmissionRound1 & {
  submittedAtDate: Date | null;
};

export function Round1ReviewPanel() {
  const router = useRouter();
  const { submissions } = useSubmissionsRound1();
  const { teams } = useTeams();
  const questions = useMemo(() => getRoundQuestions("round1"), []);

  type TeamLookup = Record<string, Team>;

  const teamLookup = useMemo(
    () => teams.reduce<TeamLookup>((acc: TeamLookup, supabaseTeam) => {
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

  type Question = (typeof questions)[number];
  type QuestionLookup = Record<string, Question>;

  const questionLookup = useMemo(
    () => questions.reduce<QuestionLookup>((acc: QuestionLookup, question) => {
      acc[question.id] = question;
      return acc;
    }, {}),
    [questions],
  );

  const enrichedSubmissions = useMemo<SubmissionWithMeta[]>(
    () =>
      submissions
        .map((supabaseSubmission) => {
          // Convert Supabase submission to expected SubmissionRound1 type
          const submission: SubmissionRound1 = {
            id: supabaseSubmission.id,
            teamId: supabaseSubmission.team_id,
            submittedAt: new Date(supabaseSubmission.submitted_at),
            imageUrl: '', // Not available in Supabase schema
            ocrRaw: '', // Not available in Supabase schema
            ocrClean: '', // Not available in Supabase schema
            score: supabaseSubmission.score || 0,
            logicScore: 0, // Not available in Supabase schema
            stepsScore: 0, // Not available in Supabase schema
            completenessScore: 0, // Not available in Supabase schema
            contextScore: 0, // Not available in Supabase schema
            clarityScore: 0, // Not available in Supabase schema
            confidence: 'medium' as const, // Default value
            feedback: supabaseSubmission.feedback || '',
            questionId: null, // Not available in Supabase schema
            squad: undefined, // Not available in Supabase schema
            attachments: [], // Not available in Supabase schema
          };
          
          return {
            ...submission,
            submittedAtDate: submission.submittedAt,
          };
        })
        .sort((a, b) => (b.submittedAtDate?.getTime() ?? 0) - (a.submittedAtDate?.getTime() ?? 0)),
    [submissions],
  );

  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [questionFilter, setQuestionFilter] = useState<string>("all");

  const filteredSubmissions = useMemo(() => {
    return enrichedSubmissions.filter((submission) => {
      const matchesTeam = teamFilter === "all" || submission.teamId === teamFilter;
      const matchesQuestion = questionFilter === "all" || submission.questionId === questionFilter;
      return matchesTeam && matchesQuestion;
    });
  }, [enrichedSubmissions, teamFilter, questionFilter]);

  const [manualSelectedId, setManualSelectedId] = useState<string | null>(null);

  const selectedSubmission = useMemo(() => {
    const explicit = manualSelectedId
      ? filteredSubmissions.find((submission) => submission.id === manualSelectedId)
      : null;
    return explicit ?? filteredSubmissions[0] ?? null;
  }, [filteredSubmissions, manualSelectedId]);

  const rubricEntries = selectedSubmission
    ? [
        { label: "Logic", score: selectedSubmission.logicScore, max: 4 },
        { label: "Steps", score: selectedSubmission.stepsScore, max: 3 },
        { label: "Completeness", score: selectedSubmission.completenessScore, max: 2 },
        { label: "Context", score: selectedSubmission.contextScore, max: 1 },
        { label: "Clarity", score: selectedSubmission.clarityScore, max: 1 },
      ]
    : [];

  return (
    <section className="glass-panel space-y-6 p-6 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-accent">Round 1 Oversight</p>
          <h2 className="mt-2 text-2xl font-semibold">Submission Review</h2>
          <p className="mt-2 max-w-3xl text-sm text-white/70">
            Inspect every AI-graded submission. Filters below let you focus by squad or question, while the detail panel exposes
            rubric scores, Groq confidence, and the prompt context used during evaluation.
          </p>
        </div>
        <div className="flex gap-3">
          <MissionButton
            variant="secondary"
            onClick={() => router.push('/mission/control')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Control
          </MissionButton>
          <MissionButton
            variant="secondary"
            onClick={() => {
              setTeamFilter("all");
              setQuestionFilter("all");
              setManualSelectedId(null);
            }}
          >
            Reset Filters
          </MissionButton>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr,3fr]">
        <aside className="glass-panel p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs uppercase tracking-[0.4em] text-white/60">
              Squad
              <select
                value={teamFilter}
                onChange={(event) => setTeamFilter(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                <option value="all">All squads</option>
                {enrichedSubmissions.map((submission) => submission.teamId).filter((value, index, array) => array.indexOf(value) === index).map((teamId) => (
                  <option key={teamId} value={teamId}>
                    {teamLookup[teamId]?.name ?? teamId}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs uppercase tracking-[0.4em] text-white/60">
              Question
              <select
                value={questionFilter}
                onChange={(event) => setQuestionFilter(event.target.value || "all")}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                <option value="all">All prompts</option>
                {questions.map((question) => (
                  <option key={question.id} value={question.id}>
                    {question.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 divide-y divide-white/10 glass-panel">
            {filteredSubmissions.length ? (
              filteredSubmissions.map((submission) => {
                const question = submission.questionId ? questionLookup[submission.questionId] : undefined;
                const team = teamLookup[submission.teamId];
                const isActive = selectedSubmission?.id === submission.id;
                return (
                  <button
                    key={submission.id}
                    type="button"
                    onClick={() => setManualSelectedId(submission.id)}
                    className={`block w-full text-left transition ${
                      isActive ? "bg-accent/10" : "hover:bg-white/5"
                    }`}
                  >
                    <div className="space-y-1 px-4 py-3">
                      <p className="text-sm font-semibold text-white">
                        {team?.name ?? submission.teamId}
                      </p>
                      <p className="text-xs text-white/50">{question?.title ?? "Untracked Objective"}</p>
                      <p className="text-xs text-white/40">{formatDateLabel(submission.submittedAtDate)}</p>
                      <p className="text-xs text-accent">{submission.score.toFixed(1)} / 10</p>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="px-4 py-6 text-sm text-white/60">No submissions found for the selected filters.</p>
            )}
          </div>
        </aside>

        <section className="glass-panel p-5">
          {selectedSubmission ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">Submission Detail</p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  {teamLookup[selectedSubmission.teamId]?.name ?? selectedSubmission.teamId}
                </h3>
                <p className="mt-1 text-xs text-white/60">
                  Submitted {formatDateLabel(selectedSubmission.submittedAtDate)} • Confidence {selectedSubmission.confidence.toUpperCase()}
                </p>
              </div>

              <div className="glass-panel p-4">
                <h4 className="text-sm font-semibold text-white">Objective Context</h4>
                <p className="mt-2 text-sm text-white/70">
                  {selectedSubmission.questionId && questionLookup[selectedSubmission.questionId]
                    ? questionLookup[selectedSubmission.questionId].prompt
                    : "No question metadata captured for this submission."}
                </p>
                {selectedSubmission.questionId && questionLookup[selectedSubmission.questionId]?.referenceNotes && (
                  <p className="mt-2 text-xs text-accent">
                    {questionLookup[selectedSubmission.questionId]?.referenceNotes}
                  </p>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <article className="glass-panel p-4">
                  <p className="text-xs uppercase tracking-[0.4em] text-white/50">Total Score</p>
                  <p className="mt-2 text-3xl font-semibold text-accent">{selectedSubmission.score.toFixed(1)} / 10</p>
                  <p className="mt-3 text-xs text-white/60">Groq feedback: {selectedSubmission.feedback || "No additional feedback."}</p>
                </article>
                <article className="glass-panel p-4">
                  <p className="text-xs uppercase tracking-[0.4em] text-white/50">Rubric Breakdown</p>
                  <dl className="mt-2 space-y-2 text-sm text-white/80">
                    {rubricEntries.map((entry) => (
                      <div key={entry.label} className="flex items-center justify-between">
                        <dt>{entry.label}</dt>
                        <dd>{entry.score.toFixed(2)} / {entry.max}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              </div>

              <div className="glass-panel p-4">
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">OCR Transcript</p>
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-sm text-white/70">
                  {selectedSubmission.ocrClean || selectedSubmission.ocrRaw || "OCR transcript unavailable."}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-white/60">
              Select a submission to audit its AI evaluation.
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
