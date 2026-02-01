"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, CheckCircle, Clock } from "lucide-react";
import { MissionButton } from "@/components/ui/button";

interface Evaluation {
  queue_id: string;
  team_id: string;
  round: string;
  question_id: string;
  raw_answer: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  score: number | null;
  feedback: string | null;
  submission_time: string;
  teams: {
    team_name: string;
    player1_name: string;
    player2_name: string;
  };
}

interface TeamProgress {
  team_id: string;
  team_name: string;
  total_evaluations: number;
  completed_evaluations: number;
  pending_evaluations: number;
  total_score: number;
}

export function AdminEvaluationPanel() {
  const [round, setRound] = useState<'round1' | 'round2'>('round1');
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [finalizingTeam, setFinalizingTeam] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingScores, setEditingScores] = useState<Record<string, number>>({});
  const [editingFeedback, setEditingFeedback] = useState<Record<string, string>>({});

  // Fetch evaluations
  const fetchEvaluations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('round', round);
      if (selectedTeam !== 'all') {
        params.append('team_id', selectedTeam);
      }
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/contest/admin/evaluations?${params.toString()}`);
      
      if (!response.ok) {
        const text = await response.text();
        console.error('[AdminEvaluation] Backend error:', response.status, text);
        throw new Error(`Backend returned ${response.status}: ${text.substring(0, 100)}`);
      }
      
      const data = await response.json();
      
      if (data.evaluations) {
        setEvaluations(data.evaluations);
      }
    } catch (error) {
      console.error('[AdminEvaluation] Failed to fetch evaluations:', error);
      alert('Failed to connect to backend. Make sure the backend server is running on http://localhost:4000');
    } finally {
      setLoading(false);
    }
  }, [round, selectedTeam, selectedStatus]);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  // Calculate team progress
  const teamProgress = useCallback((): TeamProgress[] => {
    const teams = new Map<string, TeamProgress>();
    
    evaluations.forEach(evaluation => {
      if (!teams.has(evaluation.team_id)) {
        teams.set(evaluation.team_id, {
          team_id: evaluation.team_id,
          team_name: evaluation.teams.team_name,
          total_evaluations: 0,
          completed_evaluations: 0,
          pending_evaluations: 0,
          total_score: 0
        });
      }
      
      const team = teams.get(evaluation.team_id)!;
      team.total_evaluations++;
      
      if (evaluation.status === 'completed') {
        team.completed_evaluations++;
        team.total_score += evaluation.score || 0;
      } else if (evaluation.status === 'pending') {
        team.pending_evaluations++;
      }
    });
    
    return Array.from(teams.values()).sort((a, b) => 
      a.team_name.localeCompare(b.team_name)
    );
  }, [evaluations]);

  // Save individual score
  const handleSaveScore = useCallback(async (queueId: string) => {
    const score = editingScores[queueId];
    const feedback = editingFeedback[queueId] || '';
    
    if (score === undefined || score === null || isNaN(score)) {
      alert('Please enter a valid score before saving');
      return;
    }
    
    if (score < 0 || score > 10) {
      alert('Score must be between 0 and 10');
      return;
    }
    
    setSavingId(queueId);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/contest/admin/evaluations/${queueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, feedback })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setEvaluations(prev => prev.map(e => 
          e.queue_id === queueId 
            ? { ...e, score, feedback, status: 'completed' as const }
            : e
        ));
        
        // Clear editing state
        setEditingScores(prev => {
          const updated = { ...prev };
          delete updated[queueId];
          return updated;
        });
        setEditingFeedback(prev => {
          const updated = { ...prev };
          delete updated[queueId];
          return updated;
        });
      } else {
        alert(`Failed to save score: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[AdminEvaluation] Failed to save score:', error);
      alert('Failed to save score. Please try again.');
    } finally {
      setSavingId(null);
    }
  }, [editingScores, editingFeedback]);

  // Finalize team score
  const handleFinalizeTeam = useCallback(async (teamId: string) => {
    const team = teamProgress().find(t => t.team_id === teamId);
    
    if (!team) return;
    
    if (team.completed_evaluations !== 10) {
      alert(`Only ${team.completed_evaluations}/10 questions are evaluated. Complete all evaluations before finalizing.`);
      return;
    }
    
    const confirmed = window.confirm(
      `Finalize ${team.team_name}'s ${round} score?\n\nTotal Score: ${team.total_score}/100\n\nThis will update the team's score in the leaderboard.`
    );
    
    if (!confirmed) return;
    
    setFinalizingTeam(teamId);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/contest/admin/teams/${teamId}/round/${round}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`${team.team_name}'s ${round} score has been finalized: ${data.total_score}/100`);
        fetchEvaluations(); // Refresh data
      } else {
        alert(`Failed to finalize score: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[AdminEvaluation] Failed to finalize team:', error);
      alert('Failed to finalize team score. Please try again.');
    } finally {
      setFinalizingTeam(null);
    }
  }, [round, teamProgress, fetchEvaluations]);

  // Get unique teams for filter dropdown
  const uniqueTeams = Array.from(
    new Set(evaluations.map(e => e.team_id))
  ).map(teamId => {
    const evaluation = evaluations.find(e => e.team_id === teamId);
    return { team_id: teamId, team_name: evaluation?.teams.team_name || teamId };
  }).sort((a, b) => a.team_name.localeCompare(b.team_name));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={fetchEvaluations}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF6B00]/20 hover:bg-[#FF6B00]/30 border border-[#FF6B00]/50 rounded-lg text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-black/50 border border-[#FF6B00]/30 rounded-lg p-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Round</label>
          <select
            value={round}
            onChange={(e) => setRound(e.target.value as 'round1' | 'round2')}
            className="px-3 py-2 bg-black border border-[#FF6B00]/30 rounded text-white focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="round1">Round 1</option>
            <option value="round2">Round 2</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Team</label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-3 py-2 bg-black border border-[#FF6B00]/30 rounded text-white focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">All Teams</option>
            {uniqueTeams.map(team => (
              <option key={team.team_id} value={team.team_id}>{team.team_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-black border border-[#FF6B00]/30 rounded text-white focus:outline-none focus:border-[#FF6B00]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="ml-auto text-sm text-gray-400">
          Total: {evaluations.length} submissions
        </div>
      </div>

      {/* Team Progress Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {teamProgress().map(team => (
          <div
            key={team.team_id}
            className="bg-black/50 border border-[#FF6B00]/30 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-white">{team.team_name}</h3>
                <div className="text-sm text-gray-400 mt-1">
                  Evaluated: {team.completed_evaluations}/10 
                  {team.pending_evaluations > 0 && (
                    <span className="text-yellow-400 ml-2">
                      ({team.pending_evaluations} pending)
                    </span>
                  )}
                </div>
              </div>
              {team.completed_evaluations === 10 ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <Clock className="h-5 w-5 text-yellow-400" />
              )}
            </div>
            
            <div className="text-2xl font-bold text-[#FF6B00] mb-3">
              {team.total_score}/100
            </div>
            
            <MissionButton
              onClick={() => handleFinalizeTeam(team.team_id)}
              disabled={team.completed_evaluations !== 10 || finalizingTeam === team.team_id}
              className="w-full"
            >
              {finalizingTeam === team.team_id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Finalizing...
                </>
              ) : (
                'Update Score'
              )}
            </MissionButton>
          </div>
        ))}
      </div>

      {/* Evaluations List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
        </div>
      ) : evaluations.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No evaluations found for the selected filters.
        </div>
      ) : (
        <div className="space-y-4">
          {evaluations.map(evaluation => {
            const isEditing = editingScores[evaluation.queue_id] !== undefined;
            const currentScore = isEditing ? editingScores[evaluation.queue_id] : evaluation.score;
            const currentFeedback = isEditing ? editingFeedback[evaluation.queue_id] : evaluation.feedback;
            
            return (
              <div
                key={evaluation.queue_id}
                className={`bg-black/50 border rounded-lg p-4 ${
                  evaluation.status === 'completed' 
                    ? 'border-green-500/30' 
                    : 'border-yellow-500/30'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-white">
                      {evaluation.teams.team_name} - Question {evaluation.question_id}
                    </h4>
                    <div className="text-sm text-gray-400 mt-1">
                      Players: {evaluation.teams.player1_name}, {evaluation.teams.player2_name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Submitted: {new Date(evaluation.submission_time).toLocaleString()}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm ${
                    evaluation.status === 'completed'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                  }`}>
                    {evaluation.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </div>

                {/* Answer */}
                <div className="mb-3">
                  <label className="block text-sm text-gray-400 mb-1">Answer:</label>
                  <div className="bg-black border border-[#FF6B00]/30 rounded p-3 text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {evaluation.raw_answer}
                  </div>
                </div>

                {/* Score Input */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Score (0-10):</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={currentScore ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const numVal = val === '' ? null : parseFloat(val);
                        setEditingScores(prev => ({
                          ...prev,
                          [evaluation.queue_id]: numVal
                        }));
                      }}
                      disabled={savingId === evaluation.queue_id}
                      className="w-full px-3 py-2 bg-black border border-[#FF6B00]/30 rounded text-white focus:outline-none focus:border-[#FF6B00] disabled:opacity-50"
                      placeholder="0-10"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-400 mb-1">Feedback (optional):</label>
                    <textarea
                      value={currentFeedback ?? ''}
                      onChange={(e) => setEditingFeedback(prev => ({
                        ...prev,
                        [evaluation.queue_id]: e.target.value
                      }))}
                      disabled={savingId === evaluation.queue_id}
                      className="w-full px-3 py-2 bg-black border border-[#FF6B00]/30 rounded text-white focus:outline-none focus:border-[#FF6B00] disabled:opacity-50"
                      placeholder="Optional feedback for the team"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-3 flex justify-end">
                  <MissionButton
                    onClick={() => handleSaveScore(evaluation.queue_id)}
                    disabled={savingId === evaluation.queue_id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {savingId === evaluation.queue_id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Score'
                    )}
                  </MissionButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
