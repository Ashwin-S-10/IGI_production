"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, LoaderCircle } from "lucide-react";
import { MissionButton } from "@/components/ui/button";
import type { AIJob } from "@/lib/supabase/models";
import {
  useAIJobs,
  useMissionTasks,
  useRounds,
  useSubmissionsRound1,
  useSubmissionsRound2,
  useTeams,
} from "@/lib/firestore/hooks";

const TASK_TEMPLATES: Record<string, { title: string; description: string; steps: string[] }> = {
  configure: {
    title: "Team Management",
    description: "Assign squads, edit roles, and coordinate roster changes while Firebase sync is offline.",
    steps: [
      "Select a squad from the roster list.",
      "Adjust squad membership to preview the impact.",
      "Commit the draft once the datastore link is live.",
    ],
  },
  "Team Management": {
    title: "Team Management",
    description: "Assign squads, edit roles, and coordinate roster changes while Firebase sync is offline.",
    steps: [
      "Select a squad from the roster list.",
      "Adjust squad membership to preview the impact.",
      "Commit the draft once the datastore link is live.",
    ],
  },
  "Submissions Intel": {
    title: "Submissions Intel",
    description: "Inspect submissions and review scoring data.",
    steps: [
      "Pick a recent submission from the activity feed.",
      "Open the detail drawer to review OCR text and rubric scores.",
      "Mark the submission as verified or flagged.",
    ],
  },
  "AI Scoring": {
    title: "AI Scoring",
    description: "Trigger simulated AI jobs to validate the control surface.",
    steps: [
      "Queue an OCR job for a selected team.",
      "Observe progress indicators.",
      "Confirm completion to archive the run.",
    ],
  },
  "Mission Passwords": {
    title: "Mission Passwords",
    description: "Generate and revoke round passwords.",
    steps: [
      "Select target round and squad.",
      "Generate a new password token.",
      "Distribute via secure channel.",
    ],
  },
  "round1:Upload Questions": {
    title: "Upload Round 1 Questions",
    description: "Preview how question packs will be uploaded once storage is connected.",
    steps: [
      "Compile question PDFs or image sets.",
      "Drop assets into the uploader sandbox.",
      "Trigger the storage job sample to confirm flow.",
    ],
  },
  "round1:Trigger OCR": {
    title: "Trigger OCR Pipeline",
    description: "Kick off OCR and AI scoring jobs for Round 1 submissions.",
    steps: [
      "Select the submission batch to process.",
      "Run the simulation to view progress events.",
      "Confirm completion to notify contestants.",
    ],
  },
  "round1:Generate Passwords": {
    title: "Generate Mission Passwords",
    description: "Preview the password generation flow for advancing squads.",
    steps: [
      "Select qualifying squads.",
      "Generate password tokens for distribution.",
      "Dispatch to squads securely.",
    ],
  },
  "round1:View Files": {
    title: "Round 1 Submission Files",
    description: "Preview storage viewer used to inspect uploaded artifacts.",
    steps: [
      "Load the sample file list.",
      "Open OCR results for spot checks.",
      "Mark as verified for contest history.",
    ],
  },
  "round2:Upload Dossiers": {
    title: "Upload Round 2 Dossiers",
    description: "Stage bug dossiers ready for contestant release.",
    steps: [
      "List each vulnerable snippet in markdown.",
      "Attach sample exploit walkthroughs.",
      "Schedule release once satisfied with the pack.",
    ],
  },
  "round2:Start Round": {
    title: "Start Round 2",
    description: "Simulate opening the Capture the Hostile phase.",
    steps: [
      "Confirm squads cleared for this round.",
      "Broadcast start signal.",
      "Monitor submissions for activity.",
    ],
  },
  "round2:Approve Scores": {
    title: "Approve Round 2 Scores",
    description: "Verify AI evaluations ahead of leaderboard publication.",
    steps: [
      "Review AI decision transcripts.",
      "Adjust points if necessary.",
      "Publish provisional scoreboard.",
    ],
  },
  "round3:Seed Bracket": {
    title: "Seed Round 3 Bracket",
    description: "Simulate bracket seeds and verify duel pairings.",
    steps: [
      "Rank squads by total score.",
      "Confirm automatic seeding preview.",
      "Lock bracket to notify contestants.",
    ],
  },
  "round3:Judge Pending Duels": {
    title: "Judge Pending Duels",
    description: "Launch Groq adjudication for round three duels awaiting verification.",
    steps: [
      "Open the judging console to review duel submissions.",
      "Optionally correct transcripts before judging.",
      "Trigger Groq to persist the verdict and advance the bracket.",
    ],
  },
  "round3:Start Matches": {
    title: "Start Round 3 Matches",
    description: "Launch duel timers and notify squads.",
    steps: [
      "Lock seed order.",
      "Start duel countdown.",
      "Monitor match logs for anomalies.",
    ],
  },
  "round3:Override Result": {
    title: "Override Duel Result",
    description: "Force a verdict when AI confidence is low.",
    steps: [
      "Select the duel to override.",
      "Document the manual decision.",
      "Notify both squads of the update.",
    ],
  },
  overrides: {
    title: "Emergency Override",
    description: "Trigger lockdown or override flows while backend sync is offline.",
    steps: [
      "Select the system to pause.",
      "Explain the reason for override.",
      "Confirm action to broadcast alerts.",
    ],
  },
  "Emergency Override": {
    title: "Emergency Override",
    description: "Trigger lockdown or override flows while backend sync is offline.",
    steps: [
      "Select the system to pause.",
      "Explain the reason for override.",
      "Confirm action to broadcast alerts.",
    ],
  },
  "Flag Suspicious Submission": {
    title: "Flag Suspicious Submission",
    description: "Mark a submission for extended review.",
    steps: [
      "Select the submission ID.",
      "Describe the suspicious behaviour.",
      "Escalate to mission auditors.",
    ],
  },
  "Override Winner": {
    title: "Override Winner",
    description: "Force-select a duel winner during testing.",
    steps: [
      "Choose the duel and teams involved.",
      "Provide rationale for the override.",
      "Commit the change to update the bracket.",
    ],
  },
  "Emergency Shutdown": {
    title: "Emergency Shutdown",
    description: "Simulate the full lockdown procedure.",
    steps: [
      "Pause all active rounds.",
      "Alert contestants to stand down.",
      "Record incident summary for command.",
    ],
  },
  exports: {
    title: "Schedule Export",
    description: "Simulate exporting evidence packs for mission command.",
    steps: [
      "Choose the export window.",
      "Select formats required (CSV, PDF, JSON).",
      "Kick off the export routine.",
    ],
  },
  "Schedule Export": {
    title: "Schedule Export",
    description: "Simulate exporting evidence packs for mission command.",
    steps: [
      "Choose the export window.",
      "Select formats required (CSV, PDF, JSON).",
      "Kick off the export routine.",
    ],
  },
  "Review AI": {
    title: "Review AI Decisions",
    description: "Walk through AI scoring rationales before finalising results.",
    steps: [
      "Select an AI job from the queue.",
      "Read through the reasoning transcript.",
      "Approve or request a re-run.",
    ],
  },
  "activity-logs": {
    title: "Activity Logs",
    description: "Inspect submission and system activity records.",
    steps: [
      "Filter logs by round or severity.",
      "Review captured entries.",
      "Archive to close the incident.",
    ],
  },
};

function normalizeTask(rawTask: string | null): keyof typeof TASK_TEMPLATES {
  if (!rawTask) return "configure";
  if (TASK_TEMPLATES[rawTask as keyof typeof TASK_TEMPLATES]) {
    return rawTask as keyof typeof TASK_TEMPLATES;
  }
  if (rawTask.startsWith("round")) {
    const [roundId, action] = rawTask.split(":");
    const key = `${roundId}:${action}` as keyof typeof TASK_TEMPLATES;
    if (TASK_TEMPLATES[key]) return key;
  }
  if (rawTask.includes("Override")) return "overrides";
  if (rawTask.includes("Export")) return "exports";
  return "configure";
}

export function ControlCenter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskParam = searchParams.get("task");
  const taskKey = normalizeTask(taskParam);
  const template = useMemo(() => TASK_TEMPLATES[taskKey], [taskKey]);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const { tasks, readOnly } = useMissionTasks();
  const [localTaskProgress, setLocalTaskProgress] = useState<Record<string, string[]>>({});
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [notesDraft, setNotesDraft] = useState<string>("");

  const missionTask = useMemo(() => tasks.find((task) => task.id === taskKey) ?? null, [taskKey, tasks]);

  const completedSteps = useMemo(() => {
    const baseline = missionTask?.completedSteps ?? [];
    if (readOnly) {
      const override = localTaskProgress[taskKey];
      if (override) {
        return override;
      }
    }
    return baseline;
  }, [localTaskProgress, missionTask, readOnly, taskKey]);

  const completedStepSet = useMemo(() => new Set(completedSteps), [completedSteps]);

  const pendingStepCount = useMemo(
    () => template.steps.filter((step) => !completedStepSet.has(step)).length,
    [completedStepSet, template.steps],
  );

  useEffect(() => {
    const baselineNotes = readOnly ? localNotes[taskKey] ?? missionTask?.notes ?? "" : missionTask?.notes ?? "";
    setNotesDraft(baselineNotes);
  }, [localNotes, missionTask?.notes, readOnly, taskKey]);

  const { teams } = useTeams();
  const { rounds } = useRounds();
  const { submissions: submissionsRound1 } = useSubmissionsRound1();
  const { submissions: submissionsRound2 } = useSubmissionsRound2();
  const { jobs } = useAIJobs();
  type Round = (typeof rounds)[number];
  const runningJobs = useMemo(() => jobs.filter((job: AIJob) => job.status === "running").length, [jobs]);
  const activeRound = useMemo(() => rounds.find((round: Round) => round.status === "active")?.name ?? "Pending", [rounds]);
  const metrics = useMemo(
    () => [
      { label: "Active Round", value: activeRound },
      { label: "Registered Squads", value: teams.length.toString() },
      { label: "Round 1 Submissions", value: submissionsRound1.length.toString() },
      { label: "Round 2 Submissions", value: submissionsRound2.length.toString() },
      { label: "AI Jobs Running", value: runningJobs.toString() },
      { label: "Task Steps Pending", value: pendingStepCount.toString() },
      { label: "Task Sync", value: readOnly ? "Local" : "Firestore" },
    ],
    [activeRound, pendingStepCount, readOnly, runningJobs, submissionsRound1.length, submissionsRound2.length, teams.length],
  );

  const handleToggleStep = useCallback(
    async (step: string) => {
      const isCompleted = completedStepSet.has(step);
      const nextCompleted = !isCompleted;

      if (readOnly) {
        setLocalTaskProgress((prev) => {
          const baseline = prev[taskKey] ?? (missionTask?.completedSteps ?? []);
          const nextSet = new Set(baseline);
          if (nextCompleted) {
            nextSet.add(step);
          } else {
            nextSet.delete(step);
          }
          return {
            ...prev,
            [taskKey]: Array.from(nextSet),
          };
        });
        setStatus("done");
        setTimeout(() => setStatus("idle"), 1500);
        return;
      }

      setStatus("running");
      try {
        const response = await fetch("/api/mission/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId: taskKey, step, completed: nextCompleted }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({ error: "Failed to update task." }));
          throw new Error(body.error ?? "Failed to update task.");
        }
        setStatus("done");
        setTimeout(() => setStatus("idle"), 2000);
      } catch (error) {
        console.error("[Mission Tasks] toggle failed", error);
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    },
    [completedStepSet, missionTask?.completedSteps, readOnly, taskKey],
  );

  const handleCompleteTask = useCallback(async () => {
    const remainingSteps = template.steps.filter((step) => !completedStepSet.has(step));

    if (readOnly) {
      setLocalTaskProgress((prev) => ({
        ...prev,
        [taskKey]: template.steps,
      }));
      setStatus("done");
      setTimeout(() => setStatus("idle"), 1500);
      return;
    }

    if (remainingSteps.length === 0) {
      setStatus("done");
      setTimeout(() => setStatus("idle"), 1500);
      return;
    }

    setStatus("running");
    try {
      for (const step of remainingSteps) {
        const response = await fetch("/api/mission/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId: taskKey, step, completed: true }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({ error: "Failed to update task." }));
          throw new Error(body.error ?? "Failed to update task.");
        }
      }
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      console.error("[Mission Tasks] complete failed", error);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [completedStepSet, readOnly, taskKey, template.steps]);

  const handleNotesBlur = useCallback(async () => {
    if (readOnly) {
      setLocalNotes((prev) => ({
        ...prev,
        [taskKey]: notesDraft,
      }));
      setStatus("done");
      setTimeout(() => setStatus("idle"), 1500);
      return;
    }

    if ((missionTask?.notes ?? "") === notesDraft) {
      return;
    }

    setStatus("running");
    try {
      const response = await fetch("/api/mission/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: taskKey, notes: notesDraft }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Failed to save notes." }));
        throw new Error(body.error ?? "Failed to save notes.");
      }
      setStatus("done");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      console.error("[Mission Tasks] notes failed", error);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [missionTask?.notes, notesDraft, readOnly, taskKey]);

  return (
    <section className="space-y-8 text-white">
      {/* Header Section */}
      <div className="glass-panel p-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-accent">Mission Admin</p>
            <h2 className="mt-2 text-2xl font-semibold">{template.title}</h2>
            <p className="mt-2 max-w-3xl text-sm text-white/70">{template.description}</p>
          </div>
          <MissionButton variant="secondary" onClick={() => router.back()}>
            Return to Console
          </MissionButton>
        </header>
      </div>

      {/* Metrics Grid - Improved Layout */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
        {metrics.map((metric, index) => (
          <article 
            key={metric.label} 
            className="glass-panel p-4 text-sm hover:border-accent/40 transition-all duration-300 hover:scale-105"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">{metric.label}</p>
            <p className="mt-2 text-2xl font-bold text-accent">{metric.value}</p>
          </article>
        ))}
      </div>

      {/* Checklist Section */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Mission Checklist</h3>
          {readOnly && (
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-300 bg-amber-300/10 px-3 py-1 rounded-full">
              Offline Mode — Local Storage
            </p>
          )}
        </div>
        <ul className="space-y-3">
          {template.steps.map((step, index) => {
            const isCompleted = completedStepSet.has(step);
            return (
              <li key={step}>
                <label
                  className={`flex items-center gap-3 rounded-xl border p-4 text-sm transition cursor-pointer ${
                    isCompleted 
                      ? "border-emerald-400/40 bg-emerald-500/10 hover:bg-emerald-500/20" 
                      : "border-white/10 bg-black/40 hover:border-accent/40 hover:bg-accent/5"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-accent cursor-pointer"
                    checked={isCompleted}
                    onChange={() => handleToggleStep(step)}
                    disabled={!readOnly && status === "running"}
                  />
                  <span className={`flex-1 ${isCompleted ? "text-emerald-100 line-through" : "text-white/80"}`}>
                    {step}
                  </span>
                  {isCompleted && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="glass-panel p-6 space-y-4">
        <label className="text-xs uppercase tracking-[0.4em] text-accent font-semibold">Mission Notes</label>
        <textarea
          className="mt-3 h-40 w-full rounded-xl border border-white/10 bg-black/60 p-4 text-sm text-white focus:border-accent/40 focus:ring-2 focus:ring-accent/20 transition"
          placeholder="Document actions taken while completing this task..."
          value={notesDraft}
          onChange={(event) => setNotesDraft(event.target.value)}
          onBlur={handleNotesBlur}
          disabled={!readOnly && status === "running"}
        />
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em]">
            {status === "idle" && (
              <span className="flex items-center gap-2 text-white/50">
                <AlertTriangle className="h-4 w-4" /> Awaiting action
              </span>
            )}
            {status === "running" && (
              <span className="flex items-center gap-2 text-blue-400">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Saving…
              </span>
            )}
            {status === "done" && (
              <span className="flex items-center gap-2 text-accent">
                <CheckCircle2 className="h-4 w-4" /> Completed
              </span>
            )}
            {status === "error" && (
              <span className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="h-4 w-4" /> Sync failed
              </span>
            )}
          </div>
          <MissionButton 
            loading={status === "running"} 
            onClick={handleCompleteTask}
            className="min-w-[180px]"
          >
            Mark All Complete
          </MissionButton>
        </div>
      </div>
    </section>
  );
}
