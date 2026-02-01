"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Activity, Brain, Play, Pause, RotateCcw, CheckCircle2, Clock, AlertTriangle, Zap } from "lucide-react";
import { MissionButton } from "@/components/ui/button";
import { useAIJobs, useSubmissionsRound1, useSubmissionsRound2 } from "@/lib/firestore/hooks";
import type { AIJob, SubmissionRound1, SubmissionRound2 } from "@/lib/supabase/models";

export function AIScoringCenter() {
  const router = useRouter();
  const { jobs } = useAIJobs();
  const { submissions: round1Submissions } = useSubmissionsRound1();
  const { submissions: round2Submissions } = useSubmissionsRound2();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);

  const jobStats = useMemo(() => {
    const total = jobs.length;
    const running = jobs.filter((job: AIJob) => job.status === 'running').length;
    const completed = jobs.filter((job: AIJob) => job.status === 'completed').length;
    const failed = jobs.filter((job: AIJob) => job.status === 'failed').length;
    const pending = jobs.filter((job: AIJob) => job.status === 'pending').length;

    return { total, running, completed, failed, pending };
  }, [jobs]);

  const scoringStats = useMemo(() => {
    const totalSubmissions = round1Submissions.length + round2Submissions.length;
    const scoredR1 = round1Submissions.filter((sub: SubmissionRound1) => typeof sub.score === 'number').length;
    const scoredR2 = round2Submissions.filter((sub: SubmissionRound2) => typeof sub.total_score === 'number').length;
    const totalScored = scoredR1 + scoredR2;
    const pendingScoring = totalSubmissions - totalScored;

    return { totalSubmissions, totalScored, pendingScoring, scoredR1, scoredR2 };
  }, [round1Submissions, round2Submissions]);

  const selectedJobData = useMemo(() => {
    return jobs.find((job: AIJob) => job.id === selectedJob);
  }, [jobs, selectedJob]);

  const handleTriggerAI = async (type: 'round1' | 'round2' | 'batch') => {
    setIsTriggering(true);
    try {
      // Simulate AI job trigger
      console.log(`Triggering AI scoring for ${type}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`AI scoring job for ${type} has been queued successfully!`);
    } catch (error) {
      console.error('Failed to trigger AI scoring:', error);
      alert('Failed to trigger AI scoring. Please try again.');
    } finally {
      setIsTriggering(false);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    console.log(`Retrying job ${jobId}`);
    // In real implementation, would call API to retry job
  };

  const handleCancelJob = async (jobId: string) => {
    if (confirm('Cancel this AI scoring job?')) {
      console.log(`Cancelling job ${jobId}`);
      // In real implementation, would call API to cancel job
    }
  };

  const formatDate = (date: Date | string | { toDate?: () => Date } | null | undefined) => {
    if (!date) return 'Unknown';
    if (date instanceof Date) return date.toLocaleString();
    if (typeof date === 'string') return new Date(date).toLocaleString();
    if (typeof date === 'object' && date.toDate) return date.toDate().toLocaleString();
    return new Date().toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Clock className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <section className="space-y-8 text-white">
      {/* Header Section */}
      <div className="border border-[#FF6B00]/20 bg-transparent backdrop-blur-md p-8 rounded-3xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.5em] text-[#FF6B00]">Automated Evaluation</p>
            <h2 className="mt-2 text-4xl font-bold text-white" style={{textShadow: "0 0 20px rgba(255, 107, 0, 0.5)"}}>AI Scoring System</h2>
            <p className="mt-3 max-w-3xl text-sm text-white/80">
              Monitor and control AI-powered scoring jobs, manage evaluation queues, and review automated assessment results.
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
          <Activity className="mb-4 h-10 w-10 text-[#FF6B00]" />
          <p className="text-xs uppercase tracking-[0.4em] text-[#FF6B00]/80">Total Jobs</p>
          <p className="mt-2 text-3xl font-bold text-white">{jobStats.total}</p>
        </article>
        
        <article className="border border-blue-500/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl">
          <Clock className="mb-4 h-10 w-10 text-blue-400" />
          <p className="text-xs uppercase tracking-[0.4em] text-blue-400/80">Running</p>
          <p className="mt-2 text-3xl font-bold text-white">{jobStats.running}</p>
        </article>
        
        <article className="border border-green-500/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl">
          <CheckCircle2 className="mb-4 h-10 w-10 text-green-400" />
          <p className="text-xs uppercase tracking-[0.4em] text-green-400/80">Completed</p>
          <p className="mt-2 text-3xl font-bold text-white">{jobStats.completed}</p>
        </article>
        
        <article className="border border-red-500/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl">
          <AlertTriangle className="mb-4 h-10 w-10 text-red-400" />
          <p className="text-xs uppercase tracking-[0.4em] text-red-400/80">Failed</p>
          <p className="mt-2 text-3xl font-bold text-white">{jobStats.failed}</p>
        </article>
        
        <article className="border border-yellow-500/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl">
          <Clock className="mb-4 h-10 w-10 text-yellow-400" />
          <p className="text-xs uppercase tracking-[0.4em] text-yellow-400/80">Pending</p>
          <p className="mt-2 text-3xl font-bold text-white">{jobStats.pending}</p>
        </article>
      </div>

      {/* AI Control Panel */}
      <div className="border border-[#FF6B00]/20 bg-transparent backdrop-blur-md p-8 rounded-3xl">
        <h3 className="text-2xl font-bold text-white mb-6" style={{textShadow: "0 0 15px rgba(255, 107, 0, 0.3)"}}>AI Control Panel</h3>
        
        <div className="grid gap-6 md:grid-cols-3">
          <article className="border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl">
            <Brain className="mb-4 h-10 w-10 text-[#FF6B00]" />
            <h4 className="text-lg font-bold text-white mb-2">Round 1 Scoring</h4>
            <p className="text-sm text-white/70 mb-4">
              Trigger AI evaluation for algorithm submissions. Analyzes logic, completeness, and clarity.
            </p>
            <div className="mb-4">
              <p className="text-xs text-white/60">Scored: {scoringStats.scoredR1}/{round1Submissions.length}</p>
            </div>
            <MissionButton
              variant="primary"
              className="w-full text-xs"
              disabled={isTriggering}
              onClick={() => handleTriggerAI('round1')}
            >
              <Zap className="w-4 h-4 mr-1" />
              {isTriggering ? 'Triggering...' : 'Trigger Round 1 AI'}
            </MissionButton>
          </article>

          <article className="border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl">
            <Brain className="mb-4 h-10 w-10 text-[#FF6B00]" />
            <h4 className="text-lg font-bold text-white mb-2">Round 2 Scoring</h4>
            <p className="text-sm text-white/70 mb-4">
              Evaluate bug identification submissions. Checks accuracy and line-by-line analysis.
            </p>
            <div className="mb-4">
              <p className="text-xs text-white/60">Scored: {scoringStats.scoredR2}/{round2Submissions.length}</p>
            </div>
            <MissionButton
              variant="primary"
              className="w-full text-xs"
              disabled={isTriggering}
              onClick={() => handleTriggerAI('round2')}
            >
              <Zap className="w-4 h-4 mr-1" />
              {isTriggering ? 'Triggering...' : 'Trigger Round 2 AI'}
            </MissionButton>
          </article>

          <article className="border border-[#FF6B00]/20 bg-black/20 backdrop-blur-sm p-6 rounded-2xl">
            <Activity className="mb-4 h-10 w-10 text-[#FF6B00]" />
            <h4 className="text-lg font-bold text-white mb-2">Batch Processing</h4>
            <p className="text-sm text-white/70 mb-4">
              Process all pending submissions across all rounds in a single batch operation.
            </p>
            <div className="mb-4">
              <p className="text-xs text-white/60">Pending: {scoringStats.pendingScoring} submissions</p>
            </div>
            <MissionButton
              variant="primary"
              className="w-full text-xs"
              disabled={isTriggering || scoringStats.pendingScoring === 0}
              onClick={() => handleTriggerAI('batch')}
            >
              <Play className="w-4 h-4 mr-1" />
              {isTriggering ? 'Processing...' : 'Process All Pending'}
            </MissionButton>
          </article>
        </div>
      </div>

      {/* Job Queue and Details */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Job Queue */}
        <div className="border border-[#FF6B00]/20 bg-transparent backdrop-blur-md p-8 rounded-3xl">
          <h3 className="text-2xl font-bold text-white mb-6" style={{textShadow: "0 0 15px rgba(255, 107, 0, 0.3)"}}>
            Job Queue ({jobs.length})
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {jobs.map((job: AIJob) => (
              <article
                key={job.id}
                className={`border p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                  selectedJob === job.id
                    ? 'border-[#FF6B00]/60 bg-[#FF6B00]/10'
                    : 'border-[#FF6B00]/20 bg-black/20 hover:border-[#FF6B00]/40 hover:bg-black/40'
                }`}
                onClick={() => setSelectedJob(job.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white">{job.type || 'AI Scoring Job'}</h4>
                    <p className="text-xs text-white/60">
                      {job.round || 'Unknown Round'} • {formatDate(job.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(job.status)}
                      <span className="text-sm font-bold text-white capitalize">{job.status}</span>
                    </div>
                    <p className="text-xs text-white/60">
                      {job.progress ? `${job.progress}%` : 'Queued'}
                    </p>
                  </div>
                </div>
              </article>
            ))}
            {jobs.length === 0 && (
              <div className="text-center py-8">
                <Activity className="mx-auto h-12 w-12 text-white/30 mb-3" />
                <p className="text-white/60">No AI jobs in queue</p>
              </div>
            )}
          </div>
        </div>

        {/* Job Details */}
        <div className="border border-[#FF6B00]/20 bg-transparent backdrop-blur-md p-8 rounded-3xl">
          <h3 className="text-2xl font-bold text-white mb-6" style={{textShadow: "0 0 15px rgba(255, 107, 0, 0.3)"}}>Job Details</h3>
          
          {selectedJobData ? (
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-bold text-white">{selectedJobData.type || 'AI Scoring Job'}</h4>
                <p className="text-sm text-white/70">Job ID: {selectedJobData.id}</p>
                <p className="text-sm text-white/70">Round: {selectedJobData.round || 'Unknown'}</p>
                <p className="text-sm text-white/70">Created: {formatDate(selectedJobData.created_at)}</p>
              </div>

              <div>
                <h5 className="text-lg font-bold text-[#FF6B00] mb-3">Status</h5>
                <div className="border border-[#FF6B00]/20 bg-black/20 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(selectedJobData.status)}
                    <span className="text-lg font-bold text-white capitalize">{selectedJobData.status}</span>
                  </div>
                  {selectedJobData.progress && (
                    <div className="w-full bg-black/40 rounded-full h-2 mb-2">
                      <div 
                        className="bg-[#FF6B00] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${selectedJobData.progress}%` }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-white/60">
                    {selectedJobData.progress ? `${selectedJobData.progress}% complete` : 'Waiting in queue'}
                  </p>
                </div>
              </div>

              {selectedJobData.error && (
                <div>
                  <h5 className="text-lg font-bold text-red-400 mb-3">Error Details</h5>
                  <div className="border border-red-500/20 bg-red-500/10 p-4 rounded-xl">
                    <p className="text-sm text-red-200">{selectedJobData.error}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {selectedJobData.status === 'running' && (
                  <MissionButton
                    variant="danger"
                    className="text-xs"
                    onClick={() => handleCancelJob(selectedJobData.id)}
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Cancel Job
                  </MissionButton>
                )}
                {selectedJobData.status === 'failed' && (
                  <MissionButton
                    variant="primary"
                    className="text-xs"
                    onClick={() => handleRetryJob(selectedJobData.id)}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Retry Job
                  </MissionButton>
                )}
                <MissionButton
                  variant="secondary"
                  className="text-xs"
                  onClick={() => {}}
                >
                  View Logs
                </MissionButton>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Brain className="mx-auto h-16 w-16 text-white/30 mb-4" />
              <p className="text-white/60">Select a job from the queue to view details</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}