"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, FileText, Eye, Flag, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { MissionButton } from "@/components/ui/button";
import { useSubmissionsRound1, useSubmissionsRound2, useTeams } from "@/lib/firestore/hooks";
import type { SubmissionRound1, SubmissionRound2 } from "@/lib/supabase/models";

export function SubmissionsIntelCenter() {
  const router = useRouter();
  const { submissions: round1Submissions } = useSubmissionsRound1();
  const { submissions: round2Submissions } = useSubmissionsRound2();
  const { teams } = useTeams();
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [filterRound, setFilterRound] = useState<'all' | 'round1' | 'round2'>('all');

  const allSubmissions = useMemo(() => {
    type Team = (typeof teams)[number];
    const r1Subs = round1Submissions.map((sub: SubmissionRound1) => ({
      ...sub,
      round: 'round1' as const,
      score: sub.score,
      submittedAt: sub.submitted_at,
      teamName: teams.find((t: Team) => t.id === sub.team_id)?.name || `Team ${sub.team_id}`
    }));
    
    const r2Subs = round2Submissions.map((sub: SubmissionRound2) => ({
      ...sub,
      round: 'round2' as const,
      score: sub.total_score,
      submittedAt: sub.submitted_at,
      teamName: teams.find((t: Team) => t.id === sub.team_id)?.name || `Team ${sub.team_id}`
    }));

    return [...r1Subs, ...r2Subs].sort((a, b) => {
      const aTime = new Date(a.submittedAt).getTime();
      const bTime = new Date(b.submittedAt).getTime();
      return bTime - aTime;
    });
  }, [round1Submissions, round2Submissions, teams]);

  const filteredSubmissions = useMemo(() => {
    if (filterRound === 'all') return allSubmissions;
    return allSubmissions.filter(sub => sub.round === filterRound);
  }, [allSubmissions, filterRound]);

  const selectedSubmissionData = useMemo(() => {
    return filteredSubmissions.find(sub => sub.id === selectedSubmission);
  }, [filteredSubmissions, selectedSubmission]);

  const stats = useMemo(() => {
    const total = allSubmissions.length;
    const round1Count = round1Submissions.length;
    const round2Count = round2Submissions.length;
    const scored = allSubmissions.filter(sub => typeof sub.score === 'number').length;
    const pending = total - scored;

    return { total, round1Count, round2Count, scored, pending };
  }, [allSubmissions, round1Submissions.length, round2Submissions.length]);

  const formatDate = (date: any) => {
    if (!date) return 'Unknown';
    const d = date instanceof Date ? date : date.toDate?.() || new Date(date);
    return d.toLocaleString();
  };

  const handleFlagSubmission = (submissionId: string) => {
    if (confirm('Flag this submission for manual review?')) {
      console.log(`Flagging submission ${submissionId}`);
      // In real implementation, would call API
    }
  };

  const handleVerifySubmission = (submissionId: string) => {
    console.log(`Verifying submission ${submissionId}`);
    // In real implementation, would call API
  };

  return (
    <section className="space-y-8 text-white">
      {/* Header Section */}
      <div className="border border-[#FF6B00]/20 bg-transparent backdrop-blur-md p-8 rounded-3xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-[#FF6B00]">Data Analysis</p>
            <h2 className="mt-2 text-4xl font-bold text-white" style={{textShadow: "0 0 20px rgba(255, 107, 0, 0.5)"}}>Submissions Intel</h2>
            <p className="mt-3 max-w-3xl text-sm text-white/80">
              Monitor all contest submissions, review AI scoring results, and manage manual verification processes.
            </p>
          </div>
          <MissionButton variant="secondary" onClick={() => router.back()}>
            Return to Console
          </MissionButton>
        </header>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-5">
        <article className="border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl">
          <ClipboardList className="mb-4 h-10 w-10 text-[#FF6B00]" />
          <p className="text-xs uppercase tracking-[0.4em] text-[#FF6B00]/80">Total Submissions</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.total}</p>
        </article>
        
        <article className="border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl">
          <FileText className="mb-4 h-10 w-10 text-[#FF6B00]" />
          <p className="text-xs uppercase tracking-[0.4em] text-[#FF6B00]/80">Round 1</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.round1Count}</p>
        </article>
        
        <article className="border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl">
          <FileText className="mb-4 h-10 w-10 text-[#FF6B00]" />
          <p className="text-xs uppercase tracking-[0.4em] text-[#FF6B00]/80">Round 2</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.round2Count}</p>
        </article>
        
        <article className="border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl">
          <CheckCircle2 className="mb-4 h-10 w-10 text-[#FF6B00]" />
          <p className="text-xs uppercase tracking-[0.4em] text-[#FF6B00]/80">Scored</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.scored}</p>
        </article>
        
        <article className="border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl">
          <Clock className="mb-4 h-10 w-10 text-[#FF6B00]" />
          <p className="text-xs uppercase tracking-[0.4em] text-[#FF6B00]/80">Pending</p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.pending}</p>
        </article>
      </div>

      {/* Filter Controls */}
      <div className="border border-[#FF6B00]/20 bg-transparent backdrop-blur-md p-6 rounded-3xl">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-white">Filter by Round:</span>
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All Rounds' },
              { key: 'round1', label: 'Round 1' },
              { key: 'round2', label: 'Round 2' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterRound(key as any)}
                className={`px-4 py-2 rounded-xl text-xs transition-all ${
                  filterRound === key
                    ? 'bg-[#FF6B00] text-black font-bold'
                    : 'border border-[#FF6B00]/20 text-white hover:border-[#FF6B00]/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submissions List and Details */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Submissions List */}
        <div className="border border-[#FF6B00]/20 bg-transparent backdrop-blur-md p-8 rounded-3xl">
          <h3 className="text-2xl font-bold text-white mb-6" style={{textShadow: "0 0 15px rgba(255, 107, 0, 0.3)"}}>
            Submissions Feed ({filteredSubmissions.length})
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredSubmissions.map((submission) => (
              <article
                key={submission.id}
                className={`border p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                  selectedSubmission === submission.id
                    ? 'border-[#FF6B00]/60 bg-[#FF6B00]/10'
                    : 'border-[#FF6B00]/20 bg-black/20 hover:border-[#FF6B00]/40 hover:bg-black/40'
                }`}
                onClick={() => setSelectedSubmission(submission.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white">{submission.teamName}</h4>
                    <p className="text-xs text-white/60">
                      {submission.round === 'round1' ? 'Round 1' : 'Round 2'} • {formatDate(submission.submittedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#FF6B00]">
                      {typeof submission.score === 'number' ? `${submission.score.toFixed(1)}/10` : 'Pending'}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {typeof submission.score === 'number' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Submission Details */}
        <div className="border border-[#FF6B00]/20 bg-transparent backdrop-blur-md p-8 rounded-3xl">
          <h3 className="text-2xl font-bold text-white mb-6" style={{textShadow: "0 0 15px rgba(255, 107, 0, 0.3)"}}>Submission Details</h3>
          
          {selectedSubmissionData ? (
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-bold text-white">{selectedSubmissionData.teamName}</h4>
                <p className="text-sm text-white/70">
                  {selectedSubmissionData.round === 'round1' ? 'Round 1' : 'Round 2'} Submission
                </p>
                <p className="text-sm text-white/70">ID: {selectedSubmissionData.id}</p>
                <p className="text-sm text-white/70">Submitted: {formatDate(selectedSubmissionData.submittedAt)}</p>
              </div>

              <div>
                <h5 className="text-lg font-bold text-[#FF6B00] mb-3">Scoring</h5>
                <div className="border border-[#FF6B00]/20 bg-black/20 p-4 rounded-xl">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#FF6B00]/80">Final Score</p>
                  <p className="text-3xl font-bold text-white">
                    {typeof selectedSubmissionData.score === 'number' 
                      ? `${selectedSubmissionData.score.toFixed(1)}/10` 
                      : 'Pending AI Review'}
                  </p>
                </div>
              </div>

              {selectedSubmissionData.round === 'round1' && (selectedSubmissionData as any).feedback && (
                <div>
                  <h5 className="text-lg font-bold text-[#FF6B00] mb-3">AI Feedback</h5>
                  <div className="border border-[#FF6B00]/20 bg-black/20 p-4 rounded-xl">
                    <p className="text-sm text-white/80">{(selectedSubmissionData as any).feedback}</p>
                  </div>
                </div>
              )}

              {selectedSubmissionData.round === 'round2' && (selectedSubmissionData as any).bugResults && (
                <div>
                  <h5 className="text-lg font-bold text-[#FF6B00] mb-3">Bug Analysis</h5>
                  <div className="space-y-2">
                    {(selectedSubmissionData as any).bugResults.map((result: any, index: number) => (
                      <div key={index} className="border border-[#FF6B00]/20 bg-black/20 p-3 rounded-xl">
                        <p className="text-sm text-white">Bug {index + 1}: {result.score}/1 points</p>
                        <p className="text-xs text-white/60">{result.feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <MissionButton
                  variant="primary"
                  className="text-xs"
                  onClick={() => handleVerifySubmission(selectedSubmissionData.id)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Verify
                </MissionButton>
                <MissionButton
                  variant="danger"
                  className="text-xs"
                  onClick={() => handleFlagSubmission(selectedSubmissionData.id)}
                >
                  <Flag className="w-4 h-4 mr-1" />
                  Flag
                </MissionButton>
                <MissionButton
                  variant="secondary"
                  className="text-xs"
                  onClick={() => {}}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Full
                </MissionButton>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <ClipboardList className="mx-auto h-16 w-16 text-white/30 mb-4" />
              <p className="text-white/60">Select a submission to view detailed analysis</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}