"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { MissionButton } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { contestApi } from "@/lib/api-client";
import { supabase } from "@/lib/supabase/client";

interface Question {
  question_id: number;
  title: string;
  question_text: string;
}

interface QuestionScore {
  score: number | null;
  answer: string;
  status: 'pending' | 'completed';
  submittedAt: string;
}

type Round1WorkspaceProps = {
  roundId: string;
};

const STORAGE_KEY = 'round1_scores';
const STORAGE_ANSWERS_KEY = 'round1_answers';

export function Round1Workspace({ roundId }: Round1WorkspaceProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [scores, setScores] = useState<Record<number, QuestionScore>>({});
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [finalSubmitting, setFinalSubmitting] = useState(false);
  const [isRoundLocked, setIsRoundLocked] = useState(false);
  const [teamData, setTeamData] = useState<any>(null);

  // Load questions and check if round is locked
  useEffect(() => {
    const loadData = async () => {
      try {
        // CRITICAL: Check if round is already completed
        if (user?.teamId) {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/contest/teams/${user.teamId}`);
            if (response.ok) {
              const data = await response.json();
              const teamInfo = data.team || data.data;
              setTeamData(teamInfo);
              
              if (teamInfo?.r1_submission_time) {

                setIsRoundLocked(true);
                alert('Round 1 has already been submitted and is locked.');
                router.push('/mission');
                return;
              }
            }
          } catch (error) {
            console.error('[Round1] Failed to check round status:', error);
          }
        }
        
        // Fetch questions from backend
        const response = await contestApi.getRound1Questions();
        setQuestions(response.questions);
        
        // Load stored scores and answers from localStorage
        const storedScores = localStorage.getItem(STORAGE_KEY);
        const storedAnswers = localStorage.getItem(STORAGE_ANSWERS_KEY);
        
        if (storedScores) {
          setScores(JSON.parse(storedScores));
        }
        if (storedAnswers) {
          setAnswers(JSON.parse(storedAnswers));
        }

        // Fetch evaluations from backend to get latest scores
        if (user?.teamId) {
          try {
            const evalResponse = await contestApi.getTeamEvaluations(user.teamId, 'round1');
            const evaluationMap: Record<number, QuestionScore> = {};
            
            evalResponse.evaluations.forEach(evaluation => {
              const questionId = parseInt(evaluation.question_id);
              evaluationMap[questionId] = {
                score: evaluation.score,
                answer: storedAnswers ? JSON.parse(storedAnswers)[questionId] || '' : '',
                status: evaluation.status as 'pending' | 'completed',
                submittedAt: evaluation.submission_time
              };
            });
            
            // Merge with stored scores, preferring backend data
            setScores(prev => ({ ...prev, ...evaluationMap }));
          } catch (error) {
            console.error('[Round1] Failed to fetch evaluations:', error);
          }
        }
      } catch (error) {
        console.error('[Round1] Failed to load questions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time changes on the teams table
    const teamId = user?.teamId;
    if (!teamId) return;

    const channel = supabase
      .channel(`team-round1-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'teams',
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          setTeamData(payload.new);
          
          // If r1_submission_time is set, lock the round
          if (payload.new?.r1_submission_time) {
            setIsRoundLocked(true);
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.teamId]);

  // Save answers to localStorage
  const saveAnswer = useCallback((questionId: number, answer: string) => {
    setAnswers(prev => {
      const updated = { ...prev, [questionId]: answer };
      localStorage.setItem(STORAGE_ANSWERS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Submit answer for scoring
  const handleSubmitAnswer = useCallback(async (questionId: number) => {
    const answer = answers[questionId];
    if (!answer || !answer.trim()) {
      alert('Please enter an answer before submitting');
      return;
    }

    const question = questions.find(q => q.question_id === questionId);
    if (!question) {
      alert('Question not found');
      return;
    }

    setSubmitting(questionId);
    
    try {
      // Submit to backend for manual admin evaluation
      const response = await contestApi.evaluateRound1Answer(
        user?.teamId || 'unknown',
        questionId,
        answer
      );
      
      const timestamp = new Date().toISOString();
      
      // Store submission with pending status in state and localStorage
      const newScore: QuestionScore = {
        score: null,
        answer: answer,
        status: 'pending',
        submittedAt: timestamp
      };
      
      setScores(prev => {
        const updated = { ...prev, [questionId]: newScore };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      
    } catch (error) {
      console.error('[Round1] Submit error:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(null);
    }
  }, [answers, questions, user]);

  // Final submission after all questions
  const handleFinalSubmit = useCallback(async () => {
    const answeredCount = Object.keys(scores).length;
    
    if (answeredCount < questions.length) {
      const confirm = window.confirm(
        `You have only answered ${answeredCount} out of ${questions.length} questions. Submit anyway?`
      );
      if (!confirm) return;
    }

    setFinalSubmitting(true);

    try {
      const timestamp = new Date().toISOString();
      
      await contestApi.submitRound1({
        team_id: user?.teamId || 'unknown',
        submitted_at: timestamp
      });

      alert(`Round 1 submitted successfully! Awaiting admin evaluation.`);
      
      // Clear localStorage
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_ANSWERS_KEY);
      
      router.push('/mission');
      
    } catch (error) {
      console.error('[Round1] Final submit error:', error);
      alert('Failed to submit final round. Please try again.');
    } finally {
      setFinalSubmitting(false);
    }
  }, [scores, questions.length, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  const answeredCount = Object.keys(scores).length;

  return (
    <div className="relative min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-[#FF6B00]/20 bg-black/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/landing')}
              className="flex items-center gap-2 text-[#FF6B00] hover:text-white hover:bg-[#FF6B00]/20 px-4 py-2 rounded-lg border border-[#FF6B00]/30 hover:border-[#FF6B00] transition-all duration-300"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm uppercase tracking-wider font-semibold">Back to Mission</span>
            </button>
            
            <div className="text-right">
              <div className="text-sm text-gray-400">Progress</div>
              <div className="text-lg font-bold text-[#FF6B00]">
                {answeredCount}/{questions.length} Submitted
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#FF6B00] mb-2">
            Round 1 — Algorithm Challenge
          </h1>
          <p className="text-xl text-yellow-400 italic mb-4">
            "Write your solutions clearly. Show your logic. The admin will review your answers."
          </p>
          <p className="text-gray-400">
            Answer each question and submit for manual admin evaluation. Each question is worth 0-10 points.
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => {
            const questionScore = scores[question.question_id];
            const isSubmitted = !!questionScore;
            const isSubmitting = submitting === question.question_id;

            return (
              <div
                key={question.question_id}
                className="border border-[#FF6B00]/30 bg-black/50 p-6 rounded-lg"
              >
                {/* Question Header */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#FF6B00]">
                    {question.title}
                  </h3>
                </div>

                {/* Question Text */}
                <div className="mb-4 whitespace-pre-wrap text-gray-300">
                  {question.question_text}
                </div>

                {/* Answer Input */}
                <div className="space-y-3">
                  <label className="block text-sm text-gray-400">
                    Your Answer:
                  </label>
                  <textarea
                    value={answers[question.question_id] || ''}
                    onChange={(e) => saveAnswer(question.question_id, e.target.value)}
                    disabled={isSubmitted}
                    placeholder="Enter your answer here..."
                    className="w-full h-32 bg-black/70 border border-[#FF6B00]/30 rounded p-3 text-white placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-[#FF6B00]"
                  />
                  
                  <MissionButton
                    onClick={() => handleSubmitAnswer(question.question_id)}
                    disabled={isSubmitted || isSubmitting || !answers[question.question_id]?.trim()}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : isSubmitted ? (
                      'Submitted'
                    ) : (
                      'Submit Answer'
                    )}
                  </MissionButton>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final Submit */}
        {answeredCount > 0 && (
          <div className="mt-8 p-6 border border-green-500/30 bg-green-500/10 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-green-400 mb-1">
                  Ready to Submit Round 1?
                </h3>
                <p className="text-gray-400">
                  Answered: <span className="font-bold text-white">{answeredCount}/{questions.length}</span>
                </p>
              </div>
              <MissionButton
                onClick={handleFinalSubmit}
                disabled={finalSubmitting || isRoundLocked || !!teamData?.r1_submission_time}
                className="bg-green-600 hover:bg-green-700"
              >
                {finalSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : teamData?.r1_submission_time ? (
                  'Submitted'
                ) : (
                  'Submit Round 1'
                )}
              </MissionButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
