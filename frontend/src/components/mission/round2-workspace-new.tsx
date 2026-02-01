"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { MissionButton } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { contestApi } from "@/lib/api-client";

interface Round2Question {
  question_id: number;
  title: string;
  description: string;
  code_snippet: string;
  code_snippets?: {
    python?: string;
    c?: string;
    cpp?: string;
    java?: string;
  };
}

interface EvaluationResult {
  score: number | null;
  answer: string;
  language: string;
  status: 'pending' | 'completed';
  submittedAt: string;
}

type Round2WorkspaceNewProps = {
  roundId: string;
};

const STORAGE_KEY = 'round2_scores';
const STORAGE_ANSWERS_KEY = 'round2_answers';

export function Round2WorkspaceNew({ roundId }: Round2WorkspaceNewProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [questions, setQuestions] = useState<Round2Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [scores, setScores] = useState<Record<number, EvaluationResult>>({});
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [finalSubmitting, setFinalSubmitting] = useState(false);
  const [isRoundLocked, setIsRoundLocked] = useState(false);
  // Track language selection for each question
  const [questionLanguages, setQuestionLanguages] = useState<Record<number, string>>({});

  // Load questions and check if round is locked
  useEffect(() => {
    const loadData = async () => {
      try {
        // CRITICAL: Check if round is already completed
        if (user?.teamId) {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/contest/teams/${user.teamId}`);
            if (response.ok) {
              const teamData = await response.json();
              if (teamData.team?.r2_submission_time) {
                console.log('[Round2] Round already completed, redirecting...');
                setIsRoundLocked(true);
                alert('Round 2 has already been submitted and is locked.');
                router.push('/mission');
                return;
              }
            }
          } catch (error) {
            console.error('[Round2] Failed to check round status:', error);
          }
        }
        
        // Fetch questions from backend
        const response = await contestApi.getRound2Questions();
        setQuestions(response.questions);
        
        // Load stored scores from individual localStorage keys (round2_question_<N>_score)
        const loadedScores: Record<number, EvaluationResult> = {};
        response.questions.forEach(q => {
          const storedScore = localStorage.getItem(`round2_question_${q.question_id}_score`);
          if (storedScore) {
            try {
              loadedScores[q.question_id] = JSON.parse(storedScore);
            } catch (e) {
              console.error(`Failed to parse score for question ${q.question_id}:`, e);
            }
          }
        });
        
        if (Object.keys(loadedScores).length > 0) {
          setScores(loadedScores);
        }
        
        // Also load legacy stored scores and answers from localStorage (for backward compatibility)
        const storedScores = localStorage.getItem(STORAGE_KEY);
        const storedAnswers = localStorage.getItem(STORAGE_ANSWERS_KEY);
        
        if (storedScores && Object.keys(loadedScores).length === 0) {
          try {
            setScores(JSON.parse(storedScores));
          } catch (e) {
            console.error('Failed to parse stored scores:', e);
          }
        }
        
        if (storedAnswers) {
          try {
            setAnswers(JSON.parse(storedAnswers));
          } catch (e) {
            console.error('Failed to parse stored answers:', e);
          }
        }

        // Fetch evaluations from backend to get latest scores
        if (user?.teamId) {
          try {
            const evalResponse = await contestApi.getTeamEvaluations(user.teamId, 'round2');
            const evaluationMap: Record<number, EvaluationResult> = {};
            
            evalResponse.evaluations.forEach(evaluation => {
              const questionId = parseInt(evaluation.question_id);
              evaluationMap[questionId] = {
                score: evaluation.score,
                answer: storedAnswers ? JSON.parse(storedAnswers)[questionId] || '' : '',
                language: 'python', // Default, we don't store this in evaluation table
                status: evaluation.status as 'pending' | 'completed',
                submittedAt: evaluation.submission_time
              };
            });
            
            // Merge with stored scores, preferring backend data
            setScores(prev => ({ ...prev, ...evaluationMap }));
          } catch (error) {
            console.error('[Round2] Failed to fetch evaluations:', error);
          }
        }
      } catch (error) {
        console.error('Failed to load Round 2 questions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.teamId]);

  // Auto-save answers to localStorage
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(STORAGE_ANSWERS_KEY, JSON.stringify(answers));
    }
  }, [answers]);

  // Auto-save scores to localStorage
  useEffect(() => {
    if (Object.keys(scores).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    }
  }, [scores]);

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmitAnswer = useCallback(async (questionId: number) => {
    const answer = answers[questionId];
    
    if (!answer || !answer.trim()) {
      alert('Please provide an answer before submitting.');
      return;
    }

    setSubmitting(questionId);

    try {
      // Get the selected language for this question (default to python)
      const language = questionLanguages[questionId] || 'python';
      
      const response = await contestApi.submitRound2Answer(
        user?.teamId || 'unknown',
        questionId,
        answer,
        language
      );
      
      const timestamp = new Date().toISOString();
      
      // Store the evaluation result with pending status
      const evaluationResult: EvaluationResult = {
        score: null,
        answer: answer,
        language: language,
        status: 'pending',
        submittedAt: timestamp
      };
      
      setScores(prev => ({
        ...prev,
        [questionId]: evaluationResult
      }));
      
      // Also store in localStorage with key format: round2_question_<N>_score
      localStorage.setItem(`round2_question_${questionId}_score`, JSON.stringify(evaluationResult));

      // Success - no alert, user sees result in UI
    } catch (error) {
      console.error('Failed to submit answer:', error);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(null);
    }
  }, [answers, questionLanguages, user]);

  const handleFinalSubmit = useCallback(async () => {
    // Allow submission even if not all questions are answered
    // Users can submit with a score of 0 if they haven't answered anything
    
    if (!user?.teamId) {
      alert('User team ID not found.');
      return;
    }

    setFinalSubmitting(true);

    try {
      // Get current timestamp
      const submittedAt = new Date().toISOString();

      // Submit to backend (only timestamp, no score)
      await contestApi.submitRound2({
        teamId: user.teamId,
        submitted_at: submittedAt
      });

      alert(`Round 2 submitted successfully! Awaiting admin evaluation.`);
      
      // Optionally clear storage after successful submission
      // localStorage.removeItem(STORAGE_KEY);
      // localStorage.removeItem(STORAGE_ANSWERS_KEY);
      
      // Navigate back or to results page
      // router.push('/mission');
    } catch (error) {
      console.error('Failed to submit Round 2:', error);
      alert('Failed to submit Round 2. Please try again.');
    } finally {
      setFinalSubmitting(false);
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const answeredCount = Object.keys(scores).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/mission')}
                className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-cyan-400">Round 2: Debug & Error Identification</h1>
                <p className="text-sm text-zinc-400 mt-1">20 teams, 10 questions per team — 100 marks</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-zinc-400">Progress</div>
              <div className="text-xl font-bold text-cyan-400">{answeredCount}/{questions.length} Submitted</div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="container mx-auto px-6 py-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-cyan-400 mb-3">Instructions</h2>
          <div className="text-sm text-zinc-300 space-y-2">
            <p>• Each question contains a code snippet with bug(s)</p>
            <p>• Identify the bug(s), explain what's wrong, and how to fix it</p>
            <p>• Submit each answer individually for manual admin evaluation</p>
            <p>• Scores will be updated once admin reviews your submissions</p>
            <p>• After submitting all answers, click final submit to record your timestamp</p>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => {
            const questionScore = scores[question.question_id];
            const isSubmitted = questionScore !== undefined;
            const isSubmitting = submitting === question.question_id;
            const hasMultiLanguage = question.code_snippets !== undefined;
            const currentLanguage = questionLanguages[question.question_id] || 'Python';
            
            // Determine which code snippet to display
            let displayCode = question.code_snippet;
            if (hasMultiLanguage && question.code_snippets) {
              const langKey = currentLanguage.toLowerCase() === 'c++' ? 'cpp' : currentLanguage.toLowerCase();
              displayCode = question.code_snippets[langKey as keyof typeof question.code_snippets] || question.code_snippet;
            }

            return (
              <div
                key={question.question_id}
                className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-lg font-bold text-cyan-400">
                        Question {question.question_id}: {question.title}
                      </h3>
                      {hasMultiLanguage && (
                        <select
                          value={currentLanguage}
                          onChange={(e) => setQuestionLanguages(prev => ({
                            ...prev,
                            [question.question_id]: e.target.value
                          }))}
                          className="px-3 py-1.5 text-sm font-semibold bg-zinc-950 border border-zinc-700 rounded text-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        >
                          <option value="Python">Python</option>
                          <option value="C">C</option>
                          <option value="C++">C++</option>
                          <option value="Java">Java</option>
                        </select>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">{question.description}</p>
                  </div>
                </div>

                {/* Code Snippet */}
                <div className="bg-zinc-950 border border-zinc-800 rounded p-4 mb-4 overflow-x-auto">
                  <pre className="text-sm text-zinc-300 font-mono whitespace-pre">
                    {displayCode}
                  </pre>
                </div>

                {/* Answer Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Your Answer (Identify bug(s) and explain):
                  </label>
                  <textarea
                    value={answers[question.question_id] || ''}
                    onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                    disabled={isSubmitted}
                    placeholder="Describe the bug(s), what's wrong, and how to fix it..."
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    rows={4}
                  />
                </div>

                {/* Evaluation Result Display */}
                {isSubmitted && questionScore && (
                  <div className="mb-4 bg-zinc-950 border border-zinc-700 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-cyan-400 mb-3">Evaluation Result</h4>
                    
                    {/* Analysis */}
                    <div>
                      <div className="text-sm text-zinc-300 whitespace-pre-wrap">{questionScore.analysis}</div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <MissionButton
                  onClick={() => handleSubmitAnswer(question.question_id)}
                  disabled={isSubmitted || isSubmitting || !answers[question.question_id]?.trim()}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {isSubmitted ? 'Submitted' : 'Submit Answer'}
                </MissionButton>
              </div>
            );
          })}
        </div>

        {/* Final Submit */}
        <div className="mt-8 bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-cyan-400">Final Submission</h3>
              <p className="text-sm text-zinc-400 mt-1">
                Answered: {answeredCount}/{questions.length}
              </p>
            </div>
            <MissionButton
              onClick={handleFinalSubmit}
              disabled={finalSubmitting}
              variant="primary"
            >
              {finalSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Submit Round 2
            </MissionButton>
          </div>
        </div>
      </div>
    </div>
  );
}
