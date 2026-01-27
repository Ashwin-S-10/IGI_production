"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, UploadCloud, X } from "lucide-react";

import { MissionButton } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { getRoundQuestions } from "@project/shared";
import { useRound3Duels, useTeams } from "@/lib/firestore/hooks";

const ROUND_CONTENT: Record<string, { title: string; description: string; instructions: string[] }> = {
  round1: {
    title: "Round 1 — Algorithm Challenge",
    description: "Select an objective from the mission pack, capture your working, and let the scoring AI evaluate it.",
    instructions: [
      "Attach a photo or PDF of your calculations.",
      "Document key reasoning in the mission log for the judges.",
      "Submit to trigger OCR cleanup and scoring.",
    ],
  },
};

type Round1WorkspaceProps = {
  roundId: string;
};

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"] as const;
  const index = Math.min(Math.floor(Math.log10(bytes) / 3), units.length - 1);
  const value = bytes / 10 ** (index * 3);
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function Round1Workspace({ roundId }: Round1WorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { duels } = useRound3Duels();
  const { teams } = useTeams();
  const { user } = useAuth();
  const context = useMemo(() => ROUND_CONTENT[roundId] ?? ROUND_CONTENT.round1, [roundId]);
  const view = searchParams.get("view");
  const questions = useMemo(() => getRoundQuestions(roundId), [roundId]);
  const userTeamId = user?.teamId ?? null;
  const [submissionTeamId, setSubmissionTeamId] = useState<string | null>(userTeamId);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(() =>
    questions.length ? questions[0].id : null,
  );
  const effectiveSelectedQuestionId = useMemo(() => {
    if (!selectedQuestionId) return questions[0]?.id ?? null;
    return questions.some((question) => question.id === selectedQuestionId)
      ? selectedQuestionId
      : questions[0]?.id ?? null;
  }, [questions, selectedQuestionId]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [scorecard, setScorecard] = useState<{
    score: number;
    logic: number;
    steps: number;
    completeness: number;
    clarity: number;
    context: number;
    confidence: 'high' | 'medium' | 'low';
    questionId: string | null;
  } | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadManifest, setUploadManifest] = useState<Record<string, {
    storagePath: string;
    uploadUrl: string;
    downloadUrl: string;
    contentType: string;
    size: number;
  }>>({});
  const [isDragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeQuestion = useMemo(
    () => questions.find((question) => question.id === effectiveSelectedQuestionId) ?? null,
    [questions, effectiveSelectedQuestionId],
  );
  const bracketEntries = useMemo(
    () =>
      duels.map((duel) => {
        const statusLabel =
          duel.status === "judged" && duel.result
            ? duel.result.winner === "rematch"
              ? "Rematch scheduled"
              : `Winner ${duel.result.winner}`
            : duel.status.replace(/_/g, " ");
        return {
          id: duel.id,
          matchup: `${duel.teamA} vs ${duel.teamB}`,
          problemId: duel.problemId,
          status: statusLabel,
        };
      }),
    [duels],
  );

  const canChooseTeam = (user?.role === "admin" || !userTeamId) && teams.length > 0;

  const evaluatedQuestion = useMemo(() => {
    if (!scorecard?.questionId) return null;
    return questions.find((question) => question.id === scorecard.questionId) ?? null;
  }, [questions, scorecard?.questionId]);

  useEffect(() => {
    if (userTeamId) {
      setSubmissionTeamId(userTeamId);
    }
  }, [userTeamId]);

  useEffect(() => {
    if (!userTeamId && !submissionTeamId && teams.length) {
      setSubmissionTeamId(teams[0].id);
    }
  }, [teams, submissionTeamId, userTeamId]);

  const handleIncomingFiles = useCallback((incoming: FileList | File[]) => {
    const nextFiles = Array.from(incoming);
    if (!nextFiles.length) return;
    setAttachments((prev) => {
      const seen = new Map(prev.map((file) => [`${file.name}-${file.lastModified}`, file]));
      nextFiles.forEach((file) => {
        const key = `${file.name}-${file.lastModified}`;
        if (!seen.has(key)) {
          seen.set(key, file);
        }
      });
      return Array.from(seen.values()).slice(0, 8);
    });
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      if (event.dataTransfer?.files?.length) {
        handleIncomingFiles(event.dataTransfer.files);
      }
    },
    [handleIncomingFiles],
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    if (!isDragging) setDragging(true);
  }, [isDragging]);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node)) return;
    setDragging(false);
  }, []);

  const handleFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files?.length) {
        handleIncomingFiles(event.target.files);
        event.target.value = "";
      }
    },
    [handleIncomingFiles],
  );

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const triggerFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const provisionUploads = useCallback(async () => {
    if (!attachments.length) {
      return [] as Array<{
        name: string;
        size: number;
        type: string;
        storagePath: string;
        downloadUrl: string;
      }>;
    }

    const response = await fetch("/api/uploads/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files: attachments.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          clientId: `${file.name}-${file.lastModified}`,
        })),
        scope: "round1",
        teamId: submissionTeamId ?? undefined,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "File staging failed" }));
      throw new Error(body.error ?? "File staging failed");
    }

    const body = (await response.json()) as {
      uploads: Array<{
        name: string;
        size: number;
        contentType: string;
        storagePath: string;
        uploadUrl: string;
        downloadUrl: string;
        clientId?: string;
      }>;
    };

    const manifest = body.uploads.reduce<Record<string, {
      storagePath: string;
      uploadUrl: string;
      downloadUrl: string;
      contentType: string;
      size: number;
    }>>((acc, item) => {
      const key = item.clientId ?? `${item.name}-${item.storagePath}`;
      acc[key] = {
        storagePath: item.storagePath,
        uploadUrl: item.uploadUrl,
        downloadUrl: item.downloadUrl,
        contentType: item.contentType,
        size: item.size,
      };
      return acc;
    }, {});

    setUploadManifest(manifest);

    await Promise.all(
      attachments.map(async (file) => {
        const key = `${file.name}-${file.lastModified}`;
        const entry = manifest[key];
        if (!entry) return;
        const uploadResponse = await fetch(entry.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": entry.contentType,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }),
    );

    return attachments.map((file) => {
      const key = `${file.name}-${file.lastModified}`;
      const entry = manifest[key];
      if (!entry) {
        throw new Error(`Missing upload manifest for ${file.name}`);
      }

      return {
        name: file.name,
        size: entry.size,
        type: entry.contentType,
        storagePath: entry.storagePath,
        downloadUrl: entry.downloadUrl,
      };
    });
  }, [attachments, submissionTeamId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setAnalysis(null);
    if (!submissionTeamId) {
      setStatus("Select a squad before transmitting.");
      setSubmitting(false);
      return;
    }

    setStatus("Analyzing upload with mission AI...");
    const inputSignal = `${notes} ${attachments.map((file) => file.name).join(" ")}`.trim();

    try {
      const stagedAttachments = await provisionUploads();
      const payload = {
        round: "round1",
        questionId: activeQuestion?.id ?? null,
        notes,
        attachments: stagedAttachments,
        signalLength: inputSignal.split(/\s+/).filter(Boolean).length,
        teamId: submissionTeamId,
      };

      const response = await fetch("/api/contest/round1/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Mission AI unavailable." }));
        throw new Error(body.error ?? "Mission AI unavailable");
      }

      const body = (await response.json()) as {
        questionId?: string | null;
        score: number;
        rubric: {
          logic: number;
          steps: number;
          completeness: number;
          clarity: number;
          context: number;
        };
        confidence: "high" | "medium" | "low";
        summary: string;
        attachments?: Array<{
          name: string;
          size: number;
          type: string;
          storagePath: string;
          downloadUrl: string;
        }>;
      };

      setScorecard((prev) => ({
        score: body.score,
        logic: body.rubric.logic,
        steps: body.rubric.steps,
        completeness: body.rubric.completeness,
        clarity: body.rubric.clarity,
        context: body.rubric.context,
        confidence: body.confidence,
        questionId: body.questionId ?? activeQuestion?.id ?? prev?.questionId ?? null,
      }));
      setAnalysis(body.summary);
      setStatus("Analysis complete — review the mission AI verdict.");
      setAttachments([]);
      setUploadManifest({});
    } catch (error) {
      console.error("Round 1 analysis error", error);
      setStatus(error instanceof Error ? error.message : "Mission AI unavailable.");
      setScorecard(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 rounded-3xl border border-white/10 bg-black/40 p-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-accent">Mission Workspace</p>
          <h2 className="mt-2 text-2xl font-semibold">{context.title}</h2>
          <p className="mt-2 max-w-3xl text-sm text-white/70">{context.description}</p>
        </div>
        <MissionButton variant="secondary" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back to Console
        </MissionButton>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        {canChooseTeam && (
          <div className="mb-6">
            <label className="text-xs uppercase tracking-[0.4em] text-white/60">Squad Selection</label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <select
                value={submissionTeamId ?? ""}
                onChange={(event) => setSubmissionTeamId(event.target.value || null)}
                className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50 md:w-auto"
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name || team.id}
                  </option>
                ))}
              </select>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                Choose the squad whose evidence you are submitting.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-accent">Mission Question Pack</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Select Your Objective</h3>
            <p className="mt-2 text-sm text-white/70">
              Each round ships with curated objectives. Choose the one you are attempting so the scoring pipeline can
              label submissions correctly.
            </p>
          </div>
        </div>
        {questions.length ? (
          <>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              {questions.map((question) => {
                const isActive = question.id === effectiveSelectedQuestionId;
                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => setSelectedQuestionId(question.id)}
                    className={`rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-accent ${
                      isActive ? "border-accent bg-accent/10" : "border-white/10 bg-black/30 hover:border-accent/60"
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.4em] text-white/60">{question.difficulty}</p>
                    <h4 className="mt-2 text-lg font-semibold text-white">{question.title}</h4>
                    <p className="mt-2 text-sm text-white/70">{question.prompt}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-white/50">
                      <span>{question.points} pts</span>
                      <span>• {question.timeLimit}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {activeQuestion && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-6">
                <h3 className="text-lg font-semibold text-white">Objective Brief</h3>
                <p className="mt-3 whitespace-pre-line text-sm text-white/70">{activeQuestion.prompt}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/70">
                  {activeQuestion.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
                {activeQuestion.referenceNotes && (
                  <p className="mt-4 text-sm text-accent">{activeQuestion.referenceNotes}</p>
                )}
                {activeQuestion.starterCode && (
                  <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/70 p-4 text-xs leading-relaxed text-white/80">
                    <code>{activeQuestion.starterCode}</code>
                  </pre>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="mt-4 text-sm text-white/70">
            Command has not published question packs for this round yet. Check back after the operations briefing.
          </p>
        )}
      </div>

      {view === "bracket" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          <h3 className="text-lg font-semibold text-white">Bracket Overview</h3>
          {bracketEntries.length ? (
            <ul className="mt-3 space-y-2">
              {bracketEntries.map((entry) => (
                <li key={entry.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="text-sm font-semibold text-white">{entry.matchup}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Challenge: {entry.problemId} — Status: {entry.status}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2">
              Duel pairings are not available yet. Mission Control will publish live brackets once the final squads are
              seeded.
            </p>
          )}
        </div>
      )}

      {view === "final-proof" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          <h3 className="text-lg font-semibold text-white">Final Proof Upload</h3>
          <p className="mt-2">
            Drop evidence packs, debrief summaries, or victory statements here. Files remain local in this build while
            storage integration is pending.
          </p>
        </div>
      )}

      <div
        className={`rounded-2xl border border-dashed ${isDragging ? "border-accent bg-accent/10" : "border-white/20 bg-white/5"} p-6 text-sm text-white/70 transition`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
        <div className="flex flex-wrap items-center gap-3">
          <UploadCloud className="h-6 w-6 text-accent" />
          <div>
            <p>
              {isDragging
                ? "Release to add your evidence pack."
                : "Drag & drop mission evidence (images or PDFs). Files upload securely before scoring begins."}
            </p>
            <button
              type="button"
              onClick={triggerFilePicker}
              className="mt-2 rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70 hover:border-accent hover:text-accent"
            >
              Or browse files
            </button>
          </div>
        </div>
        {attachments.length > 0 && (
          <ul className="mt-4 space-y-2 text-xs text-white/80">
            {attachments.map((file, index) => (
              <li
                key={`${file.name}-${file.lastModified}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2"
              >
                <div className="truncate">
                  <span className="font-semibold text-white">{file.name}</span>
                  <span className="ml-2 text-white/50">{formatFileSize(file.size)}</span>
                  {uploadManifest[`${file.name}-${file.lastModified}`] && (
                    <span className="ml-3 inline-flex items-center rounded-full border border-emerald-400/50 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.3em] text-emerald-200">
                      Ready
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="ml-3 flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-white/60 transition hover:border-rose-400 hover:text-rose-300"
                >
                  <X className="h-3 w-3" /> Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        {!attachments.length && (
          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-white/40">No evidence packs staged yet.</p>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <label className="text-xs uppercase tracking-[0.4em] text-white/60">Mission Notes</label>
        <textarea
          className="mt-3 h-40 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white"
          placeholder="Summarise your approach, steps, or identified bugs here."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.4em] text-white/40">
            {notes.length ? `${notes.length} characters drafted` : "Awaiting mission input"}
          </div>
          <MissionButton loading={isSubmitting} onClick={handleSubmit}>
            Transmit Submission
          </MissionButton>
        </div>
        {status && <p className="mt-3 text-sm text-accent">{status}</p>}
        {(scorecard || analysis) && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <h3 className="text-lg font-semibold text-white">AI Analysis Result</h3>
            {scorecard && (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <article className="rounded-xl border border-white/10 bg-black/50 p-4">
                  <p className="text-xs uppercase tracking-[0.4em] text-white/50">Total Score</p>
                  <p className="mt-1 text-3xl font-semibold text-emerald-300">{scorecard.score.toFixed(1)} / 10</p>
                  <p className="mt-3 text-xs text-white/60">Confidence {scorecard.confidence.toUpperCase()}</p>
                  <p className="mt-2 text-xs text-white/60">
                    Objective:&nbsp;
                    {evaluatedQuestion ? `${evaluatedQuestion.title} (${evaluatedQuestion.points} pts)` : "Untracked"}
                  </p>
                </article>
                <article className="rounded-xl border border-white/10 bg-black/50 p-4">
                  <p className="text-xs uppercase tracking-[0.4em] text-white/50">Rubric Breakdown</p>
                  <dl className="mt-2 space-y-2 text-sm text-white/80">
                    <div className="flex items-center justify-between">
                      <dt>Logic</dt>
                      <dd>{scorecard.logic.toFixed(1)} / 4</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Steps</dt>
                      <dd>{scorecard.steps.toFixed(1)} / 3</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Completeness</dt>
                      <dd>{scorecard.completeness.toFixed(1)} / 2</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Context</dt>
                      <dd>{scorecard.context.toFixed(1)} / 1</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Clarity</dt>
                      <dd>{scorecard.clarity.toFixed(1)} / 1</dd>
                    </div>
                  </dl>
                </article>
              </div>
            )}
            {analysis && <p className="mt-4 text-sm text-white/70">{analysis}</p>}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
        <h3 className="text-lg font-semibold text-white">Execution Checklist</h3>
        <ul className="mt-3 space-y-2">
          {context.instructions.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
