"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Loader2 } from "lucide-react";
import { MissionButton } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import { getQuestionDetails, type RoundQuestion } from "@/../../shared/src/index";
import dynamic from "next/dynamic";

// Dynamically import Monaco Editor to prevent SSR issues
const MonacoEditor = dynamic(() => import("./monaco-editor"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-black border border-[#FF6B00]/30 rounded flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
    </div>
  ),
});

interface Round3QuestionWorkspaceProps {
  questionId: string;
  questionNumber: string;
}

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "javascript", label: "JavaScript" },
] as const;

type Language = typeof LANGUAGES[number]["value"];

export function Round3QuestionWorkspace({
  questionId,
  questionNumber,
}: Round3QuestionWorkspaceProps) {
  const router = useRouter();
  const { user } = useAuth();
  const teamId = user?.teamId || "guest";

  const [question, setQuestion] = useState<RoundQuestion | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [language, setLanguage] = useState<Language>("python");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const hasAutoSubmitted = useRef(false);
  const [roundState, setRoundState] = useState<{ Flag: number; end_time: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const storageKey = `round3_q${questionNumber}_start_time_${teamId}`;
  const draftKey = `round3_q${questionNumber}_draft_${teamId}`;
  const submittedKey = `round3_q${questionNumber}_submitted_${teamId}`;
  const [currentFlag, setCurrentFlag] = useState<number | null>(null);

  // Fetch round state from backend to get Flag and determine which question to show
  useEffect(() => {
    const fetchRoundState = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/contest/rounds/state`
        );
        if (response.ok) {
          const rounds = await response.json();
          const round3 = rounds.find((r: any) => r.id === "round3");
          if (round3) {
            setRoundState({ Flag: round3.Flag, end_time: round3.end_time });
            
            // Fetch question based on Flag (1, 2, or 3 maps to r3-q1, r3-q2, r3-q3)
            if (round3.Flag > 0) {
              const questionIdFromFlag = `r3-q${round3.Flag}`;
              const fetchedQuestion = getQuestionDetails("round3", questionIdFromFlag);
              setQuestion(fetchedQuestion);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch round state:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoundState();
    // Poll every 10 seconds to check for updates
    const interval = setInterval(fetchRoundState, 10000);
    return () => clearInterval(interval);
  }, []);

  // Clear submitted state when Flag (subround) changes
  useEffect(() => {
    if (roundState?.Flag && currentFlag !== null && roundState.Flag !== currentFlag) {
      // Flag has changed, clear the submitted state
      setSubmitted(false);
      setScore(null);
      setAnalysis(null);
      setPreviousScore(null);
      setError(null);
      setCodeInput("");
      hasAutoSubmitted.current = false;
      
      // Clear localStorage draft for the previous question
      const prevDraftKey = `round3_q${currentFlag}_draft_${teamId}`;
      localStorage.removeItem(prevDraftKey);
      
      // Check submission status for new question
      checkSubmissionStatus();
    }
    
    // Update current flag
    if (roundState?.Flag) {
      setCurrentFlag(roundState.Flag);
    }
  }, [roundState?.Flag, currentFlag, teamId]);

  // Calculate time left from end_time (server-authoritative)
  useEffect(() => {
    if (!roundState?.end_time) {
      setTimeLeft(0);
      setIsExpired(true);
      return;
    }

    const calculateTimeLeft = () => {
      const endTime = new Date(roundState.end_time!).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        setIsExpired(true);
        if (!submitted && !hasAutoSubmitted.current) {
          hasAutoSubmitted.current = true;
          handleSubmit(true);
        }
      } else {
        setIsExpired(false);
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    intervalRef.current = setInterval(calculateTimeLeft, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [roundState?.end_time, submitted]);

  // Format time as MM:SS
  const formattedTime = (() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  })();

  // Load draft and check submission status from backend
  useEffect(() => {
    if (typeof window === "undefined") return;

    const draft = localStorage.getItem(draftKey);
    if (draft) {
      setCodeInput(draft);
    }

    // Check submission status from backend timestamp
    if (roundState?.Flag) {
      checkSubmissionStatus();
    }
  }, [draftKey, roundState?.Flag]);

  // Check if already submitted by checking timestamp from backend
  const checkSubmissionStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/contest/teams/${teamId}`,
        {
          headers: {
            "x-session-id": localStorage.getItem("sessionId") || "",
          },
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        const teamData = result.team || result; // Handle both wrapped and unwrapped responses
        const timestampKey = `round3_${roundState?.Flag}_timestamp`;
        const hasTimestamp = teamData[timestampKey] !== null && teamData[timestampKey] !== undefined;
        
        console.log('[Round3] Checking submission status:', { timestampKey, value: teamData[timestampKey], hasTimestamp });
        
        setSubmitted(hasTimestamp);
        
        if (hasTimestamp) {
          fetchExistingScore();
        }
      }
    } catch (error) {
      console.error("Failed to check submission status:", error);
    }
  };

  // Fetch existing score from backend
  const fetchExistingScore = async () => {
    setLoadingScore(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/contest/round3/score?team_id=${teamId}&question_id=round3_${roundState?.Flag}`,
        {
          headers: {
            "x-session-id": localStorage.getItem("sessionId") || "",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.score !== null) {
          setScore(data.score);
        }
      }
    } catch (error) {
      console.error("Failed to fetch existing score:", error);
    } finally {
      setLoadingScore(false);
    }
  };

  // Auto-save draft every 5 seconds
  useEffect(() => {
    if (submitted) return;

    const interval = setInterval(() => {
      if (codeInput) {
        localStorage.setItem(draftKey, codeInput);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [codeInput, draftKey, submitted]);

  // Submit handler
  const handleSubmit = useCallback(
    async (autoSubmitted = false) => {
      if (submitted || submitting) return;

      setSubmitting(true);
      setError(null);

      try {
        // Determine the correct question_id based on Flag
        // Flag 1, 2, 3 map to round3_1, round3_2, round3_3
        const questionIdForBackend = `round3_${roundState?.Flag || 1}`;
        
        // API call stub - replace with actual endpoint
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/contest/round3/submit`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-session-id": localStorage.getItem("sessionId") || "",
            },
            body: JSON.stringify({
              team_id: teamId,
              question_id: questionIdForBackend,
              language,
              answer: codeInput,
              auto_submitted: autoSubmitted,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.message || errorData.error || "Submission failed");
          return;
        }

        const result = await response.json();
        console.log("[Round3 Submit] Success:", result);

        setSubmitted(true);
        // Round 3 now uses manual evaluation - no immediate score
        setScore(null);
        setAnalysis("Your submission has been received and is awaiting manual evaluation by the admin team. Scores will be updated after review.");
        setPreviousScore(null);
        localStorage.removeItem(draftKey);
      } catch (err) {
        console.error("[Round3 Submit] Error:", err);
        setError(err instanceof Error ? err.message : "Submission failed");
      } finally {
        setSubmitting(false);
      }
    },
    [submitted, submitting, teamId, roundState, language, codeInput, submittedKey, draftKey]
  );

  // Timer color based on time left
  const getTimerColor = () => {
    if (timeLeft <= 60) return "text-red-500"; // < 1 minute
    if (timeLeft <= 300) return "text-orange-500"; // < 5 minutes
    return "text-[#FF6B00]";
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 relative z-10 mt-8">
        <div className="max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/70">Loading Round 3 question...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show message if no question is active
  if (!roundState || roundState.Flag === 0 || !question) {
    return (
      <div className="container mx-auto px-4 py-8 relative z-10 mt-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#FF6B00]/80 hover:text-[#FF6B00] transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm uppercase tracking-wider">Back</span>
          </button>
          
          <div className="bg-black border border-[#FF6B00]/20 rounded p-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Round 3 Not Active</h2>
            <p className="text-white/70">
              No Round 3 question is currently active. Please wait for the admin to start a question.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 relative z-10 mt-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header with Timer */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#FF6B00]/80 hover:text-[#FF6B00] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm uppercase tracking-wider">Back</span>
          </button>

          {/* Timer Display */}
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 bg-black/40 border rounded",
              getTimerColor(),
              "border-current/30"
            )}
          >
            <Clock className="w-5 h-5" />
            <span className="text-xl font-mono font-bold">{formattedTime}</span>
            {isExpired && (
              <span className="ml-2 text-xs uppercase tracking-wider">EXPIRED</span>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white uppercase tracking-wider">
            Round 3: {question?.title || "Loading..."}
          </h1>
          <p className="text-[#FF6B00]/80 text-sm uppercase tracking-widest">
            Phase 3 – 1v1 Face-Off | Top 8 Teams
          </p>
        </div>

        {/* Question Description Card with Image */}
        <div className="bg-black border border-[#FF6B00]/20 rounded p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Problem Statement</h2>

            {/* Problem Illustration */}
            {question?.referenceNotes && (
              <div className="flex justify-center">
                <img
                  src={question.referenceNotes}
                  alt={`${question.title} illustration`}
                  className="max-h-[300px] w-auto rounded border border-[#FF6B00]/30 shadow-lg shadow-[#FF6B00]/10"
                />
              </div>
            )}

            {/* Problem Description */}
            <div className="text-gray-300 space-y-4 leading-relaxed">
              <p className="text-lg font-semibold text-white">{question?.title}:</p>
              
              {question?.prompt.split('\n').map((paragraph, idx) => (
                <p key={idx} className={paragraph.startsWith('**') ? 'text-yellow-400 font-semibold' : ''}>
                  {paragraph.replace(/\*\*/g, '').replace(/`([^`]+)`/g, (_, code) => code)}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Code Editor Section */}
        <div className="bg-black border border-[#FF6B00]/20 rounded p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Your Solution</h2>
            
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              disabled={submitted || isExpired}
              className="bg-black/50 border border-[#FF6B00]/30 text-white px-4 py-2 rounded focus:outline-none focus:border-[#FF6B00] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Code Editor */}
          <MonacoEditor
            value={codeInput}
            onChange={setCodeInput}
            language={language}
            disabled={submitted || isExpired}
          />

          {/* Submission Status */}
          {submitted && (
            <div className="bg-green-500/10 border border-green-500/30 rounded p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="font-semibold uppercase tracking-wider">SUBMITTED</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-4 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <MissionButton
              onClick={() => handleSubmit(false)}
              disabled={submitted || submitting || isExpired || !codeInput.trim()}
              className="min-w-[200px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : submitted ? (
                "Submitted"
              ) : (
                "SUBMIT ANSWER"
              )}
            </MissionButton>
          </div>
        </div>

        {/* Instructions */}
        {!submitted && !isExpired && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-4">
            <p className="text-yellow-400 text-sm text-center">
              <strong>Note:</strong> You may submit working code OR a plain English algorithm explanation. 
              Your submission will be auto-submitted when the timer reaches zero.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
