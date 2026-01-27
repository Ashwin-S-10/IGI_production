"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { MissionButton } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { contestApi } from "@/lib/api-client";

interface Question {
  question_id: number;
  title: string;
  question_text: string;
}

interface QuestionScore {
  score: number;
  answer: string;
  analysis?: string;
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

  // Load questions and stored data
  useEffect(() => {
    const loadData = async () => {
      try {
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
      } catch (error) {
        console.error('[Round1] Failed to load questions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
      // Submit to backend for Gemini evaluation (returns score + analysis)
      const response = await contestApi.evaluateRound1Answer(
        user?.email || 'unknown',
        question.question_text,
        answer
      );
      
      // Store score and analysis in state and localStorage
      const newScore: QuestionScore = {
        score: response.score,
        answer: answer,
        analysis: response.analysis
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
    const totalScore = Object.values(scores).reduce((sum: number, s: QuestionScore) => sum + s.score, 0);
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
        round_id: 1,
        total_score: totalScore,
        submitted_at: timestamp
      });

      alert(`Round 1 submitted successfully!\nTotal Score: ${totalScore}/${questions.length * 10}`);
      
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

  const totalScore = Object.values(scores).reduce((sum, s) => sum + s.score, 0);
  const maxScore = questions.length * 10;
  const answeredCount = Object.keys(scores).length;

  return (
    <div className="relative min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-[#FF6B00]/20 bg-black/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/mission')}
              className="flex items-center gap-2 text-[#FF6B00] hover:text-white hover:bg-[#FF6B00]/20 px-4 py-2 rounded-lg border border-[#FF6B00]/30 hover:border-[#FF6B00] transition-all duration-300"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm uppercase tracking-wider font-semibold">Back to Mission</span>
            </button>
            
            <div className="text-right">
              <div className="text-sm text-gray-400">Progress</div>
              <div className="text-lg font-bold text-[#FF6B00]">
                {answeredCount}/{questions.length} Questions
              </div>
              <div className="text-sm text-gray-400">
                Score: {totalScore}/{maxScore}
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
            "Write your solutions clearly. Show your logic. The AI is watching."
          </p>
          <p className="text-gray-400">
            Answer each question and submit for AI scoring. Each question is worth 0-10 points.
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
                  {isSubmitted && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Score:</span>
                      <span className="text-2xl font-bold text-green-400">
                        {questionScore.score}/10
                      </span>
                    </div>
                  )}
                </div>

                {/* Question Text */}
                <div className="mb-4 whitespace-pre-wrap text-gray-300">
                  {question.question_text}
                </div>

                {/* Gemini Analysis (shown after submission) */}
                {isSubmitted && questionScore.analysis && (
                  <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded">
                    <div className="text-sm font-semibold text-blue-400 mb-2">Analysis</div>
                    <div className="text-sm text-gray-300">{questionScore.analysis}</div>
                  </div>
                )}

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
                        Scoring...
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
                  Total Score: <span className="font-bold text-white">{totalScore}/{maxScore}</span>
                  {' · '}
                  Answered: <span className="font-bold text-white">{answeredCount}/{questions.length}</span>
                </p>
              </div>
              <MissionButton
                onClick={handleFinalSubmit}
                disabled={finalSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {finalSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
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
